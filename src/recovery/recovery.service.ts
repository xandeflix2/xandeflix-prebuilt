/**
 * Xandeflix Prebuilt — Recovery Service (Gate G10)
 *
 * Serviço de validação de startup, integridade de snapshot ativo e recuperação last-known-good.
 *
 * Princípios e Garantias:
 * - STARTUP_ACTIVE_VALIDATION = REQUIRED
 * - RECOVERY_BASELINE = ACTIVE_PLUS_PREVIOUS_KNOWN_GOOD
 * - RECOVERY_MINIMUM_GENERATIONS = 2
 * - RECOVERY_NETWORK = NONE (Recuperação estritamente local)
 * - NO_FALSE_EMPTY_DURING_RECOVERY = PASS (Corrupção nunca gera catálogo vazio)
 * - RECOVERY_IDEMPOTENT = PASS
 * - RECOVERY_POINTER_WRITE_FAILURE_SAFE = PASS
 */

import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { isValidActivePointer, createActivePointer } from '../bootstrap/active-snapshot.ts';
import { RecoveryJournalManager } from './recovery-journal.ts';
import { SnapshotIntegrityValidator } from './snapshot-integrity.ts';
import { RecoveryErrorCodes } from './recovery-errors.ts';
import type { RecoveryResult } from './recovery.types.ts';
import { sanitizeLogText } from '../security/security-redaction.ts';

export class RecoveryService {
  private storage: LocalCatalogStorage;
  private journalManager: RecoveryJournalManager;
  private integrityValidator = new SnapshotIntegrityValidator();

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
    this.journalManager = new RecoveryJournalManager(storage);
  }

  /**
   * Executa a validação de inicialização do snapshot ativo e, em caso de corrupção,
   * dispara a recuperação last-known-good atômica e fail-closed.
   */
  async validateOrRecoverActive(): Promise<RecoveryResult> {
    const totalStart = Date.now();
    const errors: string[] = [];

    const scanStart = Date.now();
    const activePointer = await this.storage.readActivePointer();
    const journal = await this.journalManager.readJournal();

    let isPointerValid = false;
    let activeSnapshotId: string | null = null;

    if (isValidActivePointer(activePointer)) {
      isPointerValid = true;
      activeSnapshotId = activePointer.snapshotId;
    } else {
      errors.push(`[${RecoveryErrorCodes.ACTIVE_POINTER_INVALID}] Ponteiro ativo ausente ou com estrutura inválida`);
    }

    // Se o ponteiro for estruturalmente válido, valida a integridade profunda do snapshot
    let isActiveSnapshotValid = false;
    if (isPointerValid && activeSnapshotId) {
      const activeCheck = await this.integrityValidator.validateSnapshot(this.storage, activeSnapshotId);
      if (activeCheck.valid) {
        isActiveSnapshotValid = true;
      } else {
        for (const err of activeCheck.errors) {
          errors.push(`[${RecoveryErrorCodes.ACTIVE_SNAPSHOT_INVALID}] ${sanitizeLogText(err)}`);
        }
      }
    }
    const scanMs = Date.now() - scanStart;

    // Caso 1: Ativo íntegro e validado
    if (isPointerValid && isActiveSnapshotValid && activeSnapshotId) {
      return {
        status: 'ACTIVE_READY',
        activeSnapshotId,
        errors: [],
        metrics: {
          scanMs,
          recoveryMs: 0,
          totalMs: Date.now() - totalStart,
        },
      };
    }

    // Caso 2: Falha detectada no snapshot ativo ou no ponteiro -> Inicia recuperação last-known-good
    const recoveryStart = Date.now();

    // Determina a lista de snapshots candidatos a recuperação através do journal
    const candidates: string[] = [];
    if (!activeSnapshotId) {
      // Ponteiro ativo ausente ou malformado: prioriza lastKnownGood e active registrado no journal
      if (journal?.lastKnownGoodSnapshotId) candidates.push(journal.lastKnownGoodSnapshotId);
      if (journal?.activeSnapshotId && !candidates.includes(journal.activeSnapshotId)) candidates.push(journal.activeSnapshotId);
      if (journal?.previousSnapshotId && !candidates.includes(journal.previousSnapshotId)) candidates.push(journal.previousSnapshotId);
    } else {
      // Snapshot ativo corrompido: busca alternativas diferentes do snapshot ativo corrompido
      if (journal?.previousSnapshotId && journal.previousSnapshotId !== activeSnapshotId) {
        candidates.push(journal.previousSnapshotId);
      }
      if (
        journal?.lastKnownGoodSnapshotId &&
        journal.lastKnownGoodSnapshotId !== activeSnapshotId &&
        !candidates.includes(journal.lastKnownGoodSnapshotId)
      ) {
        candidates.push(journal.lastKnownGoodSnapshotId);
      }
    }

    // Se não há nenhum candidato conhecido
    if (candidates.length === 0) {
      const recoveryMs = Date.now() - recoveryStart;
      errors.push(`[${RecoveryErrorCodes.NO_VALID_LOCAL_SNAPSHOT}] Nenhum snapshot previous known-good registrado no recovery journal`);
      return {
        status: 'NO_VALID_LOCAL_SNAPSHOT',
        activeSnapshotId: null,
        errors,
        metrics: {
          scanMs,
          recoveryMs,
          totalMs: Date.now() - totalStart,
        },
      };
    }

    // Itera sobre os candidatos até encontrar um snapshot íntegro
    let validCandidateId: string | null = null;
    let validCandidateData: {
      manifest: import('../provisioning/types.ts').ProvisioningManifest;
      catalog: import('../contracts/catalog.ts').PrebuiltCatalog;
      searchIndex?: import('../search/search-index.types.ts').PrebuiltSearchIndex | null;
    } | null = null;

    for (const candidateId of candidates) {
      const candidateCheck = await this.integrityValidator.validateSnapshot(this.storage, candidateId);
      if (candidateCheck.valid && this.storage.readSnapshot) {
        const data = await this.storage.readSnapshot(candidateId);
        if (data) {
          validCandidateId = candidateId;
          validCandidateData = data;
          break;
        }
      } else {
        errors.push(`[${RecoveryErrorCodes.PREVIOUS_SNAPSHOT_INVALID}] Snapshot candidato '${candidateId}' falhou na validação de integridade`);
      }
    }

    if (!validCandidateId || !validCandidateData) {
      const recoveryMs = Date.now() - recoveryStart;
      errors.push(`[${RecoveryErrorCodes.NO_VALID_LOCAL_SNAPSHOT}] Nenhum snapshot válido encontrado para recuperação`);
      return {
        status: 'NO_VALID_LOCAL_SNAPSHOT',
        activeSnapshotId: null,
        errors,
        metrics: {
          scanMs,
          recoveryMs,
          totalMs: Date.now() - totalStart,
        },
      };
    }

    const recoveredPointer = createActivePointer(validCandidateData.manifest);

    try {
      await this.storage.writeActivePointer(recoveredPointer);
    } catch (writeErr) {
      const recoveryMs = Date.now() - recoveryStart;
      errors.push(`[${RecoveryErrorCodes.POINTER_WRITE_FAILED}] Falha atômica ao gravar ponteiro ativo durante recovery: ${String(writeErr)}`);
      return {
        status: 'NO_VALID_LOCAL_SNAPSHOT',
        activeSnapshotId: null,
        errors,
        metrics: {
          scanMs,
          recoveryMs,
          totalMs: Date.now() - totalStart,
        },
      };
    }

    // Atualiza o diário atômico de recuperação
    await this.journalManager.recordRecovery(validCandidateId, activeSnapshotId);

    const recoveryMs = Date.now() - recoveryStart;
    return {
      status: 'RECOVERY_SUCCEEDED',
      activeSnapshotId: validCandidateId,
      recoveredSnapshotId: validCandidateId,
      errors: [],
      metrics: {
        scanMs,
        recoveryMs,
        totalMs: Date.now() - totalStart,
      },
    };
  }
}

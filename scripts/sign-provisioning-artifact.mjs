#!/usr/bin/env node

/**
 * Xandeflix Prebuilt — Artifact Signing CLI Tool (Gate G10)
 *
 * Assina externamente artefatos pré-construídos gerando o envelope de segurança canônico.
 *
 * Princípios de Segurança:
 * - PRIVATE_SIGNING_KEY_IN_REPO = PROHIBITED
 * - PRIVATE_SIGNING_KEY_EXTERNAL_ONLY = PASS
 * - Chave privada recebida ESTRITAMENTE de fonte externa (--private-key-path ou PREBUILT_SIGNING_PRIVATE_KEY_PATH).
 * - Logs sanitizados sem expor caminhos sensíveis ou material confidencial.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { signArtifact } from '../src/security/artifact-signer.ts';
import { sanitizeLogText } from '../src/security/security-redaction.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    artifactPath: '',
    artifactType: 'FULL_PACKAGE_V2',
    keyId: '',
    privateKeyPath: process.env.PREBUILT_SIGNING_PRIVATE_KEY_PATH || '',
    outputPath: '',
    snapshotId: '',
    baseSnapshotId: '',
    targetSnapshotId: '',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--artifact' && i + 1 < args.length) {
      options.artifactPath = args[++i];
    } else if (arg === '--type' && i + 1 < args.length) {
      options.artifactType = args[++i];
    } else if (arg === '--key-id' && i + 1 < args.length) {
      options.keyId = args[++i];
    } else if (arg === '--private-key-path' && i + 1 < args.length) {
      options.privateKeyPath = args[++i];
    } else if (arg === '--out' && i + 1 < args.length) {
      options.outputPath = args[++i];
    } else if (arg === '--snapshot-id' && i + 1 < args.length) {
      options.snapshotId = args[++i];
    } else if (arg === '--base-snapshot-id' && i + 1 < args.length) {
      options.baseSnapshotId = args[++i];
    } else if (arg === '--target-snapshot-id' && i + 1 < args.length) {
      options.targetSnapshotId = args[++i];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  if (!options.artifactPath) {
    console.error('[SIGN_ERROR] Parâmetro obrigatório ausente: --artifact <caminho_do_arquivo>');
    process.exit(1);
  }

  if (!options.keyId) {
    console.error('[SIGN_ERROR] Parâmetro obrigatório ausente: --key-id <identificador_da_chave>');
    process.exit(1);
  }

  if (!options.privateKeyPath) {
    console.error(
      '[SIGN_ERROR] Chave privada ausente. Forneça --private-key-path <caminho> ou configure PREBUILT_SIGNING_PRIVATE_KEY_PATH.'
    );
    console.error('[SECURITY_POLICY] Chaves privadas são estritamente externas e proibidas de residir no repositório.');
    process.exit(1);
  }

  const resolvedArtifact = path.resolve(process.cwd(), options.artifactPath);
  if (!fs.existsSync(resolvedArtifact)) {
    console.error(`[SIGN_ERROR] Arquivo de artefato não encontrado: ${resolvedArtifact}`);
    process.exit(1);
  }

  const resolvedKey = path.resolve(process.cwd(), options.privateKeyPath);
  if (!fs.existsSync(resolvedKey)) {
    console.error('[SIGN_ERROR] Arquivo de chave privada externa não encontrado.');
    process.exit(1);
  }

  const artifactBytes = fs.readFileSync(resolvedArtifact);
  const privateKeyPem = fs.readFileSync(resolvedKey, 'utf8');

  const outputPath = options.outputPath
    ? path.resolve(process.cwd(), options.outputPath)
    : `${resolvedArtifact}.sig.json`;

  console.log(`[SIGN] Assinando artefato: ${path.basename(resolvedArtifact)} (${artifactBytes.length} bytes)`);
  console.log(`[SIGN] Tipo: ${options.artifactType}, KeyId: ${options.keyId}, Algoritmo: ECDSA_P256_SHA256`);

  const result = signArtifact({
    artifactBytes,
    artifactType: options.artifactType,
    keyId: options.keyId,
    privateKeyPem,
    artifactIdentity: path.basename(resolvedArtifact),
    snapshotId: options.snapshotId || undefined,
    baseSnapshotId: options.baseSnapshotId || undefined,
    targetSnapshotId: options.targetSnapshotId || undefined,
  });

  fs.writeFileSync(outputPath, JSON.stringify(result.envelope, null, 2), 'utf8');

  console.log(
    sanitizeLogText(`[SIGN_SUCCESS] Envelope gravado em: ${outputPath} em ${result.durationMs}ms`)
  );
  console.log(`[SIGN_SUCCESS] SHA-256: ${result.envelope.artifactSha256}`);
}

main().catch((err) => {
  console.error(sanitizeLogText(`[SIGN_FATAL] ${err.message}`));
  process.exit(1);
});

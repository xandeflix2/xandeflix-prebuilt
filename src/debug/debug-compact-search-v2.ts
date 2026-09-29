/**
 * Xandeflix Prebuilt — Debug Compact Search V2 Physical Benchmark (Experiment R4/R5)
 *
 * Módulo de validação física exclusivo para builds de depuração (DEBUG_ONLY).
 * Executa medições determinísticas de load, latências de consulta (Exact, Prefix,
 * Multi, Partial, NoResult) e descarte em hardware real (Fire TV Stick AFTSSS).
 *
 * R5: Compara Candidate C (Full Scoring) com Candidate D (Pruned Engine).
 *
 * Princípios:
 * - DEBUG_ONLY = SIM (descartado via tree-shaking em builds de produção/release)
 * - DETERMINISTIC_DATASET = SIM (utiliza catálogo sintético 240k)
 * - NO_PRODUCTION_TOUCH = SIM (não altera SearchEngine canônico nem bootstrap)
 */

import { CompactSearchEngineV2 } from '../experiments/search-compact-v2/compact-search-v2-engine.ts';
import { CompactSearchEngineV2Pruned } from '../experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { deserializeCompactIndexV2 } from '../experiments/search-compact-v2/compact-search-v2-serializer.ts';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export interface PhysicalQueryMetrics {
  minMs: number;
  medianMs: number;
  maxMs: number;
  p95Ms: number;
  runs: number[];
  candidateCount: number;
  scoredCandidates: number;
  prunedCount: number;
  prunedPercent: string;
  topKReturned: number;
  top1Id?: string;
  top1Score?: number;
  top1MatchClass?: string;
}

export interface PhysicalComparisonResult {
  engineC: PhysicalQueryMetrics;
  engineD: PhysicalQueryMetrics;
  speedup: string;
  resultSetParity: boolean;
  orderingParity: boolean;
}

export interface PhysicalBenchmarkResult {
  artifactPath: string;
  artifactBytes: number;
  fileOpenMs: number;
  readyMs: number;
  metadata: {
    documentCount: number;
    tokenCount: number;
    exactTitleCount: number;
    stringPoolCount: number;
    totalPostingsBytes: number;
  };
  comparisons: {
    prefix: PhysicalComparisonResult;
    multi: PhysicalComparisonResult;
  };
  queriesC: {
    exact: PhysicalQueryMetrics;
    prefix: PhysicalQueryMetrics;
    multi: PhysicalQueryMetrics;
    partial: PhysicalQueryMetrics;
    noResult: PhysicalQueryMetrics;
  };
  queriesD: {
    exact: PhysicalQueryMetrics;
    prefix: PhysicalQueryMetrics;
    multi: PhysicalQueryMetrics;
    partial: PhysicalQueryMetrics;
    noResult: PhysicalQueryMetrics;
  };
  parity: {
    silo: { passed: boolean; top1Id?: string; score?: number };
    silo2: { passed: boolean; top1Id?: string; score?: number };
    taChovendo: { passed: boolean; top1Id?: string; score?: number };
    questaoDeTempo: { passed: boolean; top1Id?: string; score?: number };
    matrix: { passed: boolean; top1Id?: string; score?: number };
    matrixReloaded: { passed: boolean; top1Id?: string; score?: number };
    prefixParity: boolean;
    multiParity: boolean;
    allPassed: boolean;
  };
}

let cachedEngineC: CompactSearchEngineV2 | null = null;
let cachedEngineD: CompactSearchEngineV2Pruned | null = null;
let currentArtifactBytes = 0;
let fileOpenMs = 0;
let readyMs = 0;
const partialMetrics: Partial<PhysicalBenchmarkResult> = {};

declare global {
  interface Window {
    __XANDEFLIX_DEBUG_SEARCH_V2_BENCHMARK__?: (
      artifactPath: string,
      step?: string
    ) => Promise<string>;
  }
}

function computeStats(runs: number[]): { minMs: number; medianMs: number; maxMs: number; p95Ms: number } {
  const sorted = [...runs].sort((a, b) => a - b);
  const minMs = sorted[0];
  const maxMs = sorted[sorted.length - 1];
  const medianMs = sorted[Math.floor(sorted.length / 2)];
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const p95Ms = sorted[p95Index];
  return { minMs, medianMs, maxMs, p95Ms };
}

function runBenchmarkQuery(
  engine: CompactSearchEngineV2 | CompactSearchEngineV2Pruned,
  queryStr: string,
  topK = 50
): PhysicalQueryMetrics {
  // 1 warmup controlado
  engine.query(queryStr, { topK });

  // 5 execuções medidas
  const runs: number[] = [];
  let lastResult: any;
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    lastResult = engine.query(queryStr, { topK });
    const elapsed = Number((performance.now() - t0).toFixed(2));
    runs.push(elapsed);
  }

  const { minMs, medianMs, maxMs, p95Ms } = computeStats(runs);
  const top1 = lastResult.items[0];

  const candidateCount = lastResult.rawCandidateCount ?? lastResult.candidateCount ?? 0;
  const scoredCandidates = lastResult.scoredCandidateCount ?? lastResult.scoredCandidates ?? candidateCount;
  const prunedCount = lastResult.prunedCandidateCount ?? lastResult.prunedCount ?? Math.max(0, candidateCount - scoredCandidates);
  const prunedPercent = candidateCount > 0 ? ((prunedCount / candidateCount) * 100).toFixed(1) + '%' : '0.0%';

  return {
    minMs,
    medianMs,
    maxMs,
    p95Ms,
    runs,
    candidateCount,
    scoredCandidates,
    prunedCount,
    prunedPercent,
    topKReturned: lastResult.items.length,
    top1Id: top1?.id,
    top1Score: top1?.score,
    top1MatchClass: top1?.matchClass,
  };
}

function compareEngines(
  engineC: CompactSearchEngineV2,
  engineD: CompactSearchEngineV2Pruned,
  queryStr: string,
  topK = 50
): PhysicalComparisonResult {
  const metricC = runBenchmarkQuery(engineC, queryStr, topK);
  const metricD = runBenchmarkQuery(engineD, queryStr, topK);

  const speedup = (metricC.medianMs / Math.max(0.01, metricD.medianMs)).toFixed(2) + 'x';

  // Paridade exata do conjunto e ordenação
  const resC = engineC.query(queryStr, { topK });
  const resD = engineD.query(queryStr, { topK });

  let resultSetParity = resC.items.length === resD.items.length;
  if (resultSetParity) {
    const setC = new Set(resC.items.map((it) => it.id));
    for (const it of resD.items) {
      if (!setC.has(it.id)) {
        resultSetParity = false;
        break;
      }
    }
  }

  let orderingParity = resC.items.length === resD.items.length;
  if (orderingParity) {
    for (let i = 0; i < resC.items.length; i++) {
      if (resC.items[i].id !== resD.items[i].id) {
        orderingParity = false;
        break;
      }
    }
  }

  return {
    engineC: metricC,
    engineD: metricD,
    speedup,
    resultSetParity,
    orderingParity,
  };
}

export function initDebugCompactSearchV2(): void {
  if (typeof window === 'undefined') return;

  console.log('[DEBUG_SEARCH_V2_INIT] Registrando window.__XANDEFLIX_DEBUG_SEARCH_V2_BENCHMARK__...');

  window.__XANDEFLIX_DEBUG_SEARCH_V2_BENCHMARK__ = async (
    artifactPath: string,
    step = 'all'
  ): Promise<string> => {
    try {
      console.log(`[DEBUG_BENCH_V2] Executando step: ${step} com artefato: ${artifactPath}`);

      if (step === 'open_and_load' || step === 'all') {
        console.log('[DEBUG_BENCH_V2_STEP] 1. Abrindo arquivo via bridge nativa...');
        const tFileStart = performance.now();
        const url = (window as any).Capacitor?.convertFileSrc(artifactPath) || `https://localhost/_capacitor_file_${artifactPath}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Falha ao ler arquivo: HTTP ${response.status} em ${url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const rawBuffer = new Uint8Array(arrayBuffer);
        fileOpenMs = Number((performance.now() - tFileStart).toFixed(2));
        currentArtifactBytes = rawBuffer.byteLength;
        console.log(`[DEBUG_BENCH_V2_STEP] Arquivo aberto: ${currentArtifactBytes} bytes em ${fileOpenMs} ms`);

        console.log('[DEBUG_BENCH_V2_STEP] 2. Deserializando e montando índices CompactSearchEngineV2 (C) e Pruned (D)...');
        const tReadyStart = performance.now();
        const sharedIndex = deserializeCompactIndexV2(rawBuffer);

        cachedEngineC = new CompactSearchEngineV2();
        cachedEngineC.load(sharedIndex);

        cachedEngineD = new CompactSearchEngineV2Pruned();
        cachedEngineD.load(sharedIndex);

        readyMs = Number((performance.now() - tReadyStart).toFixed(2));
        console.log(`[DEBUG_BENCH_V2_STEP] Índices prontos em ${readyMs} ms`);

        partialMetrics.artifactPath = artifactPath;
        partialMetrics.artifactBytes = currentArtifactBytes;
        partialMetrics.fileOpenMs = fileOpenMs;
        partialMetrics.readyMs = readyMs;
        partialMetrics.metadata = cachedEngineC.getIndexMetadata() as any;
        partialMetrics.comparisons = {} as any;
        partialMetrics.queriesC = {} as any;
        partialMetrics.queriesD = {} as any;

        if (step === 'open_and_load') {
          return JSON.stringify({ status: 'LOAD_COMPLETE', fileOpenMs, readyMs, artifactBytes: currentArtifactBytes });
        }
      }

      if (!cachedEngineC || !cachedEngineD || !cachedEngineC.isReady() || !cachedEngineD.isReady()) {
        throw new Error('Índices não inicializados. Execute o step open_and_load primeiro.');
      }

      if (!partialMetrics.comparisons) partialMetrics.comparisons = {} as any;
      if (!partialMetrics.queriesC) partialMetrics.queriesC = {} as any;
      if (!partialMetrics.queriesD) partialMetrics.queriesD = {} as any;

      if (step === 'exact' || step === 'all') {
        console.log('[DEBUG_BENCH_V2_STEP] 3. Executando Exact Title Query...');
        const q = 'Movie 123456 Alpha Explorer';
        partialMetrics.queriesC!.exact = runBenchmarkQuery(cachedEngineC, q, 50);
        partialMetrics.queriesD!.exact = runBenchmarkQuery(cachedEngineD, q, 50);
        console.log(`[DEBUG_BENCH_V2_STEP] Exact median C: ${partialMetrics.queriesC!.exact.medianMs} ms | D: ${partialMetrics.queriesD!.exact.medianMs} ms`);

        if (step === 'exact') {
          return JSON.stringify({ status: 'EXACT_COMPLETE', exactC: partialMetrics.queriesC!.exact, exactD: partialMetrics.queriesD!.exact });
        }
      }

      if (step === 'prefix' || step === 'all') {
        console.log('[DEBUG_BENCH_V2_STEP] 4. Executando Prefix Query (Chro)...');
        const q = 'Chro';
        const comp = compareEngines(cachedEngineC, cachedEngineD, q, 50);
        partialMetrics.comparisons!.prefix = comp;
        partialMetrics.queriesC!.prefix = comp.engineC;
        partialMetrics.queriesD!.prefix = comp.engineD;
        console.log(`[DEBUG_BENCH_V2_STEP] Prefix C: ${comp.engineC.medianMs} ms | D: ${comp.engineD.medianMs} ms | Speedup: ${comp.speedup}`);
        console.log(`[DEBUG_BENCH_V2_STEP] Prefix Scored C: ${comp.engineC.scoredCandidates} | D: ${comp.engineD.scoredCandidates} (${comp.engineD.prunedPercent} pruned)`);

        if (step === 'prefix') {
          return JSON.stringify({ status: 'PREFIX_COMPLETE', comparison: comp });
        }
      }

      if (step === 'multi' || step === 'all') {
        console.log('[DEBUG_BENCH_V2_STEP] 5. Executando Multi-Token Query (Series 45000 Delta)...');
        const q = 'Series 45000 Delta';
        const comp = compareEngines(cachedEngineC, cachedEngineD, q, 50);
        partialMetrics.comparisons!.multi = comp;
        partialMetrics.queriesC!.multi = comp.engineC;
        partialMetrics.queriesD!.multi = comp.engineD;
        console.log(`[DEBUG_BENCH_V2_STEP] Multi C: ${comp.engineC.medianMs} ms | D: ${comp.engineD.medianMs} ms | Speedup: ${comp.speedup}`);
        console.log(`[DEBUG_BENCH_V2_STEP] Multi Scored C: ${comp.engineC.scoredCandidates} | D: ${comp.engineD.scoredCandidates} (${comp.engineD.prunedPercent} pruned)`);

        if (step === 'multi') {
          return JSON.stringify({ status: 'MULTI_COMPLETE', comparison: comp });
        }
      }

      if (step === 'rest' || step === 'all') {
        console.log('[DEBUG_BENCH_V2_STEP] 6. Executando Partial e No-Result Queries...');
        partialMetrics.queriesC!.partial = runBenchmarkQuery(cachedEngineC, 'Matrix Adventure', 50);
        partialMetrics.queriesD!.partial = runBenchmarkQuery(cachedEngineD, 'Matrix Adventure', 50);

        partialMetrics.queriesC!.noResult = runBenchmarkQuery(cachedEngineC, 'NonExistentTerm99999', 50);
        partialMetrics.queriesD!.noResult = runBenchmarkQuery(cachedEngineD, 'NonExistentTerm99999', 50);

        console.log('[DEBUG_BENCH_V2_STEP] 7. Validando Paridade Semântica com casos canônicos...');
        const siloC = cachedEngineC.query('Silo', { topK: 50 });
        const siloD = cachedEngineD.query('Silo', { topK: 50 });

        const silo2C = cachedEngineC.query('Silo 2', { topK: 50 });
        const silo2D = cachedEngineD.query('Silo 2', { topK: 50 });

        const taChovendoC = cachedEngineC.query('ta chovendo', { topK: 50 });
        const taChovendoD = cachedEngineD.query('ta chovendo', { topK: 50 });

        const questaoC = cachedEngineC.query('Questão de Tempo', { topK: 50 });
        const questaoD = cachedEngineD.query('Questão de Tempo', { topK: 50 });

        const matrixC = cachedEngineC.query('Matrix', { topK: 50 });
        const matrixD = cachedEngineD.query('Matrix', { topK: 50 });

        const matrixReloadedC = cachedEngineC.query('Matrix Reloaded', { topK: 50 });
        const matrixReloadedD = cachedEngineD.query('Matrix Reloaded', { topK: 50 });

        const pSilo = siloD.items[0]?.id === 'syn:movie:000000' && siloD.items[0]?.score === 1350 && siloD.items[0]?.id === siloC.items[0]?.id;
        const pSilo2 = silo2D.items[0]?.id === 'syn:movie:000001' && silo2D.items[0]?.score === 1450 && silo2D.items[0]?.id === silo2C.items[0]?.id;
        const pTaChovendo = taChovendoD.items[0]?.id === 'syn:movie:000002' && taChovendoD.items[0]?.score === 950 && taChovendoD.items[0]?.id === taChovendoC.items[0]?.id;
        const pQuestao = questaoD.items[0]?.id === 'syn:movie:000003' && questaoD.items[0]?.score === 1550 && questaoD.items[0]?.id === questaoC.items[0]?.id;
        const pMatrix = matrixD.items[0]?.id === 'syn:movie:000004' && matrixD.items[0]?.score === 1390 && matrixD.items[0]?.id === matrixC.items[0]?.id;
        const pMatrixReloaded = matrixReloadedD.items[0]?.id === 'syn:movie:000005' && matrixReloadedD.items[0]?.score === 1490 && matrixReloadedD.items[0]?.id === matrixReloadedC.items[0]?.id;

        const prefixParity = partialMetrics.comparisons?.prefix?.resultSetParity && partialMetrics.comparisons?.prefix?.orderingParity;
        const multiParity = partialMetrics.comparisons?.multi?.resultSetParity && partialMetrics.comparisons?.multi?.orderingParity;

        const allPassed = pSilo && pSilo2 && pTaChovendo && pQuestao && pMatrix && pMatrixReloaded && !!prefixParity && !!multiParity;

        partialMetrics.parity = {
          silo: { passed: pSilo, top1Id: siloD.items[0]?.id, score: siloD.items[0]?.score },
          silo2: { passed: pSilo2, top1Id: silo2D.items[0]?.id, score: silo2D.items[0]?.score },
          taChovendo: { passed: pTaChovendo, top1Id: taChovendoD.items[0]?.id, score: taChovendoD.items[0]?.score },
          questaoDeTempo: { passed: pQuestao, top1Id: questaoD.items[0]?.id, score: questaoD.items[0]?.score },
          matrix: { passed: pMatrix, top1Id: matrixD.items[0]?.id, score: matrixD.items[0]?.score },
          matrixReloaded: { passed: pMatrixReloaded, top1Id: matrixReloadedD.items[0]?.id, score: matrixReloadedD.items[0]?.score },
          prefixParity: !!prefixParity,
          multiParity: !!multiParity,
          allPassed,
        };

        const resultJson = JSON.stringify(partialMetrics, null, 2);

        // Salvar em arquivo no dispositivo
        try {
          await Filesystem.writeFile({
            path: 'search_v2_bench_result.json',
            directory: Directory.Data,
            data: resultJson,
            encoding: Encoding.UTF8,
          });
          console.log('[DEBUG_BENCH_V2_SAVED] Resultado salvo em search_v2_bench_result.json');
        } catch (err) {
          console.warn('[DEBUG_BENCH_V2_SAVE_WARN] Falha ao persistir arquivo de resultado:', err);
        }

        const compactSummary = {
          fileOpenMs,
          readyMs,
          metadata: partialMetrics.metadata,
          comparisons: partialMetrics.comparisons,
          parity: partialMetrics.parity,
        };
        console.log('[PHYSICAL_SEARCH_V2_SUMMARY]', JSON.stringify(compactSummary));
        console.log('[PHYSICAL_SEARCH_V2_BENCH_COMPLETED]', JSON.stringify(partialMetrics));
        return resultJson;
      }

      return JSON.stringify({ status: 'STEP_PROCESSED', step });
    } catch (err) {
      const msg = (err as Error).stack || (err as Error).message;
      console.error('[DEBUG_BENCH_V2_EXCEPTION]', msg);
      return JSON.stringify({
        status: 'ERROR',
        errorMessage: (err as Error).message,
        stack: msg,
      });
    }
  };
}

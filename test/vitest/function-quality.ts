import { performance } from 'node:perf_hooks';

type MaybePromise<T> = T | Promise<T>;

type ExpectedComplexity = 'constant' | 'linear' | 'nlogn' | 'quadratic';

interface ComplexitySlopeOptions<TInput> {
  label: string;
  sizes: number[];
  setup: (size: number) => TInput;
  run: (input: TInput) => MaybePromise<unknown>;
  warmupRuns?: number;
  sampleRuns?: number;
  maxRatios?: number[];
  expected?: ExpectedComplexity;
}

interface MemoryBudgetOptions<TInput> {
  label: string;
  setup: () => TInput;
  run: (input: TInput) => MaybePromise<unknown>;
  repeats?: number;
  maxHeapDeltaBytes: number;
}

interface DeterministicFuzzOptions<TCase> {
  label: string;
  iterations: number;
  seed?: number;
  makeCase: (rng: SeededRng, index: number) => TCase;
  assertCase: (input: TCase, index: number) => MaybePromise<void>;
}

type SeededRng = () => number;

const DEFAULT_RATIO_BY_EXPECTED: Record<ExpectedComplexity, number[]> = {
  constant: [1.8, 1.8],
  linear: [2.8, 2.8],
  nlogn: [3.6, 3.6],
  quadratic: [6.0, 6.0],
};

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

async function runTimed<TInput>(run: (input: TInput) => MaybePromise<unknown>, input: TInput): Promise<number> {
  const start = performance.now();
  await run(input);
  return performance.now() - start;
}

function assertSizesAscending(sizes: number[]): void {
  if (sizes.length < 3) {
    throw new Error('Complexity slope test requires at least 3 sizes.');
  }
  for (let i = 1; i < sizes.length; i += 1) {
    if (sizes[i] <= sizes[i - 1]) {
      throw new Error(`Sizes must be strictly increasing. Invalid pair: ${sizes[i - 1]} -> ${sizes[i]}`);
    }
  }
}

export async function assertComplexitySlope<TInput>(options: ComplexitySlopeOptions<TInput>): Promise<void> {
  const {
    label,
    sizes,
    setup,
    run,
    warmupRuns = 1,
    sampleRuns = 5,
    maxRatios,
    expected = 'linear',
  } = options;

  assertSizesAscending(sizes);

  const ratioBudget = maxRatios ?? DEFAULT_RATIO_BY_EXPECTED[expected];
  if (ratioBudget.length < sizes.length - 1) {
    throw new Error(
      `maxRatios must provide at least ${sizes.length - 1} thresholds for ${sizes.length} sizes.`,
    );
  }

  const medians: number[] = [];
  for (const size of sizes) {
    for (let i = 0; i < warmupRuns; i += 1) {
      await run(setup(size));
    }

    const samples: number[] = [];
    for (let i = 0; i < sampleRuns; i += 1) {
      samples.push(await runTimed(run, setup(size)));
    }
    medians.push(median(samples));
  }

  const ratios: number[] = [];
  for (let i = 1; i < medians.length; i += 1) {
    const prev = medians[i - 1];
    const next = medians[i];
    const ratio = prev === 0 ? Number.POSITIVE_INFINITY : next / prev;
    ratios.push(ratio);
  }

  for (let i = 0; i < ratios.length; i += 1) {
    if (ratios[i] > ratioBudget[i]) {
      const sizePair = `${sizes[i]} -> ${sizes[i + 1]}`;
      throw new Error(
        `${label}: complexity slope exceeded at ${sizePair}. ratio=${ratios[i].toFixed(2)}, budget=${ratioBudget[
          i
        ].toFixed(2)}, medians(ms)=${medians.map((value) => value.toFixed(3)).join(', ')}`,
      );
    }
  }
}

export async function assertMemoryBudget<TInput>(options: MemoryBudgetOptions<TInput>): Promise<void> {
  const { label, setup, run, repeats = 20, maxHeapDeltaBytes } = options;

  // If GC is exposed, reduce background noise before and after the run.
  if (globalThis.gc) {
    globalThis.gc();
  }
  const heapBefore = process.memoryUsage().heapUsed;

  for (let i = 0; i < repeats; i += 1) {
    await run(setup());
  }

  if (globalThis.gc) {
    globalThis.gc();
  }
  const heapAfter = process.memoryUsage().heapUsed;
  const delta = heapAfter - heapBefore;

  if (delta > maxHeapDeltaBytes) {
    throw new Error(
      `${label}: memory budget exceeded. delta=${delta} bytes, budget=${maxHeapDeltaBytes} bytes.`,
    );
  }
}

export function createSeededRng(seed = 42): SeededRng {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: SeededRng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export async function runDeterministicFuzz<TCase>(options: DeterministicFuzzOptions<TCase>): Promise<void> {
  const { label, iterations, seed = 42, makeCase, assertCase } = options;
  const rng = createSeededRng(seed);

  for (let i = 0; i < iterations; i += 1) {
    const input = makeCase(rng, i);
    try {
      await assertCase(input, i);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`${label}: fuzz failure at iteration=${i}, seed=${seed}. ${reason}`);
    }
  }
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchDailySummary,
  fetchGoalProgress,
  fetchMacroRatios,
  fetchMicronutrientSummary,
  fetchMicronutrientDeficiencies,
} from '../actions';

type GoalProgress = Awaited<ReturnType<typeof fetchGoalProgress>>;
type MacroRatios = Awaited<ReturnType<typeof fetchMacroRatios>>;

interface NutrientItem {
  nutrientId: string;
  nutrientName: string;
  unit: string;
  consumed: number;
  rda: number | null;
  percentage: number | null;
  status: string;
}

interface NutrientDeficiency {
  nutrientId: string;
  nutrientName: string;
  unit: string;
  rda: number;
  avgConsumed: number;
  avgPercentage: number;
}

const STATUS_COLORS: Record<string, string> = {
  deficient: '#EF4444',
  low: '#F59E0B',
  adequate: '#22C55E',
  excess: '#8B5CF6',
};

const MACRO_COLORS = {
  protein: '#3B82F6',
  carbs: '#F59E0B',
  fat: '#EF4444',
};

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '2rem', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', margin: 0 },
  subtitle: { fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' },
  backLink: { fontSize: '0.85rem', color: 'var(--accent-nutrition)', marginBottom: '1rem', display: 'inline-block' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' },
  macroRow: { display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' as const },
  macroCard: {
    flex: '1 1 200px', background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' as const,
  },
  ringContainer: {
    width: 100, height: 100, margin: '0 auto 0.75rem', position: 'relative' as const,
  },
  ringLabel: {
    position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    fontSize: '1.25rem', fontWeight: 700,
  },
  macroName: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.25rem' },
  macroDetail: { fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' },
  nutrientGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem',
  },
  nutrientCard: {
    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
  },
  nutrientName: { flex: 1, fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' },
  nutrientValue: { fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 60, textAlign: 'right' as const },
  rdaBar: {
    width: 60, height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' as const,
  },
  rdaFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s ease' },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  deficiencyCard: {
    background: 'var(--surface-elevated)', border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '0.5rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  empty: { textAlign: 'center' as const, color: 'var(--text-tertiary)', padding: '2rem', fontSize: '0.9rem' },
};

function MacroRing({ percentage, color, size = 100 }: { percentage: number; color: string; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div style={{ ...styles.ringContainer, width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{ ...styles.ringLabel, color }}>{percentage}%</div>
    </div>
  );
}

export default function NutritionDashboardPage() {
  const [date] = useState(() => new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [macros, setMacros] = useState<MacroRatios>(null);
  const [nutrients, setNutrients] = useState<NutrientItem[]>([]);
  const [deficiencies, setDeficiencies] = useState<NutrientDeficiency[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, n, d] = await Promise.all([
        fetchGoalProgress(date),
        fetchMacroRatios(date, date),
        fetchMicronutrientSummary(date),
        fetchMicronutrientDeficiencies(14),
      ]);
      setProgress(p);
      setMacros(m);
      setNutrients(n as NutrientItem[]);
      setDeficiencies(d as NutrientDeficiency[]);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return <div style={styles.page}><div style={styles.empty}>Loading dashboard...</div></div>;
  }

  return (
    <div style={styles.page}>
      <Link href="/nutrition" style={styles.backLink}>Back to Diary</Link>
      <div style={styles.header}>
        <h1 style={styles.title}>Nutrition Dashboard</h1>
        <p style={styles.subtitle}>Macro breakdown and micronutrient tracking</p>
      </div>

      {/* Macro Rings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Macronutrient Breakdown</h2>
        <div style={styles.macroRow}>
          <div style={styles.macroCard}>
            <MacroRing percentage={progress?.calories?.percentage ?? 0} color="var(--accent-nutrition)" />
            <div style={styles.macroName}>Calories</div>
            <div style={styles.macroDetail}>
              {progress?.calories ? `${Math.round(progress.calories.consumed)} / ${progress.calories.goal}` : 'No goal set'}
            </div>
          </div>
          <div style={styles.macroCard}>
            <MacroRing percentage={progress?.proteinG?.percentage ?? 0} color={MACRO_COLORS.protein} />
            <div style={styles.macroName}>Protein</div>
            <div style={styles.macroDetail}>
              {progress?.proteinG ? `${Math.round(progress.proteinG.consumed)}g / ${progress.proteinG.goal}g` : 'No goal set'}
            </div>
          </div>
          <div style={styles.macroCard}>
            <MacroRing percentage={progress?.carbsG?.percentage ?? 0} color={MACRO_COLORS.carbs} />
            <div style={styles.macroName}>Carbs</div>
            <div style={styles.macroDetail}>
              {progress?.carbsG ? `${Math.round(progress.carbsG.consumed)}g / ${progress.carbsG.goal}g` : 'No goal set'}
            </div>
          </div>
          <div style={styles.macroCard}>
            <MacroRing percentage={progress?.fatG?.percentage ?? 0} color={MACRO_COLORS.fat} />
            <div style={styles.macroName}>Fat</div>
            <div style={styles.macroDetail}>
              {progress?.fatG ? `${Math.round(progress.fatG.consumed)}g / ${progress.fatG.goal}g` : 'No goal set'}
            </div>
          </div>
        </div>

        {/* Macro ratio bar */}
        {macros && macros.totalCalories > 0 && (
          <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Macro Ratio</div>
            <div style={{ display: 'flex', height: 20, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ width: `${macros.proteinPct}%`, background: MACRO_COLORS.protein }} />
              <div style={{ width: `${macros.carbsPct}%`, background: MACRO_COLORS.carbs }} />
              <div style={{ width: `${macros.fatPct}%`, background: MACRO_COLORS.fat }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: MACRO_COLORS.protein }}>Protein {macros.proteinPct}%</span>
              <span style={{ color: MACRO_COLORS.carbs }}>Carbs {macros.carbsPct}%</span>
              <span style={{ color: MACRO_COLORS.fat }}>Fat {macros.fatPct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Deficiencies */}
      {deficiencies.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Potential Deficiencies (14-day avg)</h2>
          {deficiencies.map((d) => (
            <div key={d.nutrientId} style={styles.deficiencyCard}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{d.nutrientName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Avg: {d.avgConsumed.toFixed(1)} {d.unit} / RDA: {d.rda} {d.unit}
                </div>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#EF4444' }}>{d.avgPercentage}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Micronutrient Grid */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Micronutrients ({nutrients.length})</h2>
        {nutrients.length === 0 ? (
          <div style={styles.empty}>No nutrient data available. Log some foods to see micronutrient tracking.</div>
        ) : (
          <div style={styles.nutrientGrid}>
            {nutrients.map((n) => (
              <div key={n.nutrientId} style={styles.nutrientCard}>
                <div style={{ ...styles.statusDot, background: STATUS_COLORS[n.status] ?? 'var(--text-tertiary)' }} />
                <div style={styles.nutrientName}>{n.nutrientName}</div>
                <div style={styles.nutrientValue}>
                  {n.consumed > 0 ? n.consumed.toFixed(1) : '0'} {n.unit}
                </div>
                {n.rda !== null && n.percentage !== null && (
                  <div style={styles.rdaBar}>
                    <div style={{
                      ...styles.rdaFill,
                      width: `${Math.min(n.percentage, 100)}%`,
                      background: STATUS_COLORS[n.status] ?? 'var(--text-tertiary)',
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

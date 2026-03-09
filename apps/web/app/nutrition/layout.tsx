export default function NutritionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text)' }}>
      {children}
    </div>
  );
}

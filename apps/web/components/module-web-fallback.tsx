import Link from 'next/link';

interface FallbackLink {
  href: string;
  label: string;
}

interface ModuleWebFallbackProps {
  moduleName: string;
  title: string;
  routePath: string;
  summary: string;
  accentColor: string;
  primaryHref: string;
  primaryLabel: string;
  links: FallbackLink[];
}

export function ModuleWebFallback({
  moduleName,
  title,
  routePath,
  summary,
  accentColor,
  primaryHref,
  primaryLabel,
  links,
}: ModuleWebFallbackProps) {
  return (
    <section
      style={{
        display: 'grid',
        gap: 20,
        padding: 28,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(17, 24, 39, 0.08)',
        boxShadow: '0 22px 44px rgba(17, 24, 39, 0.08)',
      }}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <span
          style={{
            width: 'fit-content',
            padding: '6px 10px',
            borderRadius: 999,
            backgroundColor: `${accentColor}18`,
            color: accentColor,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          Web Beta
        </span>
        <div>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>{title}</h1>
          <p style={{ margin: '10px 0 0', color: '#4B5563', fontSize: 16, lineHeight: 1.6 }}>
            {summary}
          </p>
        </div>
        <div style={{ color: '#6B7280', fontSize: 14 }}>
          Requested route: <code>{routePath}</code>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link
          href={primaryHref}
          style={{
            borderRadius: 999,
            backgroundColor: accentColor,
            color: '#FFFFFF',
            padding: '10px 16px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {primaryLabel}
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              borderRadius: 999,
              border: '1px solid rgba(17, 24, 39, 0.12)',
              color: '#374151',
              padding: '10px 16px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div
        style={{
          padding: 18,
          borderRadius: 20,
          backgroundColor: '#F9FAFB',
          border: '1px solid rgba(17, 24, 39, 0.06)',
          color: '#4B5563',
          lineHeight: 1.6,
        }}
      >
        {moduleName} is included in MyLife, but the full native web rebuild is still in progress.
        This fallback keeps saved links alive and avoids broken route imports while the consolidated web experience is finished.
      </div>
    </section>
  );
}

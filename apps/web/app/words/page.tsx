import { ModuleWebFallback } from '@/components/module-web-fallback';

export default function WordsPage() {
  return (
    <ModuleWebFallback
      moduleName="MyWords"
      title="Dictionary & Thesaurus"
      routePath="/words"
      summary="Dictionary + thesaurus in 270 languages. Look up definitions, save words, and build vocabulary."
      accentColor="#0EA5E9"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/words/search', label: 'Search' },
        { href: '/words/saved', label: 'Saved Words' },
        { href: '/words/word-of-the-day', label: 'Word of the Day' },
      ]}
    />
  );
}

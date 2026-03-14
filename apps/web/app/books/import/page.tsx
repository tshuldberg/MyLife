'use client';

import { useState } from 'react';
import { importFromCSV } from '../actions';

type ImportSource = 'goodreads' | 'storygraph';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function BooksImportPage() {
  const [source, setSource] = useState<ImportSource>('goodreads');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function handleImport() {
    if (!file) return;

    setIsImporting(true);
    try {
      const csvText = await file.text();
      const nextResult = await importFromCSV(source, csvText);
      setResult(nextResult);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section
        style={{
          padding: 24,
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(123, 83, 36, 0.12)',
          boxShadow: '0 16px 32px rgba(80, 54, 25, 0.08)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 32 }}>Import Your Library</h1>
        <p style={{ margin: '10px 0 0', color: '#6B5845' }}>
          Bring your reading history in from Goodreads or StoryGraph.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          {(['goodreads', 'storygraph'] as ImportSource[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSource(option)}
              style={{
                borderRadius: 999,
                border: source === option ? '1px solid #8C5A2B' : '1px solid rgba(123, 83, 36, 0.14)',
                backgroundColor: source === option ? '#8C5A2B' : '#FFFFFF',
                color: source === option ? '#FFFFFF' : '#5D4733',
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {option === 'goodreads' ? 'Goodreads' : 'StoryGraph'}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          {file ? (
            <span style={{ color: '#5D4733', fontWeight: 600 }}>{file.name}</span>
          ) : null}
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={!file || isImporting}
            style={{
              justifySelf: 'start',
              borderRadius: 14,
              border: 'none',
              backgroundColor: !file || isImporting ? '#C9B29A' : '#8C5A2B',
              color: '#FFFFFF',
              padding: '12px 18px',
              fontWeight: 700,
              cursor: !file || isImporting ? 'default' : 'pointer',
            }}
          >
            {isImporting
              ? 'Importing...'
              : `Import from ${source === 'goodreads' ? 'Goodreads' : 'StoryGraph'}`}
          </button>
        </div>
      </section>

      {result ? (
        <section
          style={{
            display: 'grid',
            gap: 18,
            padding: 24,
            borderRadius: 24,
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(123, 83, 36, 0.12)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ color: '#6B5845', fontWeight: 700 }}>Books imported</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{result.imported}</div>
            </div>
            <div>
              <div style={{ color: '#6B5845', fontWeight: 700 }}>Books skipped</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{result.skipped}</div>
            </div>
          </div>
          {result.errors.length > 0 ? (
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Import notes</h2>
              <ul style={{ margin: '12px 0 0', paddingLeft: 20 }}>
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { importFromCSV } from '../actions';

type ImportSource = 'goodreads' | 'storygraph';

interface ImportResult {
  source: ImportSource;
  booksImported: number;
  booksSkipped: number;
  errors: string[];
}

export default function BooksImportPage() {
  const [selectedSource, setSelectedSource] =
    useState<ImportSource>('goodreads');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const importResult = await importFromCSV(selectedSource, text);

      setResult({
        source: selectedSource,
        booksImported: importResult.imported,
        booksSkipped: importResult.skipped,
        errors: importResult.errors,
      });
    } catch {
      setResult({
        source: selectedSource,
        booksImported: 0,
        booksSkipped: 0,
        errors: ['Failed to read or import the CSV file.'],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Import Library</h1>
        <p style={styles.subtitle}>
          Import your books from Goodreads or StoryGraph
        </p>
      </div>

      {/* Source selection */}
      <div style={styles.sourceSection}>
        <h3 style={styles.sectionTitle}>1. Choose source</h3>
        <div style={styles.sourceButtons}>
          <button
            onClick={() => {
              setSelectedSource('goodreads');
              setFile(null);
              setResult(null);
            }}
            style={{
              ...styles.sourceButton,
              ...(selectedSource === 'goodreads'
                ? styles.sourceButtonActive
                : {}),
            }}
          >
            <span style={styles.sourceIcon}>📗</span>
            <div>
              <p style={styles.sourceName}>Goodreads</p>
              <p style={styles.sourceDesc}>Export CSV from Goodreads settings</p>
            </div>
          </button>
          <button
            onClick={() => {
              setSelectedSource('storygraph');
              setFile(null);
              setResult(null);
            }}
            style={{
              ...styles.sourceButton,
              ...(selectedSource === 'storygraph'
                ? styles.sourceButtonActive
                : {}),
            }}
          >
            <span style={styles.sourceIcon}>📘</span>
            <div>
              <p style={styles.sourceName}>StoryGraph</p>
              <p style={styles.sourceDesc}>
                Export CSV from StoryGraph settings
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* File upload */}
      <div style={styles.uploadSection}>
        <h3 style={styles.sectionTitle}>2. Upload CSV file</h3>
        <div style={styles.instructions}>
          <p style={styles.instructionText}>
            {selectedSource === 'goodreads' ? (
              <>
                Go to{' '}
                <strong>Goodreads &gt; My Books &gt; Import and Export</strong>{' '}
                and click &quot;Export Library&quot;. Upload the downloaded CSV
                file below.
              </>
            ) : (
              <>
                Go to{' '}
                <strong>
                  StoryGraph &gt; Settings &gt; Manage Account &gt; Export
                  Library
                </strong>
                . Upload the downloaded CSV file below.
              </>
            )}
          </p>
        </div>

        <div
          style={styles.dropZone}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {file ? (
            <div style={styles.fileInfo}>
              <span style={styles.fileIcon}>📄</span>
              <div>
                <p style={styles.fileName}>{file.name}</p>
                <p style={styles.fileSize}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.dropContent}>
              <p style={styles.dropIcon}>📂</p>
              <p style={styles.dropText}>
                Click to select a CSV file
              </p>
              <p style={styles.dropHint}>or drag and drop</p>
            </div>
          )}
        </div>
      </div>

      {/* Import button */}
      <div style={styles.importSection}>
        <h3 style={styles.sectionTitle}>3. Import</h3>
        <button
          onClick={handleImport}
          disabled={!file || importing}
          style={{
            ...styles.importButton,
            ...(!file || importing ? styles.importButtonDisabled : {}),
          }}
        >
          {importing
            ? 'Importing...'
            : `Import from ${selectedSource === 'goodreads' ? 'Goodreads' : 'StoryGraph'}`}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={styles.resultSection}>
          <h3 style={styles.sectionTitle}>Results</h3>
          <div style={styles.resultCard}>
            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Books imported</span>
              <span style={styles.resultValue}>{result.booksImported}</span>
            </div>
            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Books skipped</span>
              <span style={styles.resultValue}>{result.booksSkipped}</span>
            </div>
            {result.errors.length > 0 && (
              <div style={styles.errorsSection}>
                <span style={styles.resultLabel}>Notes</span>
                <ul style={styles.errorList}>
                  {result.errors.map((err, i) => (
                    <li key={i} style={styles.errorItem}>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 12px 0',
  },
  sourceSection: {
    marginBottom: '32px',
  },
  sourceButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  sourceButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: 'var(--radius-lg)',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    backgroundColor: 'var(--surface)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'border-color 0.15s',
  },
  sourceButtonActive: {
    borderColor: 'var(--accent-books)',
  },
  sourceIcon: {
    fontSize: '28px',
    flexShrink: 0,
  },
  sourceName: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  sourceDesc: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: '2px 0 0 0',
  },
  uploadSection: {
    marginBottom: '32px',
  },
  instructions: {
    marginBottom: '12px',
  },
  instructionText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    margin: 0,
  },
  dropZone: {
    padding: '32px',
    borderRadius: 'var(--radius-lg)',
    border: '2px dashed var(--border)',
    backgroundColor: 'var(--surface)',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    textAlign: 'center' as const,
  },
  dropContent: {},
  dropIcon: {
    fontSize: '36px',
    margin: '0 0 8px 0',
  },
  dropText: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text)',
    margin: 0,
  },
  dropHint: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginTop: '4px',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center',
  },
  fileIcon: {
    fontSize: '24px',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
    margin: 0,
  },
  fileSize: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    margin: '2px 0 0 0',
  },
  importSection: {
    marginBottom: '32px',
  },
  importButton: {
    padding: '12px 32px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'var(--accent-books)',
    color: '#0E0C09',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  importButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  resultSection: {
    marginBottom: '32px',
  },
  resultCard: {
    padding: '16px 20px',
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  resultLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  resultValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  errorsSection: {
    paddingTop: '12px',
  },
  errorList: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
  errorItem: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
};

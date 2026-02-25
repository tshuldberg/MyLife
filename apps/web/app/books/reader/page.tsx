'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createReaderDocumentAction,
  fetchReaderDocumentsAction,
} from '../actions';
import { parseReaderUpload } from '@mylife/books';

interface ReaderDocumentRow {
  id: string;
  title: string;
  author: string | null;
  file_extension: string | null;
  total_words: number;
  progress_percent: number;
  updated_at: string;
}

const BINARY_EXTENSIONS = ['.epub', '.pdf', '.mobi', '.azw', '.azw3'];

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function BooksReaderPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<ReaderDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchReaderDocumentsAction({
        sort_by: 'updated_at',
        sort_dir: 'DESC',
      });
      setDocuments(rows as ReaderDocumentRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reader documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleFileSelected = useCallback(async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const lower = file.name.toLowerCase();
      const mime = file.type || null;
      const isBinary = BINARY_EXTENSIONS.some((extension) => lower.endsWith(extension))
        || mime === 'application/epub+zip'
        || mime === 'application/pdf'
        || mime === 'application/x-mobipocket-ebook'
        || mime === 'application/vnd.amazon.ebook';
      const parsed = isBinary
        ? await parseReaderUpload({
          fileName: file.name,
          mimeType: mime,
          base64Content: bytesToBase64(new Uint8Array(await file.arrayBuffer())),
        })
        : await parseReaderUpload({
          fileName: file.name,
          mimeType: mime,
          textContent: await file.text(),
        });

      const created = await createReaderDocumentAction({
        title: parsed.title,
        author: parsed.author,
        source_type: 'upload',
        mime_type: parsed.mimeType,
        file_name: parsed.fileName,
        file_extension: parsed.fileExtension,
        text_content: parsed.textContent,
        total_chars: parsed.totalChars,
        total_words: parsed.totalWords,
      });

      await loadDocuments();
      router.push(`/books/reader/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import this file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [loadDocuments, router]);

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Reader</h1>
        <p style={styles.subtitle}>Upload and read ebooks or documents inside MyBooks.</p>
      </div>

      <div style={styles.toolbar}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={styles.uploadButton}
        >
          {uploading ? 'Importing…' : 'Upload Document'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,.html,.htm,.json,.csv,.rtf,.epub,.pdf,.mobi,.azw,.azw3,text/plain,text/markdown,text/html,application/json,application/epub+zip,application/pdf,application/x-mobipocket-ebook,application/vnd.amazon.ebook"
          onChange={(event) => {
            void handleFileSelected(event.target.files?.[0] ?? null);
          }}
          style={{ display: 'none' }}
        />
        <span style={styles.supported}>
          Supports TXT, Markdown, HTML, JSON, RTF, EPUB, PDF, MOBI, and AZW.
        </span>
      </div>

      {error && (
        <div style={styles.errorBox}>{error}</div>
      )}

      {loading ? (
        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>Loading reader library…</p>
        </div>
      ) : documents.length === 0 ? (
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>No reader documents yet</p>
          <p style={styles.emptyText}>
            Upload an ebook or note file to start reading inside MyBooks.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/books/reader/${document.id}`}
              style={styles.docRow}
            >
              <div style={styles.docMeta}>
                <p style={styles.docTitle}>{document.title}</p>
                <p style={styles.docSub}>
                  {document.author ?? 'Unknown Author'} · {document.total_words.toLocaleString()} words
                </p>
                <p style={styles.docSub}>
                  {(document.file_extension ?? 'doc').toUpperCase()} · Updated {new Date(document.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div style={styles.progressWrap}>
                <span style={styles.progressLabel}>{Math.round(document.progress_percent)}%</span>
                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${Math.max(0, Math.min(100, document.progress_percent))}%`,
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
    margin: 0,
  },
  subtitle: {
    marginTop: '4px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
    flexWrap: 'wrap',
  },
  uploadButton: {
    border: 'none',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--accent-books)',
    color: '#0E0C09',
    fontWeight: 700,
    fontSize: '14px',
    padding: '10px 16px',
    cursor: 'pointer',
  },
  supported: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  errorBox: {
    borderRadius: '10px',
    border: '1px solid #8a3838',
    backgroundColor: '#2a1515',
    color: '#f5caca',
    padding: '10px 12px',
    marginBottom: '14px',
    fontSize: '13px',
  },
  emptyCard: {
    padding: '28px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    textAlign: 'center',
  },
  emptyTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  emptyText: {
    margin: '8px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  docRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'inherit',
    textDecoration: 'none',
  },
  docMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
  docTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  docSub: {
    margin: 0,
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  progressWrap: {
    width: '180px',
    alignSelf: 'center',
  },
  progressLabel: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    textAlign: 'right',
  },
  progressTrack: {
    height: '6px',
    borderRadius: '999px',
    backgroundColor: 'var(--surface-elevated)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    backgroundColor: 'var(--accent-books)',
  },
};

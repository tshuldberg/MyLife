'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  createReaderNoteAction,
  deleteReaderNoteAction,
  fetchReaderDocumentAction,
  fetchReaderNotesAction,
  fetchReaderPreferencesAction,
  saveReaderPreferencesAction,
  updateReaderDocumentProgressAction,
} from '../../actions';

interface ReaderDocumentDetail {
  id: string;
  title: string;
  author: string | null;
  text_content: string;
  total_chars: number;
  progress_percent: number;
}

interface ReaderNote {
  id: string;
  note_type: 'note' | 'highlight' | 'bookmark';
  selection_start: number;
  selection_end: number;
  selected_text: string | null;
  note_text: string | null;
}

interface ReaderPreferences {
  document_id: string;
  font_size: number;
  line_height: number;
  font_family: string;
  theme: 'dark' | 'sepia' | 'light';
  margin_size: number;
}

interface ReaderSegment {
  key: string;
  start: number;
  end: number;
  text: string;
}

const READER_THEMES: Record<ReaderPreferences['theme'], { background: string; text: string }> = {
  dark: { background: '#121212', text: '#F5F2ED' },
  sepia: { background: '#F3E8D4', text: '#3B2C1C' },
  light: { background: '#FFFFFF', text: '#1D1D1D' },
};

function splitIntoSegments(content: string): ReaderSegment[] {
  const chunks = content.split(/\n{2,}/);
  const segments: ReaderSegment[] = [];
  let cursor = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const start = content.indexOf(chunk, cursor);
    const safeStart = start >= 0 ? start : cursor;
    const end = safeStart + chunk.length;
    cursor = end;
    segments.push({
      key: `${safeStart}-${index}`,
      start: safeStart,
      end,
      text: trimmed,
    });
  }

  return segments;
}

export default function BooksReaderDetailPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<ReaderDocumentDetail | null>(null);
  const [notes, setNotes] = useState<ReaderNote[]>([]);
  const [preferences, setPreferences] = useState<ReaderPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReaderSegment | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const lastProgressUpdate = useRef(0);

  const segments = useMemo(
    () => splitIntoSegments(document?.text_content ?? ''),
    [document?.text_content],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [doc, noteRows, pref] = await Promise.all([
        fetchReaderDocumentAction(documentId),
        fetchReaderNotesAction(documentId),
        fetchReaderPreferencesAction(documentId),
      ]);

      setDocument(doc as ReaderDocumentDetail | null);
      setNotes((noteRows as ReaderNote[]) ?? []);
      setPreferences((pref as ReaderPreferences | null) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reader document.');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const theme = preferences?.theme ?? 'sepia';
  const fontSize = preferences?.font_size ?? 20;
  const lineHeight = preferences?.line_height ?? 1.6;
  const marginSize = preferences?.margin_size ?? 24;
  const fontFamily = preferences?.font_family ?? 'Literata, Georgia, serif';
  const themeColors = READER_THEMES[theme];

  const hasHighlight = useCallback((segment: ReaderSegment): boolean => (
    notes.some((note) =>
      note.note_type === 'highlight'
      && note.selection_start < segment.end
      && note.selection_end > segment.start)
  ), [notes]);

  const hasBookmark = useCallback((segment: ReaderSegment): boolean => (
    notes.some((note) =>
      note.note_type === 'bookmark'
      && note.selection_start >= segment.start
      && note.selection_start <= segment.end)
  ), [notes]);

  const savePreferences = useCallback(async (updates: Partial<ReaderPreferences>) => {
    if (!document) return;
    const next = await saveReaderPreferencesAction({
      document_id: document.id,
      font_size: updates.font_size,
      line_height: updates.line_height,
      font_family: updates.font_family,
      theme: updates.theme,
      margin_size: updates.margin_size,
    });
    setPreferences(next as ReaderPreferences);
  }, [document]);

  const handleScroll = useCallback(async (event: React.UIEvent<HTMLDivElement>) => {
    if (!document) return;
    const now = Date.now();
    if (now - lastProgressUpdate.current < 1200) return;
    lastProgressUpdate.current = now;

    const element = event.currentTarget;
    const maxScroll = Math.max(element.scrollHeight - element.clientHeight, 1);
    const ratio = Math.max(0, Math.min(1, element.scrollTop / maxScroll));
    const progressPercent = ratio * 100;
    const currentPosition = Math.round(ratio * document.total_chars);

    setDocument((current) => current
      ? { ...current, progress_percent: progressPercent }
      : current);

    await updateReaderDocumentProgressAction({
      id: document.id,
      current_position: currentPosition,
      progress_percent: progressPercent,
    });
  }, [document]);

  const createNote = useCallback(async (type: 'highlight' | 'bookmark' | 'note') => {
    if (!document || !selected) return;
    await createReaderNoteAction({
      document_id: document.id,
      note_type: type,
      selection_start: selected.start,
      selection_end: selected.end,
      selected_text: selected.text.slice(0, 800),
      note_text: type === 'note' ? (noteDraft.trim() || null) : null,
      color: type === 'highlight' ? '#F9D976' : null,
    });
    setNoteDraft('');
    await loadAll();
  }, [document, loadAll, noteDraft, selected]);

  const deleteNote = useCallback(async (noteId: string) => {
    await deleteReaderNoteAction(noteId);
    await loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div style={styles.centerCard}>
        <p style={styles.helperText}>Loading reader document…</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div style={styles.centerCard}>
        <p style={styles.helperText}>Document not found.</p>
        <Link href="/books/reader" style={styles.backLink}>Back to Reader</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{document.title}</h1>
          <p style={styles.subtitle}>
            {document.author ?? 'Unknown Author'} · {Math.round(document.progress_percent)}% read
          </p>
        </div>
        <Link href="/books/reader" style={styles.backLink}>
          Back to Reader
        </Link>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.tools}>
        <button style={styles.toolButton} onClick={() => void savePreferences({ font_size: Math.max(12, fontSize - 1) })}>A-</button>
        <button style={styles.toolButton} onClick={() => void savePreferences({ font_size: Math.min(48, fontSize + 1) })}>A+</button>
        <button style={styles.toolButton} onClick={() => void savePreferences({ line_height: Math.max(1, Number((lineHeight - 0.1).toFixed(1))) })}>LH-</button>
        <button style={styles.toolButton} onClick={() => void savePreferences({ line_height: Math.min(3, Number((lineHeight + 0.1).toFixed(1))) })}>LH+</button>
        <button
          style={styles.toolButton}
          onClick={() => void savePreferences({ theme: theme === 'dark' ? 'sepia' : theme === 'sepia' ? 'light' : 'dark' })}
        >
          Theme
        </button>
      </div>

      <div style={styles.layout}>
        <div
          style={{
            ...styles.readerPane,
            background: themeColors.background,
            color: themeColors.text,
            padding: `24px ${marginSize}px`,
          }}
          onScroll={(event) => {
            void handleScroll(event);
          }}
        >
          {segments.map((segment) => (
            <button
              key={segment.key}
              onClick={() => setSelected(segment)}
              style={{
                ...styles.segmentButton,
                backgroundColor: hasHighlight(segment)
                  ? '#f9d97666'
                  : selected?.key === segment.key
                    ? '#7ab6ff33'
                    : 'transparent',
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight,
                  color: themeColors.text,
                }}
              >
                {hasBookmark(segment) ? '🔖 ' : ''}{segment.text}
              </span>
            </button>
          ))}
        </div>

        <div style={styles.sidePane}>
          <div style={styles.card}>
            <p style={styles.cardTitle}>Selection</p>
            {selected ? (
              <>
                <p style={styles.helperText}>{selected.text.slice(0, 220)}</p>
                <div style={styles.selectionActions}>
                  <button style={styles.smallButton} onClick={() => void createNote('highlight')}>Highlight</button>
                  <button style={styles.smallButton} onClick={() => void createNote('bookmark')}>Bookmark</button>
                  <button style={styles.smallButton} onClick={() => void createNote('note')}>Save Note</button>
                </div>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder="Write a note for this selection..."
                  style={styles.noteInput}
                />
              </>
            ) : (
              <p style={styles.helperText}>Click any paragraph to highlight, bookmark, or add notes.</p>
            )}
          </div>

          <div style={styles.card}>
            <p style={styles.cardTitle}>Highlights & Notes</p>
            {notes.length === 0 ? (
              <p style={styles.helperText}>No notes yet.</p>
            ) : (
              <div style={styles.notesList}>
                {notes.map((note) => (
                  <div key={note.id} style={styles.noteRow}>
                    <div style={{ minWidth: 0 }}>
                      <p style={styles.noteType}>{note.note_type.toUpperCase()}</p>
                      {note.note_text && <p style={styles.noteText}>{note.note_text}</p>}
                      {note.selected_text && <p style={styles.noteSelection}>{note.selected_text}</p>}
                    </div>
                    <button style={styles.deleteButton} onClick={() => void deleteNote(note.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '14px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  backLink: {
    borderRadius: '10px',
    padding: '8px 12px',
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 600,
  },
  errorBox: {
    borderRadius: '10px',
    border: '1px solid #8a3838',
    backgroundColor: '#2a1515',
    color: '#f5caca',
    padding: '10px 12px',
    marginBottom: '12px',
    fontSize: '13px',
  },
  tools: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  toolButton: {
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '12px',
    fontWeight: 700,
    padding: '6px 10px',
    cursor: 'pointer',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '14px',
  },
  readerPane: {
    borderRadius: '14px',
    border: '1px solid var(--border)',
    height: '70vh',
    overflowY: 'auto',
  },
  segmentButton: {
    border: 'none',
    padding: '8px',
    borderRadius: '8px',
    width: '100%',
    textAlign: 'left',
    marginBottom: '6px',
    cursor: 'pointer',
  },
  sidePane: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  card: {
    borderRadius: '12px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    padding: '10px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 700,
  },
  helperText: {
    margin: '8px 0 0 0',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  selectionActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  smallButton: {
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-elevated)',
    color: 'var(--text)',
    fontSize: '12px',
    fontWeight: 700,
    padding: '6px 8px',
    cursor: 'pointer',
  },
  noteInput: {
    width: '100%',
    minHeight: '74px',
    marginTop: '8px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: '#0e0c09',
    color: '#f4ede2',
    padding: '8px',
    resize: 'vertical',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
  },
  notesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
    maxHeight: '40vh',
    overflowY: 'auto',
  },
  noteRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface-elevated)',
    padding: '8px',
  },
  noteType: {
    margin: 0,
    fontSize: '11px',
    color: 'var(--text-tertiary)',
    fontWeight: 700,
  },
  noteText: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: 'var(--text)',
    lineHeight: 1.45,
    wordBreak: 'break-word',
  },
  noteSelection: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
    wordBreak: 'break-word',
  },
  deleteButton: {
    border: 'none',
    background: 'transparent',
    color: '#d78787',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  centerCard: {
    borderRadius: '12px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface)',
    padding: '24px',
    textAlign: 'center',
  },
};

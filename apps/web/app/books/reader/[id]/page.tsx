'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchReaderDocumentAction, fetchReaderNotesAction } from '../../actions';

interface ReaderDocumentDetail {
  id: string;
  title: string;
  author?: string | null;
  progress_percent?: number | null;
  total_words?: number | null;
  text_content?: string;
}

interface ReaderNote {
  id: string;
  selected_text?: string | null;
  note_text?: string | null;
}

export default function ReaderDocumentPage() {
  const params = useParams<{ id: string }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [document, setDocument] = useState<ReaderDocumentDetail | null | undefined>(undefined);
  const [notes, setNotes] = useState<ReaderNote[]>([]);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;

    void Promise.all([
      fetchReaderDocumentAction(documentId),
      fetchReaderNotesAction(documentId),
    ]).then(([nextDocument, nextNotes]) => {
      if (cancelled) return;
      setDocument(nextDocument as ReaderDocumentDetail | null);
      setNotes(nextNotes as ReaderNote[]);
    });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (document === undefined) {
    return <p style={{ color: '#6B5845' }}>Loading reader document...</p>;
  }

  if (!document) {
    return (
      <section
        style={{
          padding: 24,
          borderRadius: 24,
          border: '1px solid rgba(123, 83, 36, 0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28 }}>Reader document not found</h1>
        <Link href="/books/reader" style={{ display: 'inline-block', marginTop: 16, color: '#8C5A2B', fontWeight: 700 }}>
          Back to Reader
        </Link>
      </section>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section
        style={{
          padding: 24,
          borderRadius: 24,
          border: '1px solid rgba(123, 83, 36, 0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 32 }}>{document.title}</h1>
        <p style={{ margin: '10px 0 0', color: '#6B5845' }}>{document.author ?? 'Unknown author'}</p>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 16 }}>
          <span>{Math.round(document.progress_percent ?? 0)}% complete</span>
          <span>{document.total_words ?? 0} words</span>
        </div>
      </section>

      <section
        style={{
          padding: 24,
          borderRadius: 24,
          border: '1px solid rgba(123, 83, 36, 0.12)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22 }}>Reader notes</h2>
        <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          {notes.length === 0 ? (
            <p style={{ margin: 0, color: '#6B5845' }}>No highlights or notes on this document yet.</p>
          ) : (
            notes.map((note) => (
              <article
                key={note.id}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  border: '1px solid rgba(123, 83, 36, 0.1)',
                  backgroundColor: '#FFFDF9',
                }}
              >
                {note.selected_text ? <blockquote style={{ margin: 0 }}>{note.selected_text}</blockquote> : null}
                {note.note_text ? <p style={{ margin: note.selected_text ? '12px 0 0' : 0 }}>{note.note_text}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

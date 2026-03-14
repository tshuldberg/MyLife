'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchReaderDocumentsAction } from '../actions';

interface ReaderDocumentSummary {
  id: string;
  title: string;
  author?: string | null;
  progress_percent?: number | null;
  total_words?: number | null;
  updated_at?: string | null;
}

export default function ReaderLibraryPage() {
  const [documents, setDocuments] = useState<ReaderDocumentSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchReaderDocumentsAction().then((result) => {
      if (!cancelled) {
        setDocuments(result as ReaderDocumentSummary[]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <h1 style={{ margin: 0, fontSize: 32 }}>Private Reader</h1>
        <p style={{ margin: '10px 0 0', color: '#6B5845' }}>
          Read private documents alongside your books and keep notes locally.
        </p>
      </section>

      {documents.length === 0 ? (
        <section
          style={{
            padding: 24,
            borderRadius: 24,
            border: '1px dashed rgba(123, 83, 36, 0.22)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22 }}>No reader documents yet</h2>
          <p style={{ margin: '10px 0 0', color: '#6B5845' }}>
            Reader document upload is part of the native MyBooks web rebuild. Your routes are live now so saved links do not break.
          </p>
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 14 }}>
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/books/reader/${document.id}`}
              style={{
                display: 'grid',
                gap: 6,
                padding: 18,
                borderRadius: 20,
                border: '1px solid rgba(123, 83, 36, 0.12)',
                backgroundColor: '#FFFFFF',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <strong style={{ fontSize: 18 }}>{document.title}</strong>
              <span style={{ color: '#6B5845' }}>{document.author ?? 'Unknown author'}</span>
              <span style={{ color: '#8C5A2B', fontWeight: 700 }}>
                {Math.round(document.progress_percent ?? 0)}% complete
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

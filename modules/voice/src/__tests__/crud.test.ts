import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createModuleTestDatabase, type InMemoryTestDatabase } from '@mylife/db';
import { VOICE_MODULE } from '../definition';
import {
  createTranscription,
  getTranscription,
  getTranscriptions,
  deleteTranscription,
  createVoiceNote,
  getVoiceNote,
  getVoiceNotes,
  updateVoiceNote,
  deleteVoiceNote,
  toggleFavorite,
  setSetting,
  getSetting,
  getSettings,
  getTranscriptionStats,
} from '../db/crud';

let testDb: InMemoryTestDatabase;

beforeEach(() => {
  testDb = createModuleTestDatabase('voice', VOICE_MODULE.migrations!);
});

afterEach(() => {
  testDb.close();
});

describe('Transcriptions', () => {
  it('creates a transcription and retrieves it by id', () => {
    const t = createTranscription(testDb.adapter, 't1', {
      text: 'Hello world',
      durationSeconds: 5.2,
      language: 'en',
      confidence: 0.95,
    });
    expect(t.id).toBe('t1');
    expect(t.text).toBe('Hello world');
    expect(t.durationSeconds).toBe(5.2);
    expect(t.language).toBe('en');
    expect(t.confidence).toBe(0.95);
    expect(t.audioUri).toBeNull();
    expect(t.createdAt).toBeTruthy();

    const found = getTranscription(testDb.adapter, 't1');
    expect(found).not.toBeNull();
    expect(found!.text).toBe('Hello world');
  });

  it('returns null for non-existent transcription', () => {
    expect(getTranscription(testDb.adapter, 'nope')).toBeNull();
  });

  it('creates a transcription with audio URI', () => {
    const t = createTranscription(testDb.adapter, 't2', {
      text: 'Test audio',
      durationSeconds: 10,
      audioUri: 'file:///audio/test.m4a',
    });
    expect(t.audioUri).toBe('file:///audio/test.m4a');
  });

  it('lists transcriptions ordered by created_at DESC', () => {
    createTranscription(testDb.adapter, 't3', { text: 'First', durationSeconds: 1 });
    createTranscription(testDb.adapter, 't4', { text: 'Second', durationSeconds: 2 });
    createTranscription(testDb.adapter, 't5', { text: 'Third', durationSeconds: 3 });

    // Force distinct timestamps so ORDER BY created_at DESC is deterministic
    testDb.adapter.execute(`UPDATE vc_transcriptions SET created_at = '2024-01-01T00:00:00' WHERE id = 't3'`);
    testDb.adapter.execute(`UPDATE vc_transcriptions SET created_at = '2024-01-02T00:00:00' WHERE id = 't4'`);
    testDb.adapter.execute(`UPDATE vc_transcriptions SET created_at = '2024-01-03T00:00:00' WHERE id = 't5'`);

    const all = getTranscriptions(testDb.adapter);
    expect(all).toHaveLength(3);
    // Most recent first
    expect(all[0].text).toBe('Third');
  });

  it('lists transcriptions with limit and offset', () => {
    createTranscription(testDb.adapter, 't6', { text: 'A', durationSeconds: 1 });
    createTranscription(testDb.adapter, 't7', { text: 'B', durationSeconds: 2 });
    createTranscription(testDb.adapter, 't8', { text: 'C', durationSeconds: 3 });

    const page = getTranscriptions(testDb.adapter, { limit: 2, offset: 1 });
    expect(page).toHaveLength(2);
  });

  it('deletes a transcription', () => {
    createTranscription(testDb.adapter, 't9', { text: 'Temp', durationSeconds: 1 });
    expect(getTranscription(testDb.adapter, 't9')).not.toBeNull();

    deleteTranscription(testDb.adapter, 't9');
    expect(getTranscription(testDb.adapter, 't9')).toBeNull();
  });

  it('handles nullable language and confidence', () => {
    const t = createTranscription(testDb.adapter, 't10', {
      text: 'No metadata',
      durationSeconds: 3,
    });
    expect(t.language).toBeNull();
    expect(t.confidence).toBeNull();
  });
});

describe('Voice Notes', () => {
  it('creates a voice note', () => {
    const note = createVoiceNote(testDb.adapter, 'n1', {
      title: 'Meeting notes',
      tags: 'work,meeting',
    });
    expect(note.id).toBe('n1');
    expect(note.title).toBe('Meeting notes');
    expect(note.tags).toBe('work,meeting');
    expect(note.isFavorite).toBe(false);
    expect(note.transcriptionId).toBeNull();
  });

  it('creates a voice note linked to a transcription', () => {
    createTranscription(testDb.adapter, 't-link', { text: 'Linked text', durationSeconds: 5 });
    const note = createVoiceNote(testDb.adapter, 'n2', {
      title: 'Linked note',
      transcriptionId: 't-link',
    });
    expect(note.transcriptionId).toBe('t-link');
  });

  it('retrieves a voice note by id', () => {
    createVoiceNote(testDb.adapter, 'n3', { title: 'Find me' });
    const found = getVoiceNote(testDb.adapter, 'n3');
    expect(found).not.toBeNull();
    expect(found!.title).toBe('Find me');

    expect(getVoiceNote(testDb.adapter, 'nope')).toBeNull();
  });

  it('lists voice notes with limit/offset', () => {
    createVoiceNote(testDb.adapter, 'n4', { title: 'A' });
    createVoiceNote(testDb.adapter, 'n5', { title: 'B' });
    createVoiceNote(testDb.adapter, 'n6', { title: 'C' });

    const all = getVoiceNotes(testDb.adapter);
    expect(all).toHaveLength(3);

    const limited = getVoiceNotes(testDb.adapter, { limit: 1 });
    expect(limited).toHaveLength(1);
  });

  it('updates a voice note title and tags', () => {
    createVoiceNote(testDb.adapter, 'n7', { title: 'Original', tags: 'old' });
    const updated = updateVoiceNote(testDb.adapter, 'n7', { title: 'Updated', tags: 'new' });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
    expect(updated!.tags).toBe('new');
  });

  it('returns null when updating non-existent voice note', () => {
    expect(updateVoiceNote(testDb.adapter, 'ghost', { title: 'Nope' })).toBeNull();
  });

  it('deletes a voice note', () => {
    createVoiceNote(testDb.adapter, 'n8', { title: 'Delete me' });
    deleteVoiceNote(testDb.adapter, 'n8');
    expect(getVoiceNote(testDb.adapter, 'n8')).toBeNull();
  });

  it('toggles favorite on a voice note', () => {
    createVoiceNote(testDb.adapter, 'n9', { title: 'Toggle test' });
    expect(getVoiceNote(testDb.adapter, 'n9')!.isFavorite).toBe(false);

    const toggled = toggleFavorite(testDb.adapter, 'n9');
    expect(toggled!.isFavorite).toBe(true);

    const toggledBack = toggleFavorite(testDb.adapter, 'n9');
    expect(toggledBack!.isFavorite).toBe(false);
  });

  it('returns null when toggling favorite on non-existent note', () => {
    expect(toggleFavorite(testDb.adapter, 'ghost')).toBeNull();
  });
});

describe('Settings', () => {
  it('gets and sets settings', () => {
    expect(getSetting(testDb.adapter, 'language')).toBeNull();
    setSetting(testDb.adapter, 'language', 'en');
    expect(getSetting(testDb.adapter, 'language')).toBe('en');
  });

  it('upserts settings on conflict', () => {
    setSetting(testDb.adapter, 'theme', 'dark');
    setSetting(testDb.adapter, 'theme', 'light');
    expect(getSetting(testDb.adapter, 'theme')).toBe('light');
  });

  it('lists all settings', () => {
    setSetting(testDb.adapter, 'a', '1');
    setSetting(testDb.adapter, 'b', '2');
    const all = getSettings(testDb.adapter);
    expect(all).toHaveLength(2);
    expect(all[0].key).toBe('a');
    expect(all[1].key).toBe('b');
  });
});

describe('Transcription Stats', () => {
  it('returns zero stats for empty database', () => {
    const stats = getTranscriptionStats(testDb.adapter);
    expect(stats.totalCount).toBe(0);
    expect(stats.totalDurationSeconds).toBe(0);
    expect(stats.avgDurationSeconds).toBe(0);
    expect(stats.byLanguage).toHaveLength(0);
  });

  it('calculates aggregate stats', () => {
    createTranscription(testDb.adapter, 's1', { text: 'A', durationSeconds: 10, language: 'en' });
    createTranscription(testDb.adapter, 's2', { text: 'B', durationSeconds: 20, language: 'en' });
    createTranscription(testDb.adapter, 's3', { text: 'C', durationSeconds: 30, language: 'es' });

    const stats = getTranscriptionStats(testDb.adapter);
    expect(stats.totalCount).toBe(3);
    expect(stats.totalDurationSeconds).toBe(60);
    expect(stats.avgDurationSeconds).toBe(20);
    expect(stats.byLanguage).toHaveLength(2);
    expect(stats.byLanguage[0].language).toBe('en');
    expect(stats.byLanguage[0].count).toBe(2);
    expect(stats.byLanguage[1].language).toBe('es');
    expect(stats.byLanguage[1].count).toBe(1);
  });

  it('groups null language as unknown', () => {
    createTranscription(testDb.adapter, 's4', { text: 'No lang', durationSeconds: 5 });
    const stats = getTranscriptionStats(testDb.adapter);
    expect(stats.byLanguage[0].language).toBe('unknown');
  });
});

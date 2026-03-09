import { describe, it, expect } from 'vitest';
import {
  calculateWordCount,
  calculateReadingTime,
  extractKeywords,
  summarizeText,
  formatDuration,
} from '../engine/text';

describe('calculateWordCount', () => {
  it('counts words in a normal sentence', () => {
    expect(calculateWordCount('Hello world')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(calculateWordCount('')).toBe(0);
  });

  it('returns 0 for whitespace-only string', () => {
    expect(calculateWordCount('   ')).toBe(0);
  });

  it('handles multiple spaces between words', () => {
    expect(calculateWordCount('one   two   three')).toBe(3);
  });

  it('counts single word', () => {
    expect(calculateWordCount('hello')).toBe(1);
  });
});

describe('calculateReadingTime', () => {
  it('returns 0 for empty text', () => {
    expect(calculateReadingTime('')).toBe(0);
  });

  it('returns 1 minute minimum for short text', () => {
    expect(calculateReadingTime('Hello world')).toBe(1);
  });

  it('calculates time for longer text', () => {
    const words = Array(400).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(2);
  });

  it('rounds up to nearest minute', () => {
    const words = Array(201).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(2);
  });
});

describe('extractKeywords', () => {
  it('returns empty array for empty text', () => {
    expect(extractKeywords('')).toEqual([]);
  });

  it('filters stop words', () => {
    const keywords = extractKeywords('the cat is on the mat and the dog');
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('is');
    expect(keywords).not.toContain('on');
    expect(keywords).not.toContain('and');
  });

  it('returns top N keywords by frequency', () => {
    const text = 'apple banana apple cherry apple banana';
    const keywords = extractKeywords(text, 2);
    expect(keywords).toHaveLength(2);
    expect(keywords[0]).toBe('apple');
    expect(keywords[1]).toBe('banana');
  });

  it('filters short words (length <= 2)', () => {
    const keywords = extractKeywords('I am so be to do go');
    expect(keywords).toHaveLength(0);
  });

  it('handles punctuation in text', () => {
    const keywords = extractKeywords('Hello, world! Hello again.');
    expect(keywords).toContain('hello');
  });
});

describe('summarizeText', () => {
  it('returns empty string for empty input', () => {
    expect(summarizeText('')).toBe('');
  });

  it('returns first N sentences', () => {
    const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
    const summary = summarizeText(text, 2);
    expect(summary).toBe('First sentence. Second sentence.');
  });

  it('returns all text if fewer sentences than requested', () => {
    const text = 'Only one sentence.';
    expect(summarizeText(text, 3)).toBe('Only one sentence.');
  });

  it('defaults to 3 sentences', () => {
    const text = 'One. Two. Three. Four. Five.';
    const summary = summarizeText(text);
    expect(summary).toBe('One. Two. Three.');
  });
});

describe('formatDuration', () => {
  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(83)).toBe('1m 23s');
  });

  it('formats exact minutes', () => {
    expect(formatDuration(120)).toBe('2m');
  });

  it('formats large durations', () => {
    expect(formatDuration(3661)).toBe('61m 1s');
  });

  it('handles negative values', () => {
    expect(formatDuration(-5)).toBe('0s');
  });
});

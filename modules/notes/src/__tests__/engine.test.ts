import { describe, it, expect } from 'vitest';
import {
  extractBacklinks,
  countWords,
  extractHeadings,
  countChecklistItems,
  generateSnippet,
} from '../engine/markdown';

describe('extractBacklinks', () => {
  it('extracts single backlink', () => {
    expect(extractBacklinks('See [[My Note]] for more')).toEqual(['My Note']);
  });

  it('extracts multiple backlinks', () => {
    expect(extractBacklinks('Link to [[Note A]] and [[Note B]]')).toEqual(['Note A', 'Note B']);
  });

  it('deduplicates repeated links', () => {
    expect(extractBacklinks('[[Same]] and [[Same]] again')).toEqual(['Same']);
  });

  it('returns empty for no backlinks', () => {
    expect(extractBacklinks('No links here')).toEqual([]);
  });

  it('handles empty brackets', () => {
    expect(extractBacklinks('Empty [[]] here')).toEqual([]);
  });

  it('trims whitespace in link titles', () => {
    expect(extractBacklinks('[[ Spaced Title  ]]')).toEqual(['Spaced Title']);
  });
});

describe('countWords', () => {
  it('counts words in plain text', () => {
    expect(countWords('Hello world foo bar')).toBe(4);
  });

  it('strips markdown headings', () => {
    expect(countWords('# Heading\n\nSome text here')).toBe(4);
  });

  it('strips markdown formatting', () => {
    expect(countWords('**bold** and *italic* text')).toBe(4);
  });

  it('strips markdown links', () => {
    expect(countWords('[click here](http://example.com) for more')).toBe(4);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for whitespace only', () => {
    expect(countWords('   \n\t  ')).toBe(0);
  });
});

describe('extractHeadings', () => {
  it('extracts headings with levels', () => {
    const md = '# Title\n## Section\n### Subsection\nRegular text';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ level: 1, text: 'Title' });
    expect(headings[1]).toEqual({ level: 2, text: 'Section' });
    expect(headings[2]).toEqual({ level: 3, text: 'Subsection' });
  });

  it('returns empty for no headings', () => {
    expect(extractHeadings('Just text')).toHaveLength(0);
  });
});

describe('countChecklistItems', () => {
  it('counts checked and unchecked items', () => {
    const md = '- [ ] Todo 1\n- [x] Done 1\n- [ ] Todo 2\n- [x] Done 2';
    const result = countChecklistItems(md);
    expect(result.total).toBe(4);
    expect(result.checked).toBe(2);
  });

  it('returns zero for no checklists', () => {
    expect(countChecklistItems('No checklists')).toEqual({ total: 0, checked: 0 });
  });
});

describe('generateSnippet', () => {
  it('generates short snippet from body', () => {
    const snippet = generateSnippet('# Title\n\nSome **bold** content here', 50);
    expect(snippet).not.toContain('#');
    expect(snippet).not.toContain('**');
    expect(snippet.length).toBeLessThanOrEqual(53); // 50 + "..."
  });

  it('returns full text if under maxLength', () => {
    expect(generateSnippet('Short text')).toBe('Short text');
  });

  it('truncates long text with ellipsis', () => {
    const long = 'word '.repeat(100);
    const snippet = generateSnippet(long, 30);
    expect(snippet.endsWith('...')).toBe(true);
    expect(snippet.length).toBeLessThanOrEqual(33);
  });
});

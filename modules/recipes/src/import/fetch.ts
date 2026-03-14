/**
 * URL fetch layer for recipe import.
 * Fetches raw HTML from URLs with timeout, size limits, and basic cleaning.
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB

export type ImportErrorCode = 'network' | 'timeout' | 'blocked' | 'parse' | 'unsupported';

export class ImportError extends Error {
  constructor(
    message: string,
    public readonly code: ImportErrorCode,
    public readonly originalUrl: string,
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

export interface FetchResult {
  html: string;
  finalUrl: string;
  contentType: string;
}

/**
 * Fetch HTML from a URL with timeout and size limits.
 * Strips <script> and <style> tags from the response to reduce payload size.
 */
export async function fetchHtml(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'MyLife/1.0 (Recipe Import)',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new ImportError(
        `Server returned ${response.status}`,
        response.status === 403 || response.status === 429 ? 'blocked' : 'network',
        url,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new ImportError(
        `Unexpected content type: ${contentType}`,
        'unsupported',
        url,
      );
    }

    const raw = await response.text();
    if (raw.length > MAX_BODY_BYTES) {
      throw new ImportError(
        `Response too large (${Math.round(raw.length / 1024)}KB)`,
        'unsupported',
        url,
      );
    }

    const html = stripScriptsAndStyles(raw);
    return { html, finalUrl: response.url, contentType };
  } catch (error) {
    if (error instanceof ImportError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ImportError('Request timed out', 'timeout', url);
    }

    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new ImportError(message, 'network', url);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Remove <script> and <style> tags to reduce HTML size,
 * but preserve <script type="application/ld+json"> blocks
 * which contain structured recipe data (JSON-LD).
 */
function stripScriptsAndStyles(html: string): string {
  return html
    .replace(/<script(?![^>]*type\s*=\s*["']application\/ld\+json["'])[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
}

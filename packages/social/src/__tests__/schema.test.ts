import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('social schema secure links', () => {
  it('defines secure friend link tables and the confirmation RPC', () => {
    const schema = readFileSync(
      new URL('../schema.sql', import.meta.url),
      'utf8',
    );

    expect(schema).toContain('create table if not exists social_friend_links');
    expect(schema).toContain('create table if not exists social_friendships');
    expect(schema).toContain('create or replace function social_confirm_friend_link');
    expect(schema).toContain('on conflict (follower_id, followee_id) do update');
  });
});

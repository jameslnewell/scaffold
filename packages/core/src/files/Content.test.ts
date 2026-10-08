import {describe, expect, test} from 'vitest';
import {DiskContent} from './DiskContent.js';
import {isLazyContent} from './Content.js';

describe(isLazyContent, () => {
  test('is false for bytes', () => {
    expect(isLazyContent(new Uint8Array())).toBe(false);
  });

  test('is true for any object which can be read and stat-ed', () => {
    expect(isLazyContent(new DiskContent('/a.txt'))).toBe(true);
    expect(
      isLazyContent({
        read: () => Promise.resolve(new Uint8Array()),
        stat: () => Promise.resolve({size: 0}),
      }),
    ).toBe(true);
  });
});

import {describe, expect, test} from 'vitest';
import {Files} from '../files/index.js';
import type {Scaffold} from './Scaffold.js';
import {pipe} from './pipe.js';
import {write} from './operations.js';

describe(pipe, () => {
  test('passes the tree through each scaffold in order', async () => {
    const order: string[] = [];
    const log =
      (name: string): Scaffold =>
      async (files) => {
        await Promise.resolve();
        order.push(name);
        return files;
      };
    const files = await pipe(
      log('first'),
      write('a.txt', 'a'),
      log('second'),
      (files) => files.remove('a.txt').write('b.txt', new Uint8Array()),
    )(new Files());
    expect(order).toEqual(['first', 'second']);
    expect(files.paths()).toEqual(['b.txt']);
  });
});

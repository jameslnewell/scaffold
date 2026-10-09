import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {Files, fromDisk, readText, writeText} from '@buildscaffold/core/files';
import {describe, expect, test} from 'vitest';
import {template} from './files.js';

describe(template, () => {
  test('renders .ejs files and removes the extension', async () => {
    const files = await template(
      writeText(new Files(), 'package.json.ejs', '{"name": "<%= name %>"}'),
      {name: 'Bob'},
    );
    expect([...files.keys()]).toEqual(['package.json']);
    await expect(readText(files, 'package.json')).resolves.toBe(
      '{"name": "Bob"}',
    );
  });

  test('leaves other files as they are', async () => {
    const images = writeText(new Files(), 'logo.jpg', 'not really an image');
    const files = await template(images, {});
    expect(files.get('logo.jpg')).toBe(images.get('logo.jpg'));
  });

  test('does not HTML escape values', async () => {
    const files = await template(
      writeText(new Files(), 'a.json.ejs', '"<%= value %>"'),
      {value: `Bob's <tool> & co`},
    );
    await expect(readText(files, 'a.json')).resolves.toBe(
      `"Bob's <tool> & co"`,
    );
  });

  test('includes templates relative to the directory they were loaded from', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    try {
      await fs.mkdir(path.join(dir, 'partials'));
      await fs.writeFile(path.join(dir, 'partials/name.ejs'), '<%= name %>');
      await fs.writeFile(
        path.join(dir, 'README.md.ejs'),
        `# <%- include('partials/name') %>`,
      );
      const files = await template(
        await fromDisk(dir, {glob: '*.ejs'}),
        {name: 'Bob'},
        {directory: dir},
      );
      await expect(readText(files, 'README.md')).resolves.toBe('# Bob');
    } finally {
      await fs.rm(dir, {recursive: true, force: true});
    }
  });

  test('throws when a template would replace another file', async () => {
    const files = writeText(
      writeText(new Files(), 'a.txt', ''),
      'a.txt.ejs',
      '',
    );
    await expect(template(files, {})).rejects.toThrow(
      'Template "a.txt.ejs" would replace "a.txt"',
    );
  });

  test('leaves a file named .ejs as it is', async () => {
    const files = await template(writeText(new Files(), 'dir/.ejs', ''), {});
    expect([...files.keys()]).toEqual(['dir/.ejs']);
  });

  test('reports which template failed to render', async () => {
    await expect(
      template(writeText(new Files(), 'a.txt.ejs', '<%= missing %>'), {}),
    ).rejects.toThrow('Template "a.txt.ejs" failed to render');
  });
});

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {Files, fromDisk, readText, writeText} from '@buildscaffold/core/files';
import {describe, expect, test} from 'vitest';
import {pathToFileURL} from 'node:url';
import {template} from './index.js';

describe(template, () => {
  test('merges the rendered tree into the destination', async () => {
    const templates = await writeText(
      new Files(),
      'README.md.ejs',
      '# <%= name %>',
    );
    const destination = await writeText(new Files(), 'other.txt', '');

    const files = await template(
      Promise.resolve(templates),
      {name: 'Bob'},
      {
        to: 'docs',
      },
    )(destination);

    expect([...files.keys()]).toEqual(['docs/README.md', 'other.txt']);
    await expect(readText(files, 'docs/README.md')).resolves.toBe('# Bob');
  });

  test.skipIf(process.platform === 'win32')(
    'renders the templates in a directory given as a URL, keeping their modes',
    async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
      try {
        await fs.writeFile(path.join(dir, 'run.sh.ejs'), 'echo <%= name %>');
        await fs.chmod(path.join(dir, 'run.sh.ejs'), 0o755);

        const files = await template(pathToFileURL(dir), {name: 'Bob'})(
          new Files(),
        );

        await expect(readText(files, 'run.sh')).resolves.toBe('echo Bob');
        expect((await files.get('run.sh')?.stat())?.mode).toBe(
          (await fs.stat(path.join(dir, 'run.sh.ejs'))).mode,
        );
      } finally {
        await fs.rm(dir, {recursive: true, force: true});
      }
    },
  );

  test('includes templates relative to the directory they were loaded from', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
    try {
      await fs.mkdir(path.join(dir, 'partials'));
      await fs.writeFile(path.join(dir, 'partials/name.ejs'), '<%= name %>');
      await fs.writeFile(
        path.join(dir, 'README.md.ejs'),
        `# <%- include('partials/name') %>`,
      );

      const files = await template(dir, {name: 'Bob'})(new Files());
      await expect(readText(files, 'README.md')).resolves.toBe('# Bob');

      const fromTree = await template(
        fromDisk(dir),
        {name: 'Bob'},
        {
          directory: dir,
        },
      )(new Files());
      await expect(readText(fromTree, 'README.md')).resolves.toBe('# Bob');
    } finally {
      await fs.rm(dir, {recursive: true, force: true});
    }
  });
});

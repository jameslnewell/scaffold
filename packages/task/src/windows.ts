import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Windows can't spawn commands like `npm` directly: they're `.cmd` shims found through PATH and PATHEXT, and Node
// refuses to spawn `.cmd` and `.bat` files without a shell (CVE-2024-27980). So, like cross-spawn, commands are
// resolved by hand and shims are run through cmd.exe with their arguments escaped, so they can't inject commands.

// the characters cmd.exe treats specially, which are escaped with ^ (the same set cross-spawn escapes)
const CMD_META_CHARACTERS = /([()\][%!^"`<>&|;, *?])/g;

// the extensions which can be spawned, or run through cmd.exe. Others in PATHEXT, e.g. .JS, open in another program
const RUNNABLE_EXTENSIONS = new Set(['.com', '.exe', '.bat', '.cmd']);

interface ResolveWindowsCommandOptions {
  command: string;
  cwd: string;
  /** The PATH environment variable */
  path: string | undefined;
  /** The PATHEXT environment variable */
  pathext: string | undefined;
}

/**
 * The path of the file which runs the command, found in each directory in PATH, trying each extension in PATHEXT
 * which can be run, or `undefined` when there is none. A command with a directory in it is resolved from `cwd`
 * instead, so files in the scaffolded directory can't stand in for commands like `npm` or `git`.
 */
export async function resolveWindowsCommand({
  command,
  cwd,
  path: searchPath,
  pathext,
}: ResolveWindowsCommandOptions): Promise<string | undefined> {
  const extensions = (pathext || '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .filter((extension) => RUNNABLE_EXTENSIONS.has(extension.toLowerCase()));
  const hasExtension = RUNNABLE_EXTENSIONS.has(
    path.extname(command).toLowerCase(),
  );
  const names = hasExtension
    ? [command]
    : extensions.map((extension) => `${command}${extension}`);
  const directories = /[\\/]/.test(command)
    ? [cwd]
    : (searchPath ?? '')
        .split(';')
        // installers sometimes quote directories with spaces in them
        .map((directory) => directory.replace(/^"(.*)"$/, '$1'))
        .filter((directory) => directory !== '');

  for (const directory of directories) {
    const files = await Promise.all(
      names.map(async (name) => {
        const file = path.resolve(directory, name);
        try {
          return (await fs.stat(file)).isFile() ? file : undefined;
        } catch {
          return undefined;
        }
      }),
    );
    const found = files.find((file) => file !== undefined);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** Quotes an argument for cmd.exe, escaping its metacharacters so it's passed as-is */
export function escapeCmdArgument(
  argument: string,
  {doubleEscape = false}: {doubleEscape?: boolean} = {},
): string {
  // the quoting rules of the program's argument parser: backslashes before a quote, or at the end, are doubled
  let escaped = argument
    .replace(/(\\*)"/g, '$1$1\\"')
    .replace(/(\\*)$/, '$1$1');
  escaped = `"${escaped}"`.replace(CMD_META_CHARACTERS, '^$1');
  // the shims npm installs in node_modules/.bin pass their arguments through cmd.exe a second time
  return doubleEscape ? escaped.replace(CMD_META_CHARACTERS, '^$1') : escaped;
}

interface WindowsSpawnOptions {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
}

export interface WindowsSpawn {
  file: string;
  args: string[];
  /** Whether the arguments are already quoted for cmd.exe and must be passed verbatim */
  verbatim: boolean;
}

/**
 * How to spawn the command on Windows: `.exe` and other files directly, and `.cmd` and `.bat` files through
 * cmd.exe with escaped arguments.
 */
export async function toWindowsSpawn({
  command,
  args,
  cwd,
  env,
}: WindowsSpawnOptions): Promise<WindowsSpawn> {
  const file = await resolveWindowsCommand({
    command,
    cwd,
    path: env['PATH'] ?? env['Path'],
    pathext: env['PATHEXT'],
  });
  // an unresolved command is spawned as-is, so it fails with ENOENT as it would elsewhere
  if (file === undefined || !/\.(?:cmd|bat)$/i.test(file)) {
    return {file: file ?? command, args, verbatim: false};
  }
  // cmd.exe stops reading the command line at a line break, which would silently drop the rest of the arguments
  if (args.some((argument) => /[\r\n]/.test(argument))) {
    throw new Error(
      `Arguments to "${command}" can't contain line breaks, since it runs through cmd.exe`,
    );
  }
  const doubleEscape = /node_modules[\\/]\.bin[\\/][^\\/]+\.cmd$/i.test(file);
  const line = [
    path.normalize(file).replace(CMD_META_CHARACTERS, '^$1'),
    ...args.map((argument) => escapeCmdArgument(argument, {doubleEscape})),
  ].join(' ');
  return {
    file: env['comspec'] ?? env['ComSpec'] ?? 'cmd.exe',
    args: ['/d', '/s', '/c', `"${line}"`],
    verbatim: true,
  };
}

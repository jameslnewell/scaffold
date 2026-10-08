// Scaffold modules import this at runtime, so it must only import types, never yargs or inquirer.
import type {Scaffold} from '@buildscaffold/core';
import type {Task} from '@buildscaffold/task';

interface ScaffoldOptionBase {
  /** Shown in the CLI's help and when prompting */
  description: string;
  /** Whether the option can be omitted, defaults to `false` */
  optional?: boolean;
  /** Whether the option accepts several values e.g. `--tag a --tag b` */
  array?: boolean;
}

/** Describes an option the scaffold accepts, which becomes a `--<name>` flag */
export type ScaffoldOption =
  | (ScaffoldOptionBase & {type: 'boolean'})
  | (ScaffoldOptionBase & {type: 'number'})
  | (ScaffoldOptionBase & {type: 'string'})
  | (ScaffoldOptionBase & {type: 'choice'; choices: readonly string[]});

/** The options a scaffold accepts, keyed by name */
export type ScaffoldOptions = Readonly<Record<string, ScaffoldOption>>;

type ScaffoldOptionValue<O extends ScaffoldOption> = O extends {
  type: 'choice';
  choices: ReadonlyArray<infer C>;
}
  ? C
  : O extends {type: 'boolean'}
    ? boolean
    : O extends {type: 'number'}
      ? number
      : string;

type ScaffoldOptionValues<O extends ScaffoldOptions> = {
  [Name in keyof O]: O[Name] extends {array: true}
    ? Array<ScaffoldOptionValue<O[Name]>>
    : ScaffoldOptionValue<O[Name]>;
};

/**
 * The values of the options, inferred from their descriptions. Optional options may be `undefined`.
 *
 * @example
 * type Values = InferScaffoldOptionValues<{name: {type: 'string'; description: 'Name'}}>; // {name: string}
 */
export type InferScaffoldOptionValues<O extends ScaffoldOptions> = {
  -readonly [
    Name in keyof O as O[Name] extends {optional: true} ? never : Name
  ]: ScaffoldOptionValues<O>[Name];
} & {
  -readonly [
    Name in keyof O as O[Name] extends {optional: true} ? Name : never
  ]?: ScaffoldOptionValues<O>[Name] | undefined;
};

/** Creates the scaffold from the option values */
export type ScaffoldFactory<Values> = (options: Values) => Scaffold;

/** Creates the task to run after the changes have been applied from the option values */
export type TasksFactory<Values> = (options: Values) => Task;

export interface ScaffoldModule<O extends ScaffoldOptions = ScaffoldOptions> {
  options?: O;
  scaffold: ScaffoldFactory<InferScaffoldOptionValues<O>>;
  tasks?: TasksFactory<InferScaffoldOptionValues<O>> | undefined;
}

/**
 * Define a scaffold module for the `scaffold` CLI. Export the result as the module's default export.
 *
 * The values passed to `scaffold` and `tasks` are typed from `options`.
 *
 * @example
 * export default defineScaffold({
 *   options: {name: {type: 'string', description: 'Who to greet'}},
 *   scaffold: ({name}) => write('greeting.txt', `Hello ${name}!`),
 *   tasks: () => git.init(),
 * });
 */
export function defineScaffold<
  const O extends ScaffoldOptions = ScaffoldOptions,
>(module: ScaffoldModule<O>): ScaffoldModule<O> {
  return module;
}

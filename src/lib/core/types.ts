
export interface Files {
  read(file: string): string
  write(file: string, content: string): void
  delete(file: string): void
  move(src: string, dest: string): void
}

export interface Task {
  (): void | Promise<void>
}

export interface Tasks extends Iterable<Task> {
  [Symbol.iterator](): Iterator<Task>
  addTask(task: Task): void
}

type PromptType = 'boolean' | 'number' | 'string' | 'choice'

type Prompt = {
  type: Omit<PromptType, 'choice'>
  array?: boolean
  optional?: boolean
  description: string
} | {
  type: 'choice'
  array?: boolean
  optional?: boolean
  description: string
}

export interface Prompts {
  [name: string]: Prompt
}

type RequiredOptionType<P extends Prompt> = 
  P extends {type: 'boolean', array: true} ? boolean[]
  : P extends {type: 'number', array: true} ? number[]
  : P extends {type: 'string', array: true} ? string[]
  : P extends {type: 'boolean'} ? boolean
  : P extends {type: 'number'} ? number
  : P extends {type: 'string'} ? string
  : P extends {type: 'choices', choices: Array<infer C>} ? C
  : unknown 

export type Option<P extends Prompt> = 
  P extends {optional: true} ? RequiredOptionType<P> | undefined
  : RequiredOptionType<P>

export type Options<P extends Prompts> = {
  [name in keyof P]: Option<P[name]>
}

export interface Scaffold {
  (files: Files, tasks: Tasks): Promise<void> | void
}

export interface Factory<Options extends {}> {
  (options: Options): Scaffold
}
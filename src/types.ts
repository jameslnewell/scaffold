
// =============== CORE ===============

interface Stats {
  isFile: boolean
  isDirectory: boolean
}

export interface Files {
  stat(file: string): Stats | undefined
  read(file: string): Buffer | undefined
  write(file: string, content: Buffer): void
  delete(file: string): void
  list(directory: string): string[]
}

interface TaskContext {
  cwd: string
}

export interface Task {
  (context: TaskContext): Promise<void>
}

export interface Tasks extends Iterable<Task> {
  queue(task: Task): void
}

export interface ScaffoldContext {
  cwd: string
  files: Files
  tasks: Tasks
}

export interface Scaffold {
  (context: ScaffoldContext): Promise<void>
}

export interface ScaffoldFactory<Options extends {} = {}> {
  (options: Options): Scaffold
}

// =============== PROMPTS ===============

export type ScaffoldPromptType = 'boolean' | 'number' | 'string' | 'choice'

export type ScaffoldPrompt = {
  type: 'boolean'
  array?: boolean
  optional?: boolean
  description: string
} | {
  type: 'number'
  array?: boolean
  optional?: boolean
  description: string
} | {
  type: 'string'
  array?: boolean
  optional?: boolean
  description: string
} | {
  type: 'choice'
  array?: boolean
  optional?: boolean
  description: string
  choices?: string[]
}

export interface ScaffoldPrompts {
  [name: string]: ScaffoldPrompt
}

type RequiredOptionType<P extends ScaffoldPrompt> = 
  P extends {type: 'boolean', array: true} ? boolean[]
  : P extends {type: 'number', array: true} ? number[]
  : P extends {type: 'string', array: true} ? string[]
  : P extends {type: 'boolean'} ? boolean
  : P extends {type: 'number'} ? number
  : P extends {type: 'string'} ? string
  : P extends {type: 'choices', choices: Array<infer C>} ? C
  : unknown 

export type ScaffoldOption<P extends ScaffoldPrompt> = 
  P extends {optional: true} ? RequiredOptionType<P> | undefined
  : RequiredOptionType<P>

export type ScaffoldOptions<P extends ScaffoldPrompts> = {
  [name in keyof P]: ScaffoldOption<P[name]>
}

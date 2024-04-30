
// =============== CORE ===============

export interface ScaffoldFiles {
  exists(file: string): boolean
  read(file: string): string
  write(file: string, content: string): void
  delete(file: string): void
  list(directory: string): string[]
}

export interface ScaffoldTask {
  (): Promise<void>
}

export interface ScaffoldTasks extends Iterable<ScaffoldTask> {
  queue(task: ScaffoldTask): void
}

export interface ScaffoldContext {
  files: ScaffoldFiles
  tasks: ScaffoldTasks
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

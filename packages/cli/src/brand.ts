// Symbol.for() rather than Symbol(), so a module defined with one copy of the CLI is recognised by another
export const SCAFFOLD_MODULE = Symbol.for('@buildscaffold/cli/scaffold-module');

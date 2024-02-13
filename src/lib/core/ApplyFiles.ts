import * as fs from 'node:fs'
import { Files } from "./types.js";

export class ApplyFiles implements Files {
  #writes: Map<string, string> = new Map()
  #deletes: Set<string> = new Set()
  #moves: Map<string, {content: string}> = new Map()

  read(file: string): string {
    return fs.readFileSync(file).toString()
  }

  write(file: string, content: string): void {
    this.#deletes.delete(file)
    this.#writes.set(file, content)
  }

  delete(file: string): void {
    this.#writes.delete(file)
    this.#deletes.add(file)
  }
  
  move(src: string, dest: string): void {
    throw new Error('TODO')
  }

  diff() {
    const statuses = new Map<string, string>()

    for (const [file, contents] of this.#writes) {
      statuses.set(file, 'U')
    }

    for (const [file] of this.#deletes) {
      statuses.set(file, 'D')
    }

    // TODO: move
    return statuses
  }

  apply() {
    for (const [file, contents] of this.#writes) {
      fs.writeFileSync(file, contents)
    }

    for (const [file] of this.#deletes) {
      fs.unlinkSync(file)
    }

    // TODO: move

  }
}
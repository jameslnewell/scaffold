import { Scaffold } from "../types.js";

export function chain(scaffolds: Scaffold[]): Scaffold {
  return async (context) => {
    for (const scaffold of scaffolds) {
      await scaffold(context)
    }
  }
}
export function deepAssign(a: unknown, b: unknown): unknown {
  return Object.assign({}, b, a);
}

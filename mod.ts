import { Cmd, Process, process } from "./process.ts";

export type Fun<X, Y> = (x: X) => Y;

export type AsyncFun<X, Y> = Fun<Promise<X>, Promise<Y>>;

export type PipedFun<X, Y> = Fun<Piped<X>, Piped<Y>>;

export type Piped<Y> = Process & {
  map: AsyncFun<Uint8Array, Y>;
};

export async function piped<Y>(f: PipedFun<Uint8Array, Y>): Promise<Y> {
  const noop: Piped<Uint8Array> = { cmd: [], map: (x) => x };
  const piped = f(noop);
  return piped.map(process(piped));
}

export function pipe<X, Y, Z>(f: Fun<X, Y>, g: Fun<Y, Z>): Fun<X, Z> {
  return (x) => g(f(x));
}

export function map<X, Y>(f: AsyncFun<X, Y>): PipedFun<X, Y> {
  return (p) => ({
    ...p,
    map: (x) => f(p.map(x)),
  });
}

export function mapSync<X, Y>(f: Fun<X, Y>): PipedFun<X, Y> {
  return map(async (x) => f(await x));
}

export function set<X>(q: Partial<Piped<X>>): PipedFun<X, X> {
  return (p) => ({ ...p, ...q });
}

export function cmd<X>(...cmd: Cmd): PipedFun<X, X> {
  return set({ cmd });
}

export const success: PipedFun<any, boolean> = map(
  async (result) => {
    try {
      await result;
      return true;
    } catch (error) {
      return false;
    }
  },
);

export const text: PipedFun<Uint8Array, string> = map(
  async (buffer) => {
    return new TextDecoder().decode(await buffer);
  },
);

import { exists } from "https://deno.land/std@0.91.0/fs/mod.ts";
import { cmd, map, mapSync, pipe, success, text } from "./mod.ts";
import { join } from "https://deno.land/std@0.93.0/path/mod.ts";

export const init = pipe(
  cmd("git", "init"),
  success,
);

export const isWorkTree = pipe(
  cmd("git", "rev-parse", "--is-inside-work-tree"),
  success,
);

export const isWorkTreeRoot = pipe(
  isWorkTree,
  map(async (x) => await x && await exists(join(Deno.cwd(), ".git"))),
);

export const isWorkTreeClean = pipe(
  cmd<Uint8Array>("git", "status", "--porcelain"),
  pipe(text, (x) => x),
);

export const getCurrentBranch = pipe(
  cmd<Uint8Array>("git", "branch", "--show-current"),
  pipe(text, mapSync((x) => x.trim())),
);

export const getCurrentTag = pipe(
  cmd<Uint8Array>("git", "describe"),
  pipe(text, mapSync((x) => x.trim())),
);

export const getTags = pipe(
  cmd<Uint8Array>("git", "tag"),
  pipe(
    text,
    mapSync((x) =>
      x
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
    ),
  ),
);

export function addTag(name: string, opts: {
  message?: string;
} = {}) {
  const annotated = opts.message ? ["-a", "-m", opts.message] : [];
  return pipe(
    cmd("git", "tag", ...annotated, name),
    success,
  );
}

export function push(repository: string, refspec: string) {
  return pipe(
    cmd("git", "push", repository, refspec),
    success,
  );
}

export function addSubmodule(
  url: string,
  path: string,
  opts: {
    force?: boolean;
  } = {},
) {
  const force = opts.force ? ["--force"] : [];
  return pipe(
    cmd("git", "submodule", "add", ...force, url, path),
    success,
  );
}

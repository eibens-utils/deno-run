import {
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@0.90.0/testing/asserts.ts";
import { cmd, pipe, piped, set, success, text } from "./mod.ts";
import { join } from "https://deno.land/std@0.91.0/path/mod.ts";

const mockcliFile = "mockcli.ts";
const denoRun = ["deno", "run", "--allow-read"];
const mockcli = [...denoRun, mockcliFile];

const answer = pipe(
  set({ cmd: [...mockcli, "answer"] }),
  text,
);

function echo(data?: string) {
  return pipe(
    cmd<Uint8Array>(...mockcli, "echo"),
    pipe(set({ input: data }), text),
  );
}

function fail(data: string) {
  return pipe(
    cmd(...mockcli, "fail"),
    set({ input: data }),
  );
}

Deno.test("runs a command and returns the output", async () => {
  assertEquals(
    await piped(answer),
    "42\n",
  );
});

Deno.test("run passes input to stdin", async () => {
  assertEquals(
    await piped(echo("hello, world")),
    "hello, world",
  );
});

Deno.test("run throws error if process fails", async () => {
  await assertThrowsAsync(
    async () => await piped(fail("oh no!")),
    Error,
    "oh no!",
  );
});

Deno.test("run uses the specified CWD", async () => {
  // For testing in another CWD we copy the mockcli file to the temporary working dir.
  const cwd = await Deno.makeTempDir();
  const tmpMockcli = join(cwd, mockcliFile);
  const dst = await Deno.create(tmpMockcli);
  const src = await Deno.open(mockcliFile);
  try {
    await Deno.copy(src, dst);
    assertEquals(
      await piped(pipe(
        cmd(...denoRun, tmpMockcli, "cwd"),
        pipe(set({ cwd }), text),
      )),
      cwd + "\n",
    );
  } finally {
    dst.close();
    src.close();
    await Deno.remove(cwd, { recursive: true });
  }
});

Deno.test("success returns true if command succeeds", async () => {
  assertEquals(
    await piped(pipe(answer, success)),
    true,
  );
});

Deno.test("success returns false if command fails", async () => {
  assertEquals(
    await piped(pipe(fail("oh no!"), success)),
    false,
  );
});

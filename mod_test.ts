import {
  assert,
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@0.90.0/testing/asserts.ts";
import * as run from "./mod.ts";
import { join } from "https://deno.land/std@0.91.0/path/mod.ts";

const mockcli = "mockcli.ts";

function cmd(path: string, ...args: run.Cmd): run.Cmd {
  return ["deno", "run", "--allow-read", path, ...args];
}

Deno.test("runs a command and returns the output", async () => {
  assertEquals(
    await run.cmdText(...cmd(mockcli, "answer")),
    "42\n",
  );
});

Deno.test("run passes input to stdin", async () => {
  assertEquals(
    await run.text({
      cmd: cmd(mockcli, "echo"),
      input: "hello, world",
    }),
    "hello, world",
  );
});

Deno.test("run throws error if process fails", async () => {
  await assertThrowsAsync(
    async () => {
      await run.output({
        cmd: cmd(mockcli, "fail"),
        input: "oh no!",
      });
    },
    Error,
    "oh no!",
  );
});

Deno.test("run uses the specified CWD", async () => {
  // For testing in another CWD we copy the mockcli file to the temporary working dir.
  const cwd = await Deno.makeTempDir();
  const tmpMockcli = join(cwd, mockcli);
  const dst = await Deno.create(tmpMockcli);
  const src = await Deno.open(mockcli);
  try {
    await Deno.copy(src, dst);
    assertEquals(
      await run.text({
        cmd: cmd(tmpMockcli, "cwd"),
        cwd,
      }),
      cwd + "\n",
    );
  } finally {
    dst.close();
    src.close();
    await Deno.remove(cwd, { recursive: true });
  }
});

Deno.test("runSucceeds returns true if command succeeds", async () => {
  assert(
    await run.cmdSucceeds(...cmd(mockcli, "answer")),
  );
});

Deno.test("runSucceeds returns false if command fails", async () => {
  assertEquals(
    await run.succeeds({
      cmd: cmd(mockcli, "fail"),
      input: "lol",
    }),
    false,
  );
});

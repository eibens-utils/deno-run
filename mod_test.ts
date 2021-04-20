import {
  assertEquals,
  assertThrows,
  assertThrowsAsync,
} from "https://deno.land/std@0.90.0/testing/asserts.ts";
import { Cmd, run, toText, runCmdToText, runToText } from "./mod.ts";
import { join } from "https://deno.land/std@0.91.0/path/mod.ts";

const mockcli = "mockcli.ts";

function cmd(path: string, ...args: Cmd): Cmd {
  return ["deno", "run", "--allow-read", path, ...args];
}

Deno.test("toText converts buffer to text", async () => {
  const buffer = new TextEncoder().encode("42")
  assertEquals(
    await toText(Promise.resolve(buffer)),
    "42"
  )
})

Deno.test("runs a command and returns the output", async () => {
  assertEquals(
    await runCmdToText(...cmd(mockcli, "answer"),),
    "42\n",
  );
});

Deno.test("run passes input to stdin", async () => {
  assertEquals(
    await runToText({
      cmd: cmd(mockcli, "echo"),
      input: "hello, world",
    }),
    "hello, world",
  );
});

Deno.test("run throws error if process fails", async () => {
  await assertThrowsAsync(
    async () => {
      await run({
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
      await runToText({
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

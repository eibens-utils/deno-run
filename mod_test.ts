import {
  assert,
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@0.90.0/testing/asserts.ts";
import { output, succeeds, text } from "./mod.ts";
import { join } from "https://deno.land/std@0.91.0/path/mod.ts";

const mockcliFile = "mockcli.ts";

const denoRun = ["deno", "run", "--allow-read"];
const mockcli = [...denoRun, mockcliFile];

Deno.test("runs a command and returns the output", async () => {
  assertEquals(
    await text({
      cmd: [...mockcli, "answer"],
    }),
    "42\n",
  );
});

Deno.test("run passes input to stdin", async () => {
  assertEquals(
    await text({
      cmd: [...mockcli, "echo"],
      input: "hello, world",
    }),
    "hello, world",
  );
});

Deno.test("run throws error if process fails", async () => {
  await assertThrowsAsync(
    async () => {
      await output({
        cmd: [...mockcli, "fail"],
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
  const tmpMockcli = join(cwd, mockcliFile);
  const dst = await Deno.create(tmpMockcli);
  const src = await Deno.open(mockcliFile);
  try {
    await Deno.copy(src, dst);
    assertEquals(
      await text({
        cmd: [...denoRun, tmpMockcli, "cwd"],
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
    await succeeds({
      cmd: [...mockcli, "answer"],
    }),
  );
});

Deno.test("runSucceeds returns false if command fails", async () => {
  assertEquals(
    await succeeds({
      cmd: [...mockcli, "fail"],
      input: "lol",
    }),
    false,
  );
});

import {
  assertEquals,
  assertThrowsAsync,
} from "https://deno.land/std@0.90.0/testing/asserts.ts";
import { run } from "./mod.ts";
import { join } from "https://deno.land/std@0.91.0/path/mod.ts";

const mockcliFile = "mockcli.ts";
const denoRun = ["deno", "run", "--allow-read"];
const mockcli = [...denoRun, mockcliFile];

async function text(buffer: Promise<Uint8Array>) {
  return new TextDecoder().decode(await buffer);
}

async function success(result: Promise<any>) {
  try {
    await result;
    return true;
  } catch (error) {
    return false;
  }
}

async function answer() {
  return await text(run({
    cmd: [...mockcli, "answer"],
  }));
}

async function echo(data?: string) {
  return await text(run({
    cmd: [...mockcli, "echo"],
    input: data,
  }));
}

async function fail(data: string) {
  return await run({
    cmd: [...mockcli, "fail"],
    input: data,
  });
}

Deno.test("runs a command and returns the output", async () => {
  assertEquals(
    await answer(),
    "42\n",
  );
});

Deno.test("run passes input to stdin", async () => {
  assertEquals(
    await echo("hello, world"),
    "hello, world",
  );
});

Deno.test("run throws error if process fails", async () => {
  await assertThrowsAsync(
    async () => await fail("oh no!"),
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
      await text(run({
        cmd: [...denoRun, tmpMockcli, "cwd"],
        cwd,
      })),
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
    await success(answer()),
    true,
  );
});

Deno.test("success returns false if command fails", async () => {
  assertEquals(
    await success(fail("oh no!")),
    false,
  );
});

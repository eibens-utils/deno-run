/**
 * The `Cmd` args can be strings or numbers, which are stringified automatically. 
 * 
 * In the future we could accept objects and other types to simplify interaction with more complex CLI tools, for example for options `{ foo: "bar" }` we could generate `--foo=bar` (e.g. deno) or `--foo bar` (e.g. git).
 */
export type Cmd = (string | number)[];

export type RunOptions = {
  cmd: Cmd;
  cwd?: string;
  input?: string | Uint8Array;
};

/**
 * Convenience function for running a process and retrieving the output.
 * 
 * Access to the `stdin`, `stdout`, and `stderr` streams is abstracted away: 
 * 
 * - `stdin` can be fed data once through the `input` option.
 * - `stdout` is returned as a buffer if the sub-process terminates normally.
 * - `stderr` is converted into text and thrown as an `Error` if the sub-process terminates with an error.
 */
export async function output(opts: RunOptions) {
  const process = Deno.run({
    cwd: opts.cwd,
    cmd: opts.cmd.map(String),
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  try {
    // Write data to stdin.
    let input = opts.input || "";
    if (typeof input === "string") {
      input = new TextEncoder().encode(input);
    }
    process.stdin.write(input);

    // Read streams to close them.
    // For info see: https://github.com/denoland/deno/issues/4568#issuecomment-772463496
    const [stderr, stdout, status] = await Promise.all([
      process.stderrOutput(),
      process.output(),
      process.status(),
    ]);

    // Return stdout, or throw error.
    if (status.success) {
      return stdout;
    } else {
      const error = new TextDecoder().decode(stderr);
      throw new Error(error);
    }
  } finally {
    // Avoid leaking resources.
    process.stdin.close();
    process.close();
  }
}

/**
 * Convenience function for getting `true` when the process succeeds, or `false` when it returns an error.
 */
export async function succeeds(opts: RunOptions) {
  try {
    await output(opts);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Convenience function for converting process output to text.
 */
export async function text(opts: RunOptions) {
  const buffer = await output(opts);
  return new TextDecoder().decode(buffer);
}

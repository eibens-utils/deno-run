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
export async function run(opts: RunOptions): Promise<Uint8Array> {
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

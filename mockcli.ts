const help = `
usage: \tdeno run [--allow-read] mockcli.ts <command>

If the specified command is not available, this help message is printed. 
These are the available commands:

answer
\twrites the line "42" to stdout

echo
\twrites stdin to stdout

fail
\twrites stdin to stderr and returns an error code

cwd
\twrites the CWD as a line to stdout
\t--allow-read permission must be used
`.trim();

async function writeTextToStdout(text: string) {
  const answer = new TextEncoder().encode(text);
  await Deno.stdout.write(answer);
}

async function writeStdinTo(writer: Deno.Writer) {
  // For some reason using `await Deno.copy(Deno.stdin, Deno.stdout)`
  // makes the process hang forever. Should be investigated further.
  const buffer = new Uint8Array(1024);
  const n = <number> await Deno.stdin.read(buffer);
  await writer.write(buffer.subarray(0, n));
}

if (import.meta.main) {
  switch (Deno.args[0]) {
    case "answer": {
      await writeTextToStdout("42\n");
      Deno.exit();
    }
    case "echo": {
      await writeStdinTo(Deno.stdout);
      Deno.exit();
    }
    case "fail": {
      await writeStdinTo(Deno.stderr);
      Deno.exit(-1);
    }
    case "cwd": {
      await writeTextToStdout(Deno.cwd() + "\n");
      Deno.exit();
    }
    default: {
      await writeTextToStdout(help);
      Deno.exit();
    }
  }
}

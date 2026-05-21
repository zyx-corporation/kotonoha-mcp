/**
 * Spawn `kotonoha` CLI — shared by MCP tools (M5-P1a-1).
 * Issue: https://github.com/zyx-corporation/kotonoha-management/issues/129
 */

import { spawn } from "node:child_process";

export interface RunKotonohaOptions {
  /** CLI subcommand and flags, e.g. `["version"]` or `["context", "export", "note.md"]`. */
  args: string[];
  /** Working directory (Git repo root). Defaults to `KOTONOHA_WORKDIR` or process cwd. */
  cwd?: string;
  /** Extra env vars merged on top of process env (and `DATABASE_URL` when set). */
  env?: NodeJS.ProcessEnv;
}

export interface RunKotonohaResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Resolved path or name on PATH (`KOTONOHA_BIN`, default `kotonoha`). */
export function resolveKotonohaBin(): string {
  const bin = process.env.KOTONOHA_BIN?.trim();
  return bin && bin.length > 0 ? bin : "kotonoha";
}

export function resolveWorkdir(explicit?: string): string {
  if (explicit?.trim()) {
    return explicit.trim();
  }
  const fromEnv = process.env.KOTONOHA_WORKDIR?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : process.cwd();
}

/** Build child env: inherit process env; pass `DATABASE_URL` when present. */
export function buildChildEnv(extra?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra };
  if (process.env.DATABASE_URL) {
    env.DATABASE_URL = process.env.DATABASE_URL;
  }
  return env;
}

export function runKotonoha(options: RunKotonohaOptions): Promise<RunKotonohaResult> {
  const bin = resolveKotonohaBin();
  const cwd = resolveWorkdir(options.cwd);
  const env = buildChildEnv(options.env);

  return new Promise((resolve, reject) => {
    const child = spawn(bin, options.args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code, signal) => {
      if (signal) {
        reject(new Error(`kotonoha terminated by signal ${signal}`));
        return;
      }
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });
  });
}

/** Map CLI exit codes to MCP-facing summary (see management `04` §4.5). */
export function exitCodeLabel(code: number): string {
  switch (code) {
    case 0:
      return "success";
    case 1:
      return "usage_or_environment";
    case 2:
      return "validation_or_capability_deny";
    case 3:
      return "database_or_io";
    default:
      return `exit_${code}`;
  }
}

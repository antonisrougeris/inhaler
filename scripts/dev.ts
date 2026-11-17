import "dotenv/config";
import { spawn } from "node:child_process";
const args = process.argv
  .slice(2)
  .map((x) => (x === "--host" ? "--hostname" : x));
const command =
  process.env.USE_EMBEDDED_DB === "true"
    ? ["--import", "tsx", "scripts/with-db.ts", "dev:prepared", ...args]
    : [
        "node_modules/next/dist/bin/next",
        "dev",
        "--hostname",
        "0.0.0.0",
        ...args,
      ];
const child = spawn(process.execPath, command, {
  stdio: "inherit",
  env: process.env,
});
for (const sig of ["SIGTERM", "SIGINT"] as const)
  process.on(sig, () => child.kill(sig));
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

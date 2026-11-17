import "dotenv/config";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import EmbeddedPostgres from "embedded-postgres";
const directory = process.env.LOCAL_DB_DIR ?? ".preview-db";
const postgres = new EmbeddedPostgres({
  databaseDir: directory,
  user: "formair",
  password: "local-development-only",
  port: 5433,
  persistent: true,
  postgresFlags: ["-c", "unix_socket_directories="],
  onLog: () => {},
  onError: (message) => console.error(message),
});
if (!existsSync(`${directory}/PG_VERSION`)) await postgres.initialise();
await postgres.start();
try {
  await postgres.createDatabase("formair");
} catch {
  /* Already exists. */
}
process.env.DATABASE_URL =
  "postgresql://formair:local-development-only@localhost:5433/formair";
const command = process.argv[2] ?? "dev:next";
const child = spawn("npm", ["run", command, "--", ...process.argv.slice(3)], {
  stdio: "inherit",
  env: process.env,
});
for (const sig of ["SIGINT", "SIGTERM"] as const)
  process.on(sig, () => child.kill(sig));
child.on("exit", async (code) => {
  await postgres.stop();
  process.exitCode = code ?? 1;
});

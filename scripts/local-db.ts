import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";
const postgres = new EmbeddedPostgres({
  databaseDir: ".local-db",
  user: "formair",
  password: "local-development-only",
  port: 5433,
  persistent: true,
  postgresFlags: ["-c", "unix_socket_directories="],
});
if (!existsSync(".local-db/PG_VERSION")) await postgres.initialise();
await postgres.start();
try {
  await postgres.createDatabase("formair");
} catch {
  /* Database already exists on restart. */
}
console.log("Local PostgreSQL ready on port 5433. Keep this process running.");
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, async () => {
    await postgres.stop();
    process.exit(0);
  });
await new Promise(() => {});

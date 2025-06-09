import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";

let dbClient;
let defaultMigrationsOptions;

async function connectionDatabase(request, response, next) {
  dbClient = await database.getNewClient();
  defaultMigrationsOptions = {
    dbClient: dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    log: () => {},
    migrationsTable: "pgmigrations",
  };

  await next();
  await dbClient?.end();
}

async function listPendingMigrations() {
  const pendingMigrations = await migrationRunner(defaultMigrationsOptions);

  return pendingMigrations;
}

async function runPendingMigrations() {
  const migratedMigrations = await migrationRunner({
    ...defaultMigrationsOptions,
    dryRun: false,
  });

  return migratedMigrations;
}

const migrator = {
  connectionDatabase,
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;

import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import controller from "infra/controller.js";

const router = createRouter();

router.use(connectionDatabase);
router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

let dbClient;
let defaultMigrationsOptions;

async function connectionDatabase(request, response, next) {
  dbClient = await database.getNewClient();
  defaultMigrationsOptions = {
    dbClient: dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  await next();
  await dbClient?.end();
}

async function getHandler(request, response) {
  const pendingMigrations = await migrationRunner(defaultMigrationsOptions);

  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await migrationRunner({
    ...defaultMigrationsOptions,
    dryRun: false,
  });

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }
  return response.status(200).json(migratedMigrations);
}

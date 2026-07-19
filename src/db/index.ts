import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// postgres-js keeps a connection pool per process; the globalThis guard stops
// Next.js dev-mode HMR from exhausting local Postgres connections.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

const client =
  globalForDb.pgClient ?? postgres(process.env.DATABASE_URL as string, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export type Database = typeof db;

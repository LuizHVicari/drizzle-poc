import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

const connectionString = process.env.DATABASE_URL!;
export const db = drizzle(connectionString);

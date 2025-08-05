import { pgTable, uuid, varchar, primaryKey } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('user', {
  id: uuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const groupsTable = pgTable('group', {
  id: uuid().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
});

export const userGroupsTable = pgTable(
  'user_groups',
  {
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    groupId: uuid()
      .notNull()
      .references(() => groupsTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.groupId] }),
  }),
);

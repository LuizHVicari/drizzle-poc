import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  usersTable,
  userGroupsTable,
} from 'src/common/infrastructure/database/schema';
import { User } from 'src/users/domain/entities/user.entity';
import { UserRepository } from 'src/users/domain/repositories/user.repository';

@Injectable()
export class UserSqlRepository extends UserRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {
    super();
  }

  async createUser(user: User): Promise<void> {
    await this.db.insert(usersTable).values({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  async listUsers(): Promise<User[]> {
    const users = await this.db.select().from(usersTable);
    return users.map(
      (user) =>
        new User({
          id: user.id,
          name: user.name,
          email: user.email,
        }),
    );
  }

  async findUserById(id: string): Promise<User | null> {
    const users = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    return new User({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  async deleteUserById(id: string): Promise<void> {
    await this.db.delete(usersTable).where(eq(usersTable.id, id));
  }

  async updateUser(user: User): Promise<void> {
    await this.db
      .update(usersTable)
      .set({
        name: user.name,
        email: user.email,
      })
      .where(eq(usersTable.id, user.id));
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.db.insert(userGroupsTable).values({
      userId,
      groupId,
    });
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await this.db
      .delete(userGroupsTable)
      .where(
        and(
          eq(userGroupsTable.userId, userId),
          eq(userGroupsTable.groupId, groupId),
        ),
      );
  }

  async getUsersByGroupId(groupId: string): Promise<User[]> {
    const result = await this.db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(usersTable)
      .innerJoin(userGroupsTable, eq(usersTable.id, userGroupsTable.userId))
      .where(eq(userGroupsTable.groupId, groupId));

    return result.map(
      (user) =>
        new User({
          id: user.id,
          name: user.name,
          email: user.email,
        }),
    );
  }

  async getUserGroups(userId: string): Promise<string[]> {
    const result = await this.db
      .select({ groupId: userGroupsTable.groupId })
      .from(userGroupsTable)
      .where(eq(userGroupsTable.userId, userId));

    return result.map((row) => row.groupId);
  }
}

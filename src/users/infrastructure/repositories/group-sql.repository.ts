import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  groupsTable,
  userGroupsTable,
} from 'src/common/infrastructure/database/schema';
import { Group } from 'src/users/domain/entities/groups.entity';
import { GroupRepository } from 'src/users/domain/repositories/group.repository';

@Injectable()
export class GroupSqlRepository extends GroupRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {
    super();
  }

  async createGroup(group: Group): Promise<void> {
    await this.db.insert(groupsTable).values({
      id: group.id,
      name: group.name,
    });
  }

  async listGroups(): Promise<Group[]> {
    const groups = await this.db.select().from(groupsTable);
    return groups.map(
      (group) =>
        new Group({
          id: group.id,
          name: group.name,
        }),
    );
  }

  async findGroupById(id: string): Promise<Group | null> {
    const groups = await this.db
      .select()
      .from(groupsTable)
      .where(eq(groupsTable.id, id));

    if (groups.length === 0) {
      return null;
    }

    const group = groups[0];
    return new Group({
      id: group.id,
      name: group.name,
    });
  }

  async deleteGroupById(id: string): Promise<void> {
    await this.db.delete(groupsTable).where(eq(groupsTable.id, id));
  }

  async updateGroup(group: Group): Promise<void> {
    await this.db
      .update(groupsTable)
      .set({
        name: group.name,
      })
      .where(eq(groupsTable.id, group.id));
  }

  async getGroupsByUserId(userId: string): Promise<Group[]> {
    const result = await this.db
      .select({
        id: groupsTable.id,
        name: groupsTable.name,
      })
      .from(groupsTable)
      .innerJoin(userGroupsTable, eq(groupsTable.id, userGroupsTable.groupId))
      .where(eq(userGroupsTable.userId, userId));

    return result.map(
      (group) =>
        new Group({
          id: group.id,
          name: group.name,
        }),
    );
  }
}

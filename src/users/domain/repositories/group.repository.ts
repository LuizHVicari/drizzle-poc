import { Injectable } from '@nestjs/common';
import { Group } from '../entities/groups.entity';

@Injectable()
export abstract class GroupRepository {
  abstract createGroup(group: Group): Promise<void>;
  abstract listGroups(): Promise<Group[]>;
  abstract findGroupById(id: string): Promise<Group | null>;
  abstract deleteGroupById(id: string): Promise<void>;
  abstract updateGroup(group: Group): Promise<void>;
  abstract getGroupsByUserId(userId: string): Promise<Group[]>;
}

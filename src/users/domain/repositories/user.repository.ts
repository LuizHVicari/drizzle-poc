import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';

@Injectable()
export abstract class UserRepository {
  abstract createUser(user: User): Promise<void>;
  abstract listUsers(): Promise<User[]>;
  abstract findUserById(id: string): Promise<User | null>;
  abstract deleteUserById(id: string): Promise<void>;
  abstract updateUser(user: User): Promise<void>;
  abstract addUserToGroup(userId: string, groupId: string): Promise<void>;
  abstract removeUserFromGroup(userId: string, groupId: string): Promise<void>;
  abstract getUsersByGroupId(groupId: string): Promise<User[]>;
  abstract getUserGroups(userId: string): Promise<string[]>;
}

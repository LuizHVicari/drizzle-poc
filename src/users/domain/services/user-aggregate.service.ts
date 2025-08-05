import { Injectable } from '@nestjs/common';
import { UnitOfWorkService } from 'src/common/domain/services/unit-of-work.service';
import { Group } from '../entities/groups.entity';
import { User } from '../entities/user.entity';
import { v7 } from 'uuid';

export interface CreateUserWithGroupData {
  user: {
    name: string;
    email: string;
  };
  groupId: string;
}

export interface CreateGroupWithUsersData {
  group: {
    name: string;
  };
  users: Array<{
    name: string;
    email: string;
  }>;
}

export interface AddUsersToGroupData {
  groupId: string;
  users: Array<{
    name: string;
    email: string;
  }>;
}

@Injectable()
export class UserAggregateService {
  constructor(private readonly unitOfWork: UnitOfWorkService) {}

  async createUserWithGroup(data: CreateUserWithGroupData): Promise<User> {
    return this.unitOfWork.execute(async (ctx) => {
      const group = await ctx.groupRepository.findGroupById(data.groupId);
      if (!group) {
        throw new Error(`Group with id ${data.groupId} not found`);
      }

      const user = new User({
        id: v7(),
        name: data.user.name,
        email: data.user.email,
      });

      await ctx.userRepository.createUser(user);
      await ctx.userRepository.addUserToGroup(user.id, data.groupId);

      return user;
    });
  }

  async createGroupWithUsers(data: CreateGroupWithUsersData): Promise<{
    group: Group;
    users: User[];
  }> {
    return this.unitOfWork.execute(async (ctx) => {
      const group = new Group({
        name: data.group.name,
      });

      await ctx.groupRepository.createGroup(group);

      const users: User[] = [];
      for (const userData of data.users) {
        const user = new User({
          id: v7(),
          name: userData.name,
          email: userData.email,
        });

        await ctx.userRepository.createUser(user);
        await ctx.userRepository.addUserToGroup(user.id, group.id);
        users.push(user);
      }

      return { group, users };
    });
  }

  async addUsersToGroup(data: AddUsersToGroupData): Promise<User[]> {
    return this.unitOfWork.execute(async (ctx) => {
      const group = await ctx.groupRepository.findGroupById(data.groupId);
      if (!group) {
        throw new Error(`Group with id ${data.groupId} not found`);
      }

      const users: User[] = [];
      for (const userData of data.users) {
        const user = new User({
          id: v7(),
          name: userData.name,
          email: userData.email,
        });

        await ctx.userRepository.createUser(user);
        await ctx.userRepository.addUserToGroup(user.id, data.groupId);
        users.push(user);
      }

      return users;
    });
  }

  async deleteGroupWithUsers(groupId: string): Promise<void> {
    return this.unitOfWork.execute(async (ctx) => {
      const group = await ctx.groupRepository.findGroupById(groupId);
      if (!group) {
        throw new Error(`Group with id ${groupId} not found`);
      }

      const users = await ctx.userRepository.listUsers();

      for (const user of users) {
        await ctx.userRepository.deleteUserById(user.id);
      }

      await ctx.groupRepository.deleteGroupById(groupId);
    });
  }

  async getGroupWithUsers(groupId: string): Promise<{
    group: Group;
    users: User[];
  }> {
    return this.unitOfWork.execute(async (ctx) => {
      const group = await ctx.groupRepository.findGroupById(groupId);
      if (!group) {
        throw new Error(`Group with id ${groupId} not found`);
      }

      const users = await ctx.userRepository.getUsersByGroupId(groupId);

      return { group, users };
    });
  }

  async createUser(userData: { name: string; email: string }): Promise<User> {
    return this.unitOfWork.execute(async (ctx) => {
      const user = new User({
        id: v7(),
        name: userData.name,
        email: userData.email,
      });

      await ctx.userRepository.createUser(user);
      return user;
    });
  }

  async updateUser(
    id: string,
    userData: { name?: string; email?: string },
  ): Promise<User> {
    return this.unitOfWork.execute(async (ctx) => {
      const existingUser = await ctx.userRepository.findUserById(id);
      if (!existingUser) {
        throw new Error(`User with id ${id} not found`);
      }

      const updatedUser = new User({
        id: existingUser.id,
        name: userData.name ?? existingUser.name,
        email: userData.email ?? existingUser.email,
      });

      await ctx.userRepository.updateUser(updatedUser);
      return updatedUser;
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.unitOfWork.execute(async (ctx) => {
      const user = await ctx.userRepository.findUserById(id);
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }

      await ctx.userRepository.deleteUserById(id);
    });
  }

  async createGroup(groupData: { name: string }): Promise<Group> {
    return this.unitOfWork.execute(async (ctx) => {
      const group = new Group({
        name: groupData.name,
      });

      await ctx.groupRepository.createGroup(group);
      return group;
    });
  }

  async updateGroup(id: string, groupData: { name?: string }): Promise<Group> {
    return this.unitOfWork.execute(async (ctx) => {
      const existingGroup = await ctx.groupRepository.findGroupById(id);
      if (!existingGroup) {
        throw new Error(`Group with id ${id} not found`);
      }

      const updatedGroup = new Group({
        id: existingGroup.id,
        name: groupData.name ?? existingGroup.name,
      });

      await ctx.groupRepository.updateGroup(updatedGroup);
      return updatedGroup;
    });
  }

  async deleteGroup(id: string): Promise<void> {
    return this.unitOfWork.execute(async (ctx) => {
      const group = await ctx.groupRepository.findGroupById(id);
      if (!group) {
        throw new Error(`Group with id ${id} not found`);
      }

      await ctx.groupRepository.deleteGroupById(id);
    });
  }
}

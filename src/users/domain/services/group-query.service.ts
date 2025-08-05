import { Injectable } from '@nestjs/common';
import { Group } from '../entities/groups.entity';
import { GroupRepository } from '../repositories/group.repository';

@Injectable()
export class GroupQueryService {
  constructor(private readonly groupRepository: GroupRepository) {}

  async findGroupById(id: string): Promise<Group | null> {
    return this.groupRepository.findGroupById(id);
  }

  async listGroups(): Promise<Group[]> {
    return this.groupRepository.listGroups();
  }
}

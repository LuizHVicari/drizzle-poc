import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Group } from 'src/users/domain/entities/groups.entity';
import { UserAggregateService } from 'src/users/domain/services/user-aggregate.service';
import { GroupQueryService } from 'src/users/domain/services/group-query.service';

export class CreateGroupDto {
  name: string;
}

export class UpdateGroupDto {
  name?: string;
}

export class CreateGroupWithUsersDto {
  group: {
    name: string;
  };
  users: Array<{
    name: string;
    email: string;
  }>;
}

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly userAggregateService: UserAggregateService,
    private readonly groupQueryService: GroupQueryService,
  ) {}

  @Post()
  async createGroup(@Body() createGroupDto: CreateGroupDto): Promise<Group> {
    return this.userAggregateService.createGroup({
      name: createGroupDto.name,
    });
  }

  @Get()
  async listGroups(): Promise<Group[]> {
    return this.groupQueryService.listGroups();
  }

  @Get(':id')
  async findGroup(@Param('id') id: string): Promise<Group | null> {
    return this.groupQueryService.findGroupById(id);
  }

  @Put(':id')
  async updateGroup(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    return this.userAggregateService.updateGroup(id, {
      name: updateGroupDto.name,
    });
  }

  @Delete(':id')
  async deleteGroup(@Param('id') id: string): Promise<void> {
    await this.userAggregateService.deleteGroup(id);
  }

  @Post('with-users')
  async createGroupWithUsers(
    @Body() createGroupWithUsersDto: CreateGroupWithUsersDto,
  ): Promise<{ group: Group; users: any[] }> {
    return this.userAggregateService.createGroupWithUsers(
      createGroupWithUsersDto,
    );
  }

  @Get(':id/users')
  async getGroupWithUsers(@Param('id') groupId: string): Promise<{
    group: Group;
    users: any[];
  }> {
    return this.userAggregateService.getGroupWithUsers(groupId);
  }

  @Delete(':id/with-users')
  async deleteGroupWithUsers(@Param('id') groupId: string): Promise<void> {
    await this.userAggregateService.deleteGroupWithUsers(groupId);
  }
}

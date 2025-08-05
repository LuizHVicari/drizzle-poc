import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { User } from 'src/users/domain/entities/user.entity';
import { UserAggregateService } from 'src/users/domain/services/user-aggregate.service';
import { UserQueryService } from 'src/users/domain/services/user-query.service';

export class CreateUserDto {
  name: string;
  email: string;
}

export class UpdateUserDto {
  name?: string;
  email?: string;
}

export class CreateUserWithGroupDto {
  user: {
    name: string;
    email: string;
  };
  groupId: string;
}

export class AddUsersToGroupDto {
  groupId: string;
  users: Array<{
    name: string;
    email: string;
  }>;
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly userAggregateService: UserAggregateService,
    private readonly userQueryService: UserQueryService,
  ) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userAggregateService.createUser({
      name: createUserDto.name,
      email: createUserDto.email,
    });
  }

  @Get()
  async listUsers(): Promise<User[]> {
    return this.userQueryService.listUsers();
  }

  @Get(':id')
  async findUser(@Param('id') id: string): Promise<User | null> {
    return this.userQueryService.findUserById(id);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userAggregateService.updateUser(id, {
      name: updateUserDto.name,
      email: updateUserDto.email,
    });
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userAggregateService.deleteUser(id);
  }

  @Post('with-group')
  async createUserWithGroup(
    @Body() createUserWithGroupDto: CreateUserWithGroupDto,
  ): Promise<User> {
    return this.userAggregateService.createUserWithGroup(
      createUserWithGroupDto,
    );
  }

  @Post('add-to-group')
  async addUsersToGroup(
    @Body() addUsersToGroupDto: AddUsersToGroupDto,
  ): Promise<User[]> {
    return this.userAggregateService.addUsersToGroup(addUsersToGroupDto);
  }
}

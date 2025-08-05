import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { DrizzleUnitOfWorkService } from 'src/common/infrastructure/services/drizzle-unit-of-work.service';
import { UnitOfWorkService } from 'src/common/domain/services/unit-of-work.service';
import { UserAggregateService } from './domain/services/user-aggregate.service';
import { UserQueryService } from './domain/services/user-query.service';
import { GroupQueryService } from './domain/services/group-query.service';
import { UserRepository } from './domain/repositories/user.repository';
import { GroupRepository } from './domain/repositories/group.repository';
import { UserSqlRepository } from './infrastructure/repositories/user-sql.repository';
import { GroupSqlRepository } from './infrastructure/repositories/group-sql.repository';
import { DATABASE_CONNECTION } from 'src/common/infrastructure/database/url.entity';
import { UsersController } from './presentation/controllers/users.controller';
import { GroupsController } from './presentation/controllers/groups.controller';

@Module({
  imports: [CommonModule],
  controllers: [UsersController, GroupsController],
  providers: [
    {
      provide: UnitOfWorkService,
      useClass: DrizzleUnitOfWorkService,
    },
    {
      provide: UserRepository,
      useFactory: (db) => new UserSqlRepository(db),
      inject: [DATABASE_CONNECTION],
    },
    {
      provide: GroupRepository,
      useFactory: (db) => new GroupSqlRepository(db),
      inject: [DATABASE_CONNECTION],
    },
    UserAggregateService,
    UserQueryService,
    GroupQueryService,
  ],
  exports: [
    UserAggregateService,
    UserQueryService,
    GroupQueryService,
    UserRepository,
    GroupRepository,
  ],
})
export class UsersModule {}

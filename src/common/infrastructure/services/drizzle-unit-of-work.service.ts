import { Injectable } from '@nestjs/common';
import { RepositoryContext } from 'src/common/domain/services/repository-context.service';
import { UnitOfWorkService } from 'src/common/domain/services/unit-of-work.service';
import { db } from '../database/url.entity';
import { UserSqlRepository } from 'src/users/infrastructure/repositories/user-sql.repository';
import { GroupSqlRepository } from 'src/users/infrastructure/repositories/group-sql.repository';

@Injectable()
export class DrizzleUnitOfWorkService extends UnitOfWorkService {
  async execute<T>(work: (ctx: RepositoryContext) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      const ctx: RepositoryContext = {
        userRepository: new UserSqlRepository(tx),
        groupRepository: new GroupSqlRepository(tx),
      };

      return await work(ctx);
    });
  }
}

import { RepositoryContext } from './repository-context.service';

export abstract class UnitOfWorkService {
  abstract execute<T>(work: (ctx: RepositoryContext) => Promise<T>): Promise<T>;
}

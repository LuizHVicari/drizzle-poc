import { GroupRepository } from 'src/users/domain/repositories/group.repository';
import { UserRepository } from 'src/users/domain/repositories/user.repository';

export abstract class RepositoryContext {
  userRepository: UserRepository;
  groupRepository: GroupRepository;
}

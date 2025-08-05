import { Global, Module } from '@nestjs/common';
import { db, DATABASE_CONNECTION } from './infrastructure/database/url.entity';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useValue: db,
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class CommonModule {}

import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PointService } from './point.service';
import { UserRequestQueue } from 'src/utils/user-request-queue';

@Module({
  imports: [DatabaseModule],
  controllers: [PointController],
  providers: [PointService, UserRequestQueue],
})
export class PointModule {}

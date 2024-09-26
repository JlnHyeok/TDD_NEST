import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PointService } from './point.service';
import { UserRequestQueue } from 'src/utils/user-request-queue';
import {
  POINT_HISTORY_REPOSITORY,
  PointHistoryRepository,
} from './repositories/pointhistory.repository';
import {
  USER_POINT_REPOSITORY,
  UserPointRepository,
} from './repositories/userpoint.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [PointController],
  providers: [
    PointService,
    UserRequestQueue,
    { useClass: PointHistoryRepository, provide: POINT_HISTORY_REPOSITORY },
    { useClass: UserPointRepository, provide: USER_POINT_REPOSITORY },
  ],
})
export class PointModule {}

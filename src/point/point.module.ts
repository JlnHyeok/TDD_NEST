import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PointService } from './point.service';
import { RequestQueue } from 'src/utils/requestQueue';

@Module({
  imports: [DatabaseModule],
  controllers: [PointController],
  providers: [PointService, RequestQueue],
})
export class PointModule {}

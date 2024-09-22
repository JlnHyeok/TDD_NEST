import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PointModule } from './point/point.module';
import { BuyModule } from './buy/buy.module';

@Module({
  imports: [PointModule, BuyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

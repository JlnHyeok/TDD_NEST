import { Module } from "@nestjs/common";
import { PointController } from "./point.controller";
import { DatabaseModule } from "src/database/database.module";
import { PointService } from './point.service';
import { Service } from './.service';
import { PointService } from './point/point.service';

@Module({
    imports: [DatabaseModule],
    controllers: [PointController],
    providers: [PointService, Service],
})
export class PointModule {}
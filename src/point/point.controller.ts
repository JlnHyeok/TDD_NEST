import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import { PointHistory, UserPoint } from './point.model';
import { PointBody as PointDto } from './point.dto';
import { PointService } from './point.service';
import { HttpExceptionFilter } from 'src/http-exception.filter';

@Controller('/point')
@UseFilters(HttpExceptionFilter)
export class PointController {
  constructor(private readonly pointService: PointService) {}

  /**
   * 특정 유저의 포인트를 조회하는 기능 작성.
   */
  @Get(':id')
  async point(@Param('id') id): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    return this.pointService.getPoint(userId);
  }

  /**
   *특정 유저의 포인트 충전/이용 내역을 조회하는 기능 작성.
   */
  @Get(':id/histories')
  async history(@Param('id') id): Promise<PointHistory[]> {
    const userId = Number.parseInt(id);
    return this.pointService.getHistory(userId);
  }

  /**
   *특정 유저의 포인트를 충전하는 기능 작성.
   */
  @Patch(':id/charge')
  async charge(
    @Param('id') id,
    @Body(ValidationPipe) pointDto: PointDto,
  ): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;
    return this.pointService.chargePoint(userId, amount);
  }

  /**
   *특정 유저의 포인트를 사용하는 기능 작성.
   */
  @Patch(':id/use')
  async use(
    @Param('id') id,
    @Body(ValidationPipe) pointDto: PointDto,
  ): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;
    return this.pointService.usePoint(userId, amount);
  }
}

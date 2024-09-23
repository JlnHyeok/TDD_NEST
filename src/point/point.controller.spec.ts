import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { UserPoint } from './point.model';

describe('PointController', () => {
  let pointController: PointController;
  let pointService: PointService;
  let userDb: UserPointTable = new UserPointTable();
  let historyDb: PointHistoryTable = new PointHistoryTable();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [
        {
          provide: PointService,
          useValue: {
            getPoint: jest.fn(),
            getHistory: jest.fn(),
            chargePoint: jest.fn(),
            usePoint: jest.fn(),
          },
        },
      ],
    }).compile();

    pointController = module.get<PointController>(PointController);
    pointService = module.get<PointService>(PointService);
  });

  describe('GET point/:id', () => {
    it('should be defined', () => {
      expect(pointController).toBeDefined();

      pointController.point('1').then((result: UserPoint) => {
        expect(result).toEqual({
          id: 1,
          point: 0,
          updateMillis: expect.any(Number),
        });
      });
    });
  });

  // Add more test cases here
});

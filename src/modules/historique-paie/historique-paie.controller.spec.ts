import { Test, TestingModule } from '@nestjs/testing';
import { HistoriquePaieController } from './historique-paie.controller';

describe('HistoriquePaieController', () => {
  let controller: HistoriquePaieController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoriquePaieController],
    }).compile();

    controller = module.get<HistoriquePaieController>(HistoriquePaieController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PeriodeController } from './periode.controller';

describe('PeriodeController', () => {
  let controller: PeriodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PeriodeController],
    }).compile();

    controller = module.get<PeriodeController>(PeriodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RapportController } from './rapport.controller';

describe('RapportController', () => {
  let controller: RapportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RapportController],
    }).compile();

    controller = module.get<RapportController>(RapportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

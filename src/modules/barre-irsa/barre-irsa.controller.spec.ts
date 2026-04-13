import { Test, TestingModule } from '@nestjs/testing';
import { BarreIrsaController } from './barre-irsa.controller';

describe('BarreIrsaController', () => {
  let controller: BarreIrsaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BarreIrsaController],
    }).compile();

    controller = module.get<BarreIrsaController>(BarreIrsaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

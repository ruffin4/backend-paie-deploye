import { Test, TestingModule } from '@nestjs/testing';
import { CalculIrsaController } from './calcul-irsa.controller';

describe('CalculIrsaController', () => {
  let controller: CalculIrsaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculIrsaController],
    }).compile();

    controller = module.get<CalculIrsaController>(CalculIrsaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

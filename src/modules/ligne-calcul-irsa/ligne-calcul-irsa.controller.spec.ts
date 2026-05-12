import { Test, TestingModule } from '@nestjs/testing';
import { LigneCalculIrsaController } from './ligne-calcul-irsa.controller';

describe('LigneCalculIrsaController', () => {
  let controller: LigneCalculIrsaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LigneCalculIrsaController],
    }).compile();

    controller = module.get<LigneCalculIrsaController>(
      LigneCalculIrsaController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

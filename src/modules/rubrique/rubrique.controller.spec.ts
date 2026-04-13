import { Test, TestingModule } from '@nestjs/testing';
import { RubriqueController } from './rubrique.controller';

describe('RubriqueController', () => {
  let controller: RubriqueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RubriqueController],
    }).compile();

    controller = module.get<RubriqueController>(RubriqueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

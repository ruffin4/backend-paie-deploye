import { Test, TestingModule } from '@nestjs/testing';
import { VariableMensuelleController } from './variable-mensuelle.controller';

describe('VariableMensuelleController', () => {
  let controller: VariableMensuelleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariableMensuelleController],
    }).compile();

    controller = module.get<VariableMensuelleController>(
      VariableMensuelleController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

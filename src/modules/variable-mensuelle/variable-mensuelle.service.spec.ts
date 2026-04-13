import { Test, TestingModule } from '@nestjs/testing';
import { VariableMensuelleService } from './variable-mensuelle.service';

describe('VariableMensuelleService', () => {
  let service: VariableMensuelleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VariableMensuelleService],
    }).compile();

    service = module.get<VariableMensuelleService>(VariableMensuelleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CalculIrsaService } from './calcul-irsa.service';

describe('CalculIrsaService', () => {
  let service: CalculIrsaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculIrsaService],
    }).compile();

    service = module.get<CalculIrsaService>(CalculIrsaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BarreIrsaService } from './barre-irsa.service';

describe('BarreIrsaService', () => {
  let service: BarreIrsaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarreIrsaService],
    }).compile();

    service = module.get<BarreIrsaService>(BarreIrsaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

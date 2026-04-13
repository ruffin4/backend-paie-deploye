import { Test, TestingModule } from '@nestjs/testing';
import { LigneCalculIrsaService } from './ligne-calcul-irsa.service';

describe('LigneCalculIrsaService', () => {
  let service: LigneCalculIrsaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LigneCalculIrsaService],
    }).compile();

    service = module.get<LigneCalculIrsaService>(LigneCalculIrsaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

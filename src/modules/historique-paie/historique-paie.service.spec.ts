import { Test, TestingModule } from '@nestjs/testing';
import { HistoriquePaieService } from './historique-paie.service';

describe('HistoriquePaieService', () => {
  let service: HistoriquePaieService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoriquePaieService],
    }).compile();

    service = module.get<HistoriquePaieService>(HistoriquePaieService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

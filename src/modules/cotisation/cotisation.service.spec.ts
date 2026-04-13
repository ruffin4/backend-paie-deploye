import { Test, TestingModule } from '@nestjs/testing';
import { CotisationService } from './cotisation.service';

describe('CotisationService', () => {
  let service: CotisationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CotisationService],
    }).compile();

    service = module.get<CotisationService>(CotisationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RapportService } from './rapport.service';

describe('RapportService', () => {
  let service: RapportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RapportService],
    }).compile();

    service = module.get<RapportService>(RapportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { LigneBulletinService } from './ligne-bulletin.service';

describe('LigneBulletinService', () => {
  let service: LigneBulletinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LigneBulletinService],
    }).compile();

    service = module.get<LigneBulletinService>(LigneBulletinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

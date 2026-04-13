import { Test, TestingModule } from '@nestjs/testing';
import { LigneBulletinController } from './ligne-bulletin.controller';

describe('LigneBulletinController', () => {
  let controller: LigneBulletinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LigneBulletinController],
    }).compile();

    controller = module.get<LigneBulletinController>(LigneBulletinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Module } from '@nestjs/common';
import { EmployeService } from './employe.service';
import { EmployeController } from './employe.controller';

@Module({
  providers: [EmployeService],
  controllers: [EmployeController]
})
export class EmployeModule {}

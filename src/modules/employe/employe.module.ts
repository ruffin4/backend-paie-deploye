import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeService } from './employe.service';
import { EmployeController } from './employe.controller';
import { EmployeEntity } from './entities/employe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeEntity])],
  controllers: [EmployeController],
  providers: [EmployeService],
  exports: [EmployeService], // ← Important !
})
export class EmployeModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeService } from './employe.service';
import { EmployeController } from './employe.controller';
import { EmployeEntity } from './entities/employe.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeEntity])],
  providers: [EmployeService],
  controllers: [EmployeController],
  exports: [TypeOrmModule],
})
export class EmployeModule {}

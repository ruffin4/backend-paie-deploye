import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { RapportService } from './rapport.service';
import * as express from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Rapports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rapports')
export class RapportController {
  constructor(private readonly service: RapportService) {}

  @Get('export/excel')
  @ApiOperation({ summary: 'Exporter la masse salariale en Excel' })
  async exportExcel(
    @Res() res: express.Response,
    @Query('periodeUuid') periodeUuid?: string,
  ) {
    return await this.service.exportMasseSalariale(res, periodeUuid);
  }
}

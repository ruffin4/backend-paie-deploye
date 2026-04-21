import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { BulletinService } from './bulletin.service';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { UpdateBulletinDto } from './dto/update-bulletin.dto';
import { CalculBulletinDto } from './dto/calcul-bulletin.dto';
import { CalculMasseBulletinDto } from './dto/calcul-masse-bulletin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Bulletins de paie')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('bulletins')
export class BulletinController {
  constructor(private readonly bulletinService: BulletinService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Créer un bulletin' })
  @ApiCreatedResponse({ description: 'Bulletin créé' })
  async create(@Body() createDto: CreateBulletinDto) {
    const bulletin = await this.bulletinService.create(createDto);
    return {
      message: 'Bulletin créé avec succès',
      data: bulletin,
    };
  }

  @Post('calculer')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Calculer automatiquement un bulletin' })
  @ApiCreatedResponse({ description: 'Bulletin calculé' })
  @ApiBadRequestResponse({ description: 'Période clôturée' })
  async calculerBulletin(@Body() calculDto: CalculBulletinDto) {
    const bulletin = await this.bulletinService.calculerBulletin(
      calculDto.employeUuid,
      calculDto.periodeUuid,
      calculDto.date ? new Date(calculDto.date) : undefined,
    );
    return {
      message: 'Bulletin calculé avec succès',
      data: bulletin,
    };
  }

  @Post('calculer-masse')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({
    summary:
      'Calculer automatiquement les bulletins pour tous les employés sur une période',
  })
  @ApiCreatedResponse({ description: 'Bulletins calculés' })
  @ApiBadRequestResponse({
    description: 'Période clôturée ou aucun employé actif',
  })
  async calculerEnMasse(@Body() calculDto: CalculMasseBulletinDto) {
    const bulletins = await this.bulletinService.calculerEnMasse(
      calculDto.periodeUuid,
      calculDto.date ? new Date(calculDto.date) : undefined,
      calculDto.employeUuids,
    );
    return {
      message: 'Bulletins calculés avec succès',
      data: bulletins,
      count: bulletins.length,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les bulletins' })
  @ApiOkResponse({ description: 'Liste des bulletins' })
  async findAll() {
    const bulletins = await this.bulletinService.findAll();
    return {
      message: 'Liste des bulletins',
      data: bulletins,
      count: bulletins.length,
    };
  }

  @Get('employe/:employeUuid')
  @ApiOperation({ summary: "Lister les bulletins d'un employé" })
  @ApiOkResponse({ description: 'Liste des bulletins' })
  async findByEmploye(@Param('employeUuid') employeUuid: string) {
    const bulletins = await this.bulletinService.findByEmploye(employeUuid);
    return {
      message: "Bulletins de l'employé",
      data: bulletins,
      count: bulletins.length,
    };
  }

  @Get('periode/:periodeUuid')
  @ApiOperation({ summary: "Lister les bulletins d'une période" })
  @ApiOkResponse({ description: 'Liste des bulletins' })
  async findByPeriode(@Param('periodeUuid') periodeUuid: string) {
    const bulletins = await this.bulletinService.findByPeriode(periodeUuid);
    return {
      message: 'Bulletins de la période',
      data: bulletins,
      count: bulletins.length,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer un bulletin par UUID' })
  @ApiOkResponse({ description: 'Bulletin trouvé' })
  @ApiNotFoundResponse({ description: 'Bulletin non trouvé' })
  async findOne(@Param('uuid') uuid: string) {
    const bulletin = await this.bulletinService.findOne(uuid);
    return {
      message: 'Bulletin trouvé',
      data: bulletin,
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Mettre à jour un bulletin' })
  @ApiOkResponse({ description: 'Bulletin mis à jour' })
  @ApiBadRequestResponse({ description: 'Bulletin déjà validé' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateBulletinDto,
  ) {
    const bulletin = await this.bulletinService.update(uuid, updateDto);
    return {
      message: 'Bulletin mis à jour avec succès',
      data: bulletin,
    };
  }

  @Patch(':uuid/valider')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Valider un bulletin' })
  @ApiOkResponse({ description: 'Bulletin validé' })
  async valider(@Param('uuid') uuid: string) {
    const bulletin = await this.bulletinService.valider(uuid);
    return {
      message: 'Bulletin validé avec succès',
      data: bulletin,
    };
  }

  @Patch(':uuid/annuler')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Annuler un bulletin' })
  @ApiOkResponse({ description: 'Bulletin annulé' })
  async annuler(@Param('uuid') uuid: string) {
    const bulletin = await this.bulletinService.annuler(uuid);
    return {
      message: 'Bulletin annulé avec succès',
      data: bulletin,
    };
  }

  @Patch(':uuid/payer')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Marquer un bulletin comme payé' })
  @ApiOkResponse({ description: 'Bulletin payé' })
  async payer(@Param('uuid') uuid: string) {
    const bulletin = await this.bulletinService.payer(uuid);
    return {
      message: 'Bulletin marqué comme payé avec succès',
      data: bulletin,
    };
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un bulletin' })
  @ApiNoContentResponse({ description: 'Bulletin supprimé' })
  @ApiBadRequestResponse({
    description: 'Impossible de supprimer un bulletin validé',
  })
  async remove(@Param('uuid') uuid: string) {
    await this.bulletinService.remove(uuid);
  }
}

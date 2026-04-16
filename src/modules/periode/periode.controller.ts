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
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PeriodeService } from './periode.service';
import { CreatePeriodeDto } from './dto/create-periode.dto';
import { UpdatePeriodeDto } from './dto/update-periode.dto';
import { CloturerPeriodeDto } from './dto/cloturer-periode.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Périodes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('periodes')
export class PeriodeController {
  constructor(private readonly periodeService: PeriodeService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer une nouvelle période' })
  @ApiCreatedResponse({ description: 'Période créée avec succès' })
  @ApiConflictResponse({ description: 'La période existe déjà' })
  @ApiBadRequestResponse({ description: 'Dates invalides' })
  async create(@Body() createDto: CreatePeriodeDto) {
    const periode = await this.periodeService.create(createDto);
    return {
      message: 'Période créée avec succès',
      data: periode,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les périodes' })
  @ApiOkResponse({ description: 'Liste des périodes' })
  async findAll() {
    const periodes = await this.periodeService.findAll();
    return {
      message: 'Liste des périodes',
      data: periodes,
      count: periodes.length,
    };
  }

  @Get('current')
  @ApiOperation({ summary: 'Récupérer la période en cours' })
  @ApiOkResponse({ description: 'Période en cours' })
  async findCurrent() {
    const periode = await this.periodeService.findCurrent();
    return {
      message: periode ? 'Période en cours' : 'Aucune période en cours',
      data: periode,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer une période par son UUID' })
  @ApiOkResponse({ description: 'Période trouvée' })
  @ApiNotFoundResponse({ description: 'Période non trouvée' })
  async findOne(@Param('uuid') uuid: string) {
    const periode = await this.periodeService.findOne(uuid);
    return {
      message: 'Période trouvée',
      data: periode,
    };
  }

  @Get('mois/:mois/annee/:annee')
  @ApiOperation({ summary: 'Récupérer une période par mois et année' })
  @ApiOkResponse({ description: 'Période trouvée' })
  async findByMoisAnnee(
    @Param('mois') mois: string,
    @Param('annee') annee: string,
  ) {
    const periode = await this.periodeService.findByMoisAnnee(
      parseInt(mois),
      parseInt(annee),
    );
    return {
      message: periode ? 'Période trouvée' : 'Période non trouvée',
      data: periode,
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mettre à jour une période' })
  @ApiOkResponse({ description: 'Période mise à jour' })
  @ApiNotFoundResponse({ description: 'Période non trouvée' })
  @ApiConflictResponse({ description: 'Conflit de période' })
  @ApiBadRequestResponse({ description: 'Période clôturée ou dates invalides' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdatePeriodeDto,
  ) {
    const periode = await this.periodeService.update(uuid, updateDto);
    return {
      message: 'Période mise à jour avec succès',
      data: periode,
    };
  }

  @Patch(':uuid/cloturer')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Clôturer une période' })
  @ApiOkResponse({ description: 'Période clôturée' })
  @ApiNotFoundResponse({ description: 'Période non trouvée' })
  @ApiBadRequestResponse({ description: 'Période déjà clôturée' })
  async cloturer(@Param('uuid') uuid: string, @Body() dto: CloturerPeriodeDto) {
    const periode = await this.periodeService.cloturer(uuid, dto);
    return {
      message: 'Période clôturée avec succès',
      data: periode,
    };
  }

  @Patch(':uuid/rouvrir')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rouvrir une période clôturée' })
  @ApiOkResponse({ description: 'Période rouverte' })
  @ApiNotFoundResponse({ description: 'Période non trouvée' })
  @ApiBadRequestResponse({ description: 'Période non clôturée' })
  async rouvrir(@Param('uuid') uuid: string) {
    const periode = await this.periodeService.rouvrir(uuid);
    return {
      message: 'Période rouverte avec succès',
      data: periode,
    };
  }

  @Get(':uuid/precedente')
  @ApiOperation({ summary: 'Récupérer la période précédente' })
  @ApiOkResponse({ description: 'Période précédente' })
  async getPeriodePrecedente(@Param('uuid') uuid: string) {
    const periode = await this.periodeService.getPeriodePrecedente(uuid);
    return {
      message: periode
        ? 'Période précédente trouvée'
        : 'Aucune période précédente',
      data: periode,
    };
  }

  @Get(':uuid/suivante')
  @ApiOperation({ summary: 'Récupérer la période suivante' })
  @ApiOkResponse({ description: 'Période suivante' })
  async getPeriodeSuivante(@Param('uuid') uuid: string) {
    const periode = await this.periodeService.getPeriodeSuivante(uuid);
    return {
      message: periode ? 'Période suivante trouvée' : 'Aucune période suivante',
      data: periode,
    };
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une période' })
  @ApiNoContentResponse({ description: 'Période supprimée' })
  @ApiNotFoundResponse({ description: 'Période non trouvée' })
  @ApiBadRequestResponse({
    description: 'Impossible de supprimer une période clôturée',
  })
  async remove(@Param('uuid') uuid: string) {
    await this.periodeService.remove(uuid);
  }
}

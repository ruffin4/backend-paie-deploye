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
  Query,
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
  ApiQuery,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CotisationService } from './cotisation.service';
import { CreateCotisationDto } from './dto/create-cotisation.dto';
import { UpdateCotisationDto } from './dto/update-cotisation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Cotisations légales')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cotisations')
export class CotisationController {
  constructor(private readonly cotisationService: CotisationService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer une cotisation' })
  @ApiCreatedResponse({ description: 'Cotisation créée' })
  @ApiConflictResponse({ description: 'Code déjà existant' })
  async create(@Body() createDto: CreateCotisationDto) {
    const cotisation = await this.cotisationService.create(createDto);
    return {
      message: 'Cotisation créée avec succès',
      data: cotisation,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les cotisations' })
  @ApiOkResponse({ description: 'Liste des cotisations' })
  async findAll() {
    const cotisations = await this.cotisationService.findAll();
    return {
      message: 'Liste des cotisations',
      data: cotisations,
      count: cotisations.length,
    };
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Lister les cotisations actives' })
  @ApiOkResponse({ description: 'Cotisations actives' })
  async findActive() {
    const cotisations = await this.cotisationService.findActive();
    return {
      message: 'Cotisations actives',
      data: cotisations,
    };
  }

  @Get('taux')
  @Public()
  @ApiOperation({ summary: 'Obtenir les taux actuels des cotisations' })
  @ApiOkResponse({ description: 'Taux des cotisations' })
  async getTauxActuels() {
    const result = await this.cotisationService.getTauxActuels();
    return {
      message: 'Taux actuels des cotisations',
      data: result,
    };
  }

  @Get('calcul')
  @Public()
  @ApiOperation({
    summary: 'Calculer les cotisations CNaPS, OSTIE, FMFPR à partir du brut',
  })
  @ApiQuery({ name: 'brut', type: Number, description: 'Salaire brut total' })
  @ApiQuery({
    name: 'brutImposable',
    required: false,
    type: Number,
    description: 'Salaire brut imposable (optionnel)',
  })
  @ApiOkResponse({ description: 'Calcul effectué avec succès' })
  @ApiBadRequestResponse({ description: 'Paramètres invalides' })
  async calculerCotisations(
    @Query('brut') brut: string,
    @Query('brutImposable') brutImposable?: string,
  ) {
    const brutTotal = parseFloat(brut);
    if (isNaN(brutTotal)) {
      return {
        message: 'Erreur: le paramètre "brut" doit être un nombre valide',
        error: true,
      };
    }

    const result = await this.cotisationService.calculerCotisationsSociales(
      brutTotal,
      brutImposable ? parseFloat(brutImposable) : undefined,
    );

    return {
      message: 'Calcul des cotisations effectué avec succès',
      data: result,
    };
  }

  @Get('calcul/detail')
  @Public()
  @ApiOperation({ summary: 'Calcul détaillé des cotisations étape par étape' })
  @ApiQuery({ name: 'brut', type: Number, description: 'Salaire brut total' })
  @ApiOkResponse({ description: 'Calcul détaillé effectué' })
  @ApiBadRequestResponse({ description: 'Paramètre invalide' })
  async calculerCotisationsAvecDetail(@Query('brut') brut: string) {
    const brutTotal = parseFloat(brut);
    if (isNaN(brutTotal)) {
      return {
        message: 'Erreur: le paramètre "brut" doit être un nombre valide',
        error: true,
      };
    }

    const result =
      await this.cotisationService.calculerCotisationsAvecDetail(brutTotal);
    return {
      message: 'Calcul détaillé des cotisations effectué',
      data: result,
    };
  }

  @Get('calcul/cotisation/:code')
  @Public()
  @ApiOperation({ summary: 'Calculer une cotisation spécifique' })
  @ApiQuery({ name: 'brut', type: Number, description: 'Salaire brut total' })
  @ApiQuery({
    name: 'brutImposable',
    required: false,
    type: Number,
    description: 'Salaire brut imposable (optionnel)',
  })
  @ApiOkResponse({ description: 'Calcul effectué' })
  @ApiBadRequestResponse({ description: 'Cotisation non trouvée' })
  async calculerCotisationSpecifique(
    @Param('code') code: string,
    @Query('brut') brut: string,
    @Query('brutImposable') brutImposable?: string,
  ) {
    const brutTotal = parseFloat(brut);
    if (isNaN(brutTotal)) {
      return {
        message: 'Erreur: le paramètre "brut" doit être un nombre valide',
        error: true,
      };
    }

    const result = await this.cotisationService.calculerCotisation(
      code.toUpperCase(),
      brutTotal,
      brutImposable ? parseFloat(brutImposable) : undefined,
    );

    return {
      message: `Calcul de la cotisation ${code} effectué avec succès`,
      data: {
        code: code.toUpperCase(),
        ...result,
      },
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer une cotisation par UUID' })
  @ApiOkResponse({ description: 'Cotisation trouvée' })
  @ApiNotFoundResponse({ description: 'Cotisation non trouvée' })
  async findOne(@Param('uuid') uuid: string) {
    const cotisation = await this.cotisationService.findOne(uuid);
    return {
      message: 'Cotisation trouvée',
      data: cotisation,
    };
  }

  @Get('code/:code')
  @Public()
  @ApiOperation({ summary: 'Récupérer une cotisation par code' })
  @ApiOkResponse({ description: 'Cotisation trouvée' })
  async findByCode(@Param('code') code: string) {
    const cotisation = await this.cotisationService.findByCode(code);
    return {
      message: cotisation ? 'Cotisation trouvée' : 'Cotisation non trouvée',
      data: cotisation,
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mettre à jour une cotisation' })
  @ApiOkResponse({ description: 'Cotisation mise à jour' })
  @ApiNotFoundResponse({ description: 'Cotisation non trouvée' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateCotisationDto,
  ) {
    const cotisation = await this.cotisationService.update(uuid, updateDto);
    return {
      message: 'Cotisation mise à jour avec succès',
      data: cotisation,
    };
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une cotisation' })
  @ApiNoContentResponse({ description: 'Cotisation supprimée' })
  @ApiNotFoundResponse({ description: 'Cotisation non trouvée' })
  async remove(@Param('uuid') uuid: string) {
    await this.cotisationService.remove(uuid);
  }
}

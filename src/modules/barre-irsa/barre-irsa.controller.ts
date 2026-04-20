import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { BarreIrsaService, ResultatCalculImpot } from './barre-irsa.service';
import { CreateBarreIrsaDto } from './dto/create-barre-irsa.dto';
import { UpdateBarreIrsaDto } from './dto/update-barre-irsa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Barème IRSA')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('barre-irsa')
export class BarreIrsaController {
  constructor(private readonly barreIrsaService: BarreIrsaService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ajouter une tranche au barème IRSA' })
  @ApiCreatedResponse({ description: 'Tranche créée avec succès' })
  @ApiConflictResponse({ description: 'Conflit avec une tranche existante' })
  async create(@Body() createDto: CreateBarreIrsaDto) {
    const barre = await this.barreIrsaService.create(createDto);
    return {
      message: 'Tranche ajoutée avec succès',
      data: barre,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les tranches du barème IRSA' })
  @ApiOkResponse({ description: 'Liste des tranches' })
  async findAll() {
    const barre = await this.barreIrsaService.findAll();
    return {
      message: 'Liste des tranches du barème IRSA',
      data: barre,
      count: barre.length,
    };
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Récupérer le barème IRSA actif' })
  @ApiOkResponse({ description: 'Barème IRSA actif' })
  async findActive() {
    const barre = await this.barreIrsaService.findActive();
    return {
      message: 'Barème IRSA actif',
      data: barre,
    };
  }

  @Get('calcul')
  @Public()
  @ApiOperation({ summary: "Calculer l'impôt sur une base imposable" })
  @ApiQuery({
    name: 'baseImposable',
    type: Number,
    description: 'Base imposable en Ariary',
  })
  @ApiQuery({
    name: 'enfants',
    required: false,
    type: Number,
    description: "Nombre d'enfants à charge (défaut: 0)",
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: "Date du calcul (par défaut: aujourd'hui)",
  })
  @ApiOkResponse({ description: 'Calcul effectué avec succès' })
  @ApiBadRequestResponse({ description: 'Aucun barème actif trouvé' })
  async calculerImpot(
    @Query('baseImposable') baseImposable: string,
    @Query('enfants') enfants?: string,
    @Query('date') date?: string,
  ): Promise<ResultatCalculImpot> {
    const result = await this.barreIrsaService.calculerImpot(
      parseFloat(baseImposable),
      enfants ? parseInt(enfants) : 0,
      date ? new Date(date) : new Date(),
    );
    return result;
  }
  @Get('calcul/depuis-brut')
  @Public()
  @ApiOperation({
    summary:
      "Calculer l'impôt à partir du salaire brut (automatique avec abattement 2%)",
  })
  @ApiQuery({ name: 'brut', type: Number, description: 'Salaire brut total' })
  @ApiQuery({
    name: 'enfants',
    required: false,
    type: Number,
    description: "Nombre d'enfants à charge (défaut: 0)",
  })
  @ApiOkResponse({ description: 'Calcul effectué avec succès' })
  @ApiBadRequestResponse({ description: 'Paramètre invalide' })
  async calculerImpotDepuisBrut(
    @Query('brut') brut: string,
    @Query('enfants') enfants?: string,
  ) {
    const brutTotal = parseFloat(brut);
    if (isNaN(brutTotal)) {
      return {
        message: 'Erreur: le paramètre "brut" doit être un nombre valide',
        error: true,
      };
    }

    const nbEnfants = enfants ? parseInt(enfants) : 0;
    // Correction: passer nbEnfants comme deuxième paramètre, pas comme troisième
    const result = await this.barreIrsaService.calculerImpotDepuisBrut(
      brutTotal,
      nbEnfants, // ← deuxième paramètre
    );

    return {
      message: "Calcul de l'impôt effectué avec succès",
      data: result,
    };
  }

  @Get('calcul/depuis-brut/dynamique')
  @Public()
  @ApiOperation({
    summary:
      "Calculer l'impôt à partir du salaire brut avec abattement dynamique (basé sur les cotisations CNaPS+OSTIE) et décote pour enfants",
  })
  @ApiQuery({ name: 'brut', type: Number, description: 'Salaire brut total' })
  @ApiQuery({
    name: 'employeUuid',
    type: String,
    description: "UUID de l'employé (pour récupérer le nombre d'enfants)",
  })
  @ApiQuery({
    name: 'plafond',
    required: false,
    type: Number,
    description: "Plafond SME pour l'abattement (défaut: 2 400 000 Ar)",
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: "Date du calcul (défaut: aujourd'hui)",
  })
  @ApiOkResponse({ description: 'Calcul effectué avec succès' })
  @ApiBadRequestResponse({ description: 'Paramètre invalide' })
  async calculerImpotDepuisBrutDynamique(
    @Query('brut') brut: string,
    @Query('employeUuid') employeUuid: string,
    @Query('plafond') plafond?: string,
    @Query('date') date?: string,
  ) {
    const brutTotal = parseFloat(brut);
    if (isNaN(brutTotal)) {
      return {
        message: 'Erreur: le paramètre "brut" doit être un nombre valide',
        error: true,
      };
    }

    if (!employeUuid) {
      return {
        message: 'Erreur: le paramètre "employeUuid" est requis',
        error: true,
      };
    }

    const plafondSME = plafond ? parseFloat(plafond) : 2_400_000;
    const dateCalcul = date ? new Date(date) : new Date();

    const result = await this.barreIrsaService.calculerImpotDepuisBrutDynamique(
      brutTotal,
      employeUuid,
      plafondSME,
      dateCalcul,
    );

    return {
      message: "Calcul de l'impôt effectué avec succès",
      data: result,
    };
  }

  @Get('calcul/depuis-brut/dynamique-simple')
  @Public()
  @ApiOperation({
    summary:
      "Calculer l'impôt à partir du salaire brut (version simple avec nombre d'enfants manuel)",
  })
  @ApiQuery({ name: 'brut', type: Number, description: 'Salaire brut total' })
  @ApiQuery({
    name: 'enfants',
    required: false,
    type: Number,
    description: "Nombre d'enfants à charge (défaut: 0)",
  })
  @ApiQuery({
    name: 'plafond',
    required: false,
    type: Number,
    description: "Plafond SME pour l'abattement (défaut: 2 400 000 Ar)",
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: "Date du calcul (défaut: aujourd'hui)",
  })
  @ApiOkResponse({ description: 'Calcul effectué avec succès' })
  @ApiBadRequestResponse({ description: 'Paramètre invalide' })
  async calculerImpotDepuisBrutDynamiqueSimple(
    @Query('brut') brut: string,
    @Query('enfants') enfants?: string,
    @Query('plafond') plafond?: string,
    @Query('date') date?: string,
  ) {
    const brutTotal = parseFloat(brut);
    if (isNaN(brutTotal)) {
      return {
        message: 'Erreur: le paramètre "brut" doit être un nombre valide',
        error: true,
      };
    }

    const nbEnfants = enfants ? parseInt(enfants) : 0;
    const plafondSME = plafond ? parseFloat(plafond) : 2_400_000;
    const dateCalcul = date ? new Date(date) : new Date();

    const result =
      await this.barreIrsaService.calculerImpotDepuisBrutDynamiqueSimple(
        brutTotal,
        nbEnfants,
        plafondSME,
        dateCalcul,
      );

    return {
      message: "Calcul de l'impôt effectué avec succès",
      data: result,
    };
  }

  @Get('abattement/dynamique')
  @Public()
  @ApiOperation({
    summary:
      "Calculer l'abattement dynamique basé sur les cotisations sociales",
  })
  @ApiQuery({ name: 'brut', type: Number, description: 'Salaire brut total' })
  @ApiQuery({
    name: 'plafond',
    required: false,
    type: Number,
    description: "Plafond SME pour l'abattement (défaut: 2 400 000 Ar)",
  })
  @ApiOkResponse({ description: 'Calcul effectué avec succès' })
  @ApiBadRequestResponse({ description: 'Paramètre invalide' })
  async calculerAbattementDynamique(
    @Query('brut') brut: string,
    @Query('plafond') plafond?: string,
  ) {
    const brutTotal = parseFloat(brut);
    if (isNaN(brutTotal)) {
      return {
        message: 'Erreur: le paramètre "brut" doit être un nombre valide',
        error: true,
      };
    }

    const plafondSME = plafond ? parseFloat(plafond) : 2_400_000;

    const result = await this.barreIrsaService.calculerAbattementDynamique(
      brutTotal,
      plafondSME,
    );

    return {
      message: "Calcul de l'abattement dynamique effectué avec succès",
      data: result,
    };
  }

  @Get('cotisations-actives')
  @Public()
  @ApiOperation({
    summary: 'Récupérer la liste des cotisations actives',
  })
  @ApiOkResponse({ description: 'Liste des cotisations actives' })
  async getCotisationsActives() {
    const result = await this.barreIrsaService.getCotisationsActives();
    return {
      message: 'Liste des cotisations actives',
      data: result,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer une tranche par son UUID' })
  @ApiOkResponse({ description: 'Tranche trouvée' })
  @ApiNotFoundResponse({ description: 'Tranche non trouvée' })
  async findOne(@Param('uuid') uuid: string) {
    const barre = await this.barreIrsaService.findOne(uuid);
    return {
      message: 'Tranche trouvée',
      data: barre,
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mettre à jour une tranche' })
  @ApiOkResponse({ description: 'Tranche mise à jour' })
  @ApiNotFoundResponse({ description: 'Tranche non trouvée' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateBarreIrsaDto,
  ) {
    const barre = await this.barreIrsaService.update(uuid, updateDto);
    return {
      message: 'Tranche mise à jour avec succès',
      data: barre,
    };
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une tranche' })
  @ApiNoContentResponse({ description: 'Tranche supprimée' })
  @ApiNotFoundResponse({ description: 'Tranche non trouvée' })
  async remove(@Param('uuid') uuid: string) {
    await this.barreIrsaService.remove(uuid);
  }
}

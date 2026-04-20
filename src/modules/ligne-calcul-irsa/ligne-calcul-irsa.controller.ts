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
} from '@nestjs/swagger';
import { LigneCalculIrsaService } from './ligne-calcul-irsa.service';
import { CreateLigneCalculIrsaDto } from './dto/create-ligne-calcul-irsa.dto';
import { UpdateLigneCalculIrsaDto } from './dto/update-ligne-calcul-irsa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Lignes de calcul IRSA')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('lignes-calcul-irsa')
export class LigneCalculIrsaController {
  constructor(private readonly ligneService: LigneCalculIrsaService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Créer une ligne de calcul IRSA' })
  @ApiCreatedResponse({ description: 'Ligne créée' })
  async create(@Body() createDto: CreateLigneCalculIrsaDto) {
    const ligne = await this.ligneService.create(createDto);
    return {
      message: 'Ligne de calcul IRSA créée avec succès',
      data: ligne,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les lignes de calcul IRSA' })
  @ApiOkResponse({ description: 'Liste des lignes' })
  async findAll() {
    const lignes = await this.ligneService.findAll();
    return {
      message: 'Liste des lignes de calcul IRSA',
      data: lignes,
      count: lignes.length,
    };
  }

  @Get('calcul/:calculIrsaUuid')
  @ApiOperation({ summary: "Lister les lignes d'un calcul IRSA" })
  @ApiOkResponse({ description: 'Lignes du calcul' })
  async findByCalculIrsa(@Param('calculIrsaUuid') calculIrsaUuid: string) {
    const lignes = await this.ligneService.findByCalculIrsa(calculIrsaUuid);
    return {
      message: 'Lignes du calcul IRSA',
      data: lignes,
      count: lignes.length,
    };
  }

  @Get('calcul/:calculIrsaUuid/total')
  @ApiOperation({ summary: "Total de l'impôt pour un calcul IRSA" })
  @ApiOkResponse({ description: "Total de l'impôt" })
  async getTotalImpot(@Param('calculIrsaUuid') calculIrsaUuid: string) {
    const total = await this.ligneService.getTotalImpot(calculIrsaUuid);
    return {
      message: "Total de l'impôt",
      data: { totalImpot: total },
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer une ligne par UUID' })
  @ApiOkResponse({ description: 'Ligne trouvée' })
  @ApiNotFoundResponse({ description: 'Ligne non trouvée' })
  async findOne(@Param('uuid') uuid: string) {
    const ligne = await this.ligneService.findOne(uuid);
    return {
      message: 'Ligne trouvée',
      data: ligne,
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Mettre à jour une ligne' })
  @ApiOkResponse({ description: 'Ligne mise à jour' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateLigneCalculIrsaDto,
  ) {
    const ligne = await this.ligneService.update(uuid, updateDto);
    return {
      message: 'Ligne mise à jour avec succès',
      data: ligne,
    };
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une ligne' })
  @ApiNoContentResponse({ description: 'Ligne supprimée' })
  async remove(@Param('uuid') uuid: string) {
    await this.ligneService.remove(uuid);
  }

  @Delete('calcul/:calculIrsaUuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer toutes les lignes d'un calcul IRSA" })
  @ApiNoContentResponse({ description: 'Lignes supprimées' })
  async deleteByCalculIrsa(@Param('calculIrsaUuid') calculIrsaUuid: string) {
    await this.ligneService.deleteByCalculIrsa(calculIrsaUuid);
  }
}

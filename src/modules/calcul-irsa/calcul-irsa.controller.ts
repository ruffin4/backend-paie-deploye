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
import { CalculIrsaService } from './calcul-irsa.service';
import { CreateCalculIrsaDto } from './dto/create-calcul-irsa.dto';
import { UpdateCalculIrsaDto } from './dto/update-calcul-irsa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Calculs IRSA')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('calculs-irsa')
export class CalculIrsaController {
  constructor(private readonly calculService: CalculIrsaService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Créer un calcul IRSA' })
  @ApiCreatedResponse({ description: 'Calcul créé' })
  async create(@Body() createDto: CreateCalculIrsaDto) {
    const calcul = await this.calculService.create(createDto);
    return {
      message: 'Calcul IRSA créé avec succès',
      data: calcul,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les calculs IRSA' })
  @ApiOkResponse({ description: 'Liste des calculs' })
  async findAll() {
    const calculs = await this.calculService.findAll();
    return {
      message: 'Liste des calculs IRSA',
      data: calculs,
      count: calculs.length,
    };
  }

  @Get('bulletin/:bulletinUuid')
  @ApiOperation({ summary: "Récupérer le calcul IRSA d'un bulletin" })
  @ApiOkResponse({ description: 'Calcul trouvé' })
  @ApiNotFoundResponse({ description: 'Calcul non trouvé' })
  async findByBulletin(@Param('bulletinUuid') bulletinUuid: string) {
    const calcul = await this.calculService.findByBulletin(bulletinUuid);
    return {
      message: calcul
        ? 'Calcul IRSA trouvé'
        : 'Aucun calcul IRSA pour ce bulletin',
      data: calcul,
    };
  }

  @Get('bulletin/:bulletinUuid/details')
  @ApiOperation({ summary: "Récupérer les détails de l'impôt d'un bulletin" })
  @ApiOkResponse({ description: "Détails de l'impôt" })
  async getDetailsImpots(@Param('bulletinUuid') bulletinUuid: string) {
    const details = await this.calculService.getDetailsImpots(bulletinUuid);
    return {
      message: details ? "Détails de l'impôt" : 'Aucun calcul trouvé',
      data: details,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer un calcul IRSA par UUID' })
  @ApiOkResponse({ description: 'Calcul trouvé' })
  @ApiNotFoundResponse({ description: 'Calcul non trouvé' })
  async findOne(@Param('uuid') uuid: string) {
    const calcul = await this.calculService.findOne(uuid);
    return {
      message: 'Calcul IRSA trouvé',
      data: calcul,
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Mettre à jour un calcul IRSA' })
  @ApiOkResponse({ description: 'Calcul mis à jour' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateCalculIrsaDto,
  ) {
    const calcul = await this.calculService.update(uuid, updateDto);
    return {
      message: 'Calcul IRSA mis à jour avec succès',
      data: calcul,
    };
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un calcul IRSA' })
  @ApiNoContentResponse({ description: 'Calcul supprimé' })
  async remove(@Param('uuid') uuid: string) {
    await this.calculService.remove(uuid);
  }

  @Delete('bulletin/:bulletinUuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer le calcul IRSA d'un bulletin" })
  @ApiNoContentResponse({ description: 'Calcul supprimé' })
  async deleteByBulletin(@Param('bulletinUuid') bulletinUuid: string) {
    await this.calculService.deleteByBulletin(bulletinUuid);
  }
}

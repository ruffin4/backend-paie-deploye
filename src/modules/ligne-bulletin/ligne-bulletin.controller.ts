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
import { LigneBulletinService } from './ligne-bulletin.service';
import { CreateLigneBulletinDto } from './dto/create-ligne-bulletin.dto';
import { UpdateLigneBulletinDto } from './dto/update-ligne-bulletin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Lignes de bulletin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('lignes-bulletin')
export class LigneBulletinController {
  constructor(private readonly ligneService: LigneBulletinService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Créer une ligne de bulletin' })
  @ApiCreatedResponse({ description: 'Ligne créée' })
  async create(@Body() createDto: CreateLigneBulletinDto) {
    const ligne = await this.ligneService.create(createDto);
    return {
      message: 'Ligne de bulletin créée avec succès',
      data: ligne,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les lignes de bulletin' })
  @ApiOkResponse({ description: 'Liste des lignes' })
  async findAll() {
    const lignes = await this.ligneService.findAll();
    return {
      message: 'Liste des lignes de bulletin',
      data: lignes,
      count: lignes.length,
    };
  }

  @Get('bulletin/:bulletinUuid')
  @ApiOperation({ summary: "Lister les lignes d'un bulletin" })
  @ApiOkResponse({ description: 'Lignes du bulletin' })
  async findByBulletin(@Param('bulletinUuid') bulletinUuid: string) {
    const lignes = await this.ligneService.findByBulletin(bulletinUuid);
    return {
      message: 'Lignes du bulletin',
      data: lignes,
      count: lignes.length,
    };
  }

  @Get('rubrique/:rubriqueUuid')
  @ApiOperation({ summary: "Lister les lignes d'une rubrique" })
  @ApiOkResponse({ description: 'Lignes de la rubrique' })
  async findByRubrique(@Param('rubriqueUuid') rubriqueUuid: string) {
    const lignes = await this.ligneService.findByRubrique(rubriqueUuid);
    return {
      message: 'Lignes de la rubrique',
      data: lignes,
      count: lignes.length,
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

  @Get('totaux/:bulletinUuid')
  @ApiOperation({ summary: "Récupérer les totaux d'un bulletin" })
  @ApiOkResponse({ description: 'Totaux calculés' })
  async getTotaux(@Param('bulletinUuid') bulletinUuid: string) {
    const [totalGains, totalRetenues, totalCotisationsPatronales] =
      await Promise.all([
        this.ligneService.getTotalGains(bulletinUuid),
        this.ligneService.getTotalRetenues(bulletinUuid),
        this.ligneService.getTotalCotisationsPatronales(bulletinUuid),
      ]);

    return {
      message: 'Totaux du bulletin',
      data: {
        totalGains,
        totalRetenues,
        totalCotisationsPatronales,
        netAPayer: totalGains - totalRetenues,
      },
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Mettre à jour une ligne' })
  @ApiOkResponse({ description: 'Ligne mise à jour' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateLigneBulletinDto,
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

  @Delete('bulletin/:bulletinUuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer toutes les lignes d'un bulletin" })
  @ApiNoContentResponse({ description: 'Lignes supprimées' })
  async deleteByBulletin(@Param('bulletinUuid') bulletinUuid: string) {
    await this.ligneService.deleteByBulletin(bulletinUuid);
  }
}

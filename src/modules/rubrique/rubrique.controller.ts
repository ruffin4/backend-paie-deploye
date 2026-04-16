/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
} from '@nestjs/swagger';
import { RubriqueService } from './rubrique.service';
import { CreateRubriqueDto } from './dto/create-rubrique.dto';
import { UpdateRubriqueDto } from './dto/update-rubrique.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Rubriques')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('rubriques')
export class RubriqueController {
  constructor(private readonly rubriqueService: RubriqueService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer une nouvelle rubrique' })
  @ApiCreatedResponse({ description: 'Rubrique créée avec succès' })
  @ApiConflictResponse({ description: 'Le code de la rubrique existe déjà' })
  async create(@Body() createDto: CreateRubriqueDto) {
    const rubrique = await this.rubriqueService.create(createDto);
    return {
      message: 'Rubrique créée avec succès',
      data: rubrique,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les rubriques' })
  @ApiOkResponse({ description: 'Liste des rubriques' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filtrer les rubriques actives',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filtrer par type (GAIN, RETENUE, etc.)',
  })
  async findAll(
    @Query('active') active?: string,
    @Query('type') type?: string,
  ) {
    let rubriques;

    if (active === 'true') {
      rubriques = await this.rubriqueService.findAllActive();
    } else if (type) {
      rubriques = await this.rubriqueService.findByType(type);
    } else {
      rubriques = await this.rubriqueService.findAll();
    }

    return {
      message: 'Liste des rubriques',
      data: rubriques,
      count: rubriques.length,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer une rubrique par son UUID' })
  @ApiOkResponse({ description: 'Rubrique trouvée' })
  @ApiNotFoundResponse({ description: 'Rubrique non trouvée' })
  async findOne(@Param('uuid') uuid: string) {
    const rubrique = await this.rubriqueService.findOne(uuid);
    return {
      message: 'Rubrique trouvée',
      data: rubrique,
    };
  }

  @Get('code/:code')
  @Public()
  @ApiOperation({ summary: 'Récupérer une rubrique par son code' })
  @ApiOkResponse({ description: 'Rubrique trouvée' })
  @ApiNotFoundResponse({ description: 'Rubrique non trouvée' })
  async findByCode(@Param('code') code: string) {
    const rubrique = await this.rubriqueService.findByCode(code);
    if (!rubrique) {
      return {
        message: 'Rubrique non trouvée',
        data: null,
      };
    }
    return {
      message: 'Rubrique trouvée',
      data: rubrique,
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mettre à jour une rubrique' })
  @ApiOkResponse({ description: 'Rubrique mise à jour' })
  @ApiNotFoundResponse({ description: 'Rubrique non trouvée' })
  @ApiConflictResponse({ description: 'Le code de la rubrique existe déjà' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateRubriqueDto,
  ) {
    const rubrique = await this.rubriqueService.update(uuid, updateDto);
    return {
      message: 'Rubrique mise à jour avec succès',
      data: rubrique,
    };
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver une rubrique (soft delete)' })
  @ApiNoContentResponse({ description: 'Rubrique désactivée' })
  @ApiNotFoundResponse({ description: 'Rubrique non trouvée' })
  async remove(@Param('uuid') uuid: string) {
    await this.rubriqueService.remove(uuid);
  }

  @Delete(':uuid/hard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer définitivement une rubrique' })
  @ApiNoContentResponse({ description: 'Rubrique supprimée définitivement' })
  @ApiNotFoundResponse({ description: 'Rubrique non trouvée' })
  async hardRemove(@Param('uuid') uuid: string) {
    await this.rubriqueService.hardRemove(uuid);
  }

  @Patch(':uuid/restore')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Restaurer une rubrique désactivée' })
  @ApiOkResponse({ description: 'Rubrique restaurée' })
  @ApiNotFoundResponse({ description: 'Rubrique non trouvée' })
  async restore(@Param('uuid') uuid: string) {
    const rubrique = await this.rubriqueService.restore(uuid);
    return {
      message: 'Rubrique restaurée avec succès',
      data: rubrique,
    };
  }
}

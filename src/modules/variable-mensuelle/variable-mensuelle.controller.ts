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
  ApiQuery,
} from '@nestjs/swagger';
import { VariableMensuelleService } from './variable-mensuelle.service';
import { CreateVariableMensuelleDto } from './dto/create-variable-mensuelle.dto';
import { UpdateVariableMensuelleDto } from './dto/update-variable-mensuelle.dto';
import { FilterVariableMensuelleDto } from './dto/filter-variable-mensuelle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Variables mensuelles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('variables-mensuelles')
export class VariableMensuelleController {
  constructor(private readonly variableService: VariableMensuelleService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Créer une variable mensuelle' })
  @ApiCreatedResponse({ description: 'Variable créée avec succès' })
  @ApiConflictResponse({ description: 'Variable déjà existante' })
  async create(@Body() createDto: CreateVariableMensuelleDto) {
    const variable = await this.variableService.create(createDto);
    return {
      message: 'Variable mensuelle créée avec succès',
      data: variable,
    };
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Créer plusieurs variables mensuelles' })
  @ApiCreatedResponse({ description: 'Variables créées avec succès' })
  async createMany(@Body() dtos: CreateVariableMensuelleDto[]) {
    const variables = await this.variableService.createMany(dtos);
    return {
      message: `${variables.length} variables mensuelles traitées avec succès`,
      data: variables,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les variables mensuelles' })
  @ApiOkResponse({ description: 'Liste des variables' })
  @ApiQuery({
    name: 'employeUuid',
    required: false,
    description: 'Filtrer par employé',
  })
  @ApiQuery({
    name: 'rubriqueUuid',
    required: false,
    description: 'Filtrer par rubrique',
  })
  @ApiQuery({
    name: 'periodeUuid',
    required: false,
    description: 'Filtrer par période',
  })
  async findAll(@Query() filter: FilterVariableMensuelleDto) {
    const variables = await this.variableService.findAll(filter);
    return {
      message: 'Liste des variables mensuelles',
      data: variables,
      count: variables.length,
    };
  }

  @Get('periode/:periodeUuid')
  @ApiOperation({ summary: "Lister les variables d'une période" })
  @ApiOkResponse({ description: 'Liste des variables' })
  async findByPeriode(@Param('periodeUuid') periodeUuid: string) {
    const variables = await this.variableService.findByPeriode(periodeUuid);
    return {
      message: `Variables de la période ${periodeUuid}`,
      data: variables,
      count: variables.length,
    };
  }

  @Get('employe/:employeUuid/periode/:periodeUuid')
  @ApiOperation({
    summary: "Lister les variables d'un employé pour une période",
  })
  @ApiOkResponse({ description: 'Liste des variables' })
  async findByEmployeAndPeriode(
    @Param('employeUuid') employeUuid: string,
    @Param('periodeUuid') periodeUuid: string,
  ) {
    const variables = await this.variableService.findByEmployeAndPeriode(
      employeUuid,
      periodeUuid,
    );
    return {
      message: `Variables de l'employé pour la période`,
      data: variables,
      count: variables.length,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer une variable par son UUID' })
  @ApiOkResponse({ description: 'Variable trouvée' })
  @ApiNotFoundResponse({ description: 'Variable non trouvée' })
  async findOne(@Param('uuid') uuid: string) {
    const variable = await this.variableService.findOne(uuid);
    return {
      message: 'Variable trouvée',
      data: variable,
    };
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @ApiOperation({ summary: 'Mettre à jour une variable' })
  @ApiOkResponse({ description: 'Variable mise à jour' })
  @ApiNotFoundResponse({ description: 'Variable non trouvée' })
  async update(
    @Param('uuid') uuid: string,
    @Body() updateDto: UpdateVariableMensuelleDto,
  ) {
    const variable = await this.variableService.update(uuid, updateDto);
    return {
      message: 'Variable mise à jour avec succès',
      data: variable,
    };
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'GESTIONNAIRE')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une variable' })
  @ApiNoContentResponse({ description: 'Variable supprimée' })
  @ApiNotFoundResponse({ description: 'Variable non trouvée' })
  async remove(@Param('uuid') uuid: string) {
    await this.variableService.remove(uuid);
  }

  @Delete('periode/:periodeUuid')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer toutes les variables d'une période" })
  @ApiNoContentResponse({ description: 'Variables supprimées' })
  async removeByPeriode(@Param('periodeUuid') periodeUuid: string) {
    await this.variableService.removeByPeriode(periodeUuid);
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { EmployeService } from './employe.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Employés')
@ApiBearerAuth('JWT-auth')
@Controller('employes')
export class EmployeController {
  constructor(private readonly service: EmployeService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer un employé' })
  @ApiResponse({ status: 201, description: 'Employé créé avec succès' })
  @ApiResponse({ status: 409, description: 'Le matricule interne existe déjà' })
  @ApiCreatedResponse({ description: 'Employé créé' })
  async create(@Body() dto: CreateEmployeDto) {
    const employers = await this.service.create(dto);
    return {
      message: 'Employé créé avec succès',
      employers,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lister les employés' })
  @ApiResponse({
    status: 200,
    description: 'Liste des employés récupérée avec succès',
  })
  @ApiOkResponse({ description: 'Liste des employés' })
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const employers = await this.service.findAll();
    return {
      Message: 'Liste des employés récupérée avec succès',
      employers,
    };
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Récupérer un employé par UUID' })
  @ApiResponse({
    status: 200,
    description: 'Employé récupéré avec succès',
  })
  @ApiOkResponse({ description: 'Employé' })
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('uuid') uuid: string) {
    const employer = await this.service.findOne(uuid);
    return {
      Message: 'Employé récupéré avec succès',
      employer,
    };
  }

  @Patch(':uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Mettre à jour un employé' })
  @ApiResponse({ status: 200, description: 'Employé mis à jour avec succès' })
  @ApiOkResponse({ description: 'Employé mis à jour' })
  async update(@Param('uuid') uuid: string, @Body() dto: UpdateEmployeDto) {
    return {
      Message: 'Employé mis à jour avec succès',
      employer: await this.service.update(uuid, dto),
    };
  }

  @Delete(':uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer un employé' })
  @ApiResponse({ status: 204, description: 'Employé supprimé avec succès' })
  @ApiNoContentResponse({ description: 'Employé supprimé' })
  async remove(@Param('uuid') uuid: string) {
    const employer = await this.service.remove(uuid);
    return {
      Message: 'Employé supprimé avec succès',
      employer,
    };
  }
}

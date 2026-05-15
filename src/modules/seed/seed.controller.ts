import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('initialisation')
@Controller('init-defaults')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('rubriques')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initialiser les rubriques par défaut' })
  async initRubriques() {
    const data = await this.seedService.seedRubriques();
    return { message: 'Rubriques initialisées', count: data.length };
  }

  @Post('cotisations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initialiser les cotisations par défaut' })
  async initCotisations() {
    const data = await this.seedService.seedCotisations();
    return { message: 'Cotisations initialisées', count: data.length };
  }

  @Post('barre-irsa')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initialiser la grille IRSA par défaut' })
  async initBarreIrsa() {
    const data = await this.seedService.seedBarreIrsa();
    return { message: 'Grille IRSA initialisée', count: data.length };
  }
}

import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, RequireRole } from '../common/guards/roles.guard';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
    constructor(private readonly disputesService: DisputesService) { }

    @Post()
    create(@Request() req, @Body() createDisputeDto: CreateDisputeDto) {
        return this.disputesService.create(req.user.id, createDisputeDto);
    }

    @Get('my')
    findMyDisputes(@Request() req) {
        return this.disputesService.findByUser(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.disputesService.findOne(id);
    }

    // Admin endpoints
    @Get()
    @UseGuards(RolesGuard)
    @RequireRole('moderator', 'admin', 'super_admin')
    findAll(
        @Query('status') status?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.disputesService.findAll(status, page ? Number(page) : 1, limit ? Number(limit) : 20);
    }


    @Get('stats/summary')
    @UseGuards(RolesGuard)
    @RequireRole('moderator', 'admin', 'super_admin')
    getStats() {
        return this.disputesService.getStats();
    }

    @Patch(':id/resolve')
    @UseGuards(RolesGuard)
    @RequireRole('moderator', 'admin', 'super_admin')
    resolve(
        @Param('id') id: string,
        @Request() req,
        @Body() resolveDisputeDto: ResolveDisputeDto,
    ) {
        return this.disputesService.resolve(id, req.user.id, resolveDisputeDto);
    }
}

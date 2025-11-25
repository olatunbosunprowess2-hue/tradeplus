import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { WantsService } from './wants.service';
import { CreateWantDto } from './dto/create-want.dto';
import { UpdateWantDto } from './dto/update-want.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wants')
export class WantsController {
    constructor(private readonly wantsService: WantsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Request() req, @Body() createWantDto: CreateWantDto) {
        return this.wantsService.create(req.user.id, createWantDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(@Request() req) {
        return this.wantsService.findAll(req.user.id);
    }

    @Get('user/:userId')
    findAllByUser(@Param('userId') userId: string) {
        return this.wantsService.findAllByUser(userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Request() req,
        @Param('id') id: string,
        @Body() updateWantDto: UpdateWantDto,
    ) {
        return this.wantsService.update(id, req.user.id, updateWantDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Request() req, @Param('id') id: string) {
        return this.wantsService.remove(id, req.user.id);
    }
}

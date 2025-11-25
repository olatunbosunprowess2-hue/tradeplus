import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { BarterService } from './barter.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('barter')
@UseGuards(JwtAuthGuard)
export class BarterController {
    constructor(private readonly barterService: BarterService) { }

    @Post('offers')
    createOffer(@Request() req, @Body() createOfferDto: CreateOfferDto) {
        return this.barterService.createOffer(req.user.id, createOfferDto);
    }

    @Get('offers')
    getOffers(@Request() req, @Query() query: OfferQueryDto) {
        return this.barterService.getOffers(req.user.id, query);
    }

    @Get('offers/:id')
    getOffer(@Request() req, @Param('id') id: string) {
        return this.barterService.getOffer(id, req.user.id);
    }

    @Patch('offers/:id/accept')
    acceptOffer(@Request() req, @Param('id') id: string) {
        return this.barterService.acceptOffer(id, req.user.id);
    }

    @Patch('offers/:id/reject')
    rejectOffer(@Request() req, @Param('id') id: string) {
        return this.barterService.rejectOffer(id, req.user.id);
    }

    @Post('offers/:id/counter')
    counterOffer(
        @Request() req,
        @Param('id') id: string,
        @Body() counterOfferDto: CounterOfferDto,
    ) {
        return this.barterService.counterOffer(id, req.user.id, counterOfferDto);
    }
}

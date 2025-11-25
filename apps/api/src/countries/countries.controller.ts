import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) { }

    @Get()
    findAll() {
        return this.countriesService.findAll();
    }

    @Get(':id/regions')
    findRegions(@Param('id', ParseIntPipe) id: number) {
        return this.countriesService.findRegions(id);
    }
}

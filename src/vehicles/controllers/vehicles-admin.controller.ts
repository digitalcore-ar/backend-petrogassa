import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { VehiclesService } from '../services/vehicles-admin.service';
import { CreateCompleteVehicleDto } from '../dto/admin/create-vehicle-complete.dto';
import { UpdateCompleteVehicleDto } from '../dto/admin/update-vehicle-complete.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) { }

  @Post()
  create(@Body() createVehicleDto: CreateCompleteVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCompleteVehicleDto: UpdateCompleteVehicleDto) {
    return this.vehiclesService.update(id, updateCompleteVehicleDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.desactivate(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Inject } from '@nestjs/common';
import { VehiclesAdminService } from '../services/vehicles-admin.service';
import { CreateCompleteVehicleDto } from '../dto/admin/create-vehicle-complete.dto';
import { UpdateCompleteVehicleDto } from '../dto/admin/update-vehicle-complete.dto';

@Controller('vehicles/main')
export class VehiclesController {
  constructor(
    @Inject(VehiclesAdminService)
    private readonly vehiclesService: VehiclesAdminService
  ) { }

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

  @Delete(':id/desactivate')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.desactivate(id);
  }

  @Patch(':id/activate')
  active(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.active(id);
  }
}

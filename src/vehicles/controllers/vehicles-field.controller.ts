import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { VehiclesFieldService } from "../services/vehicles-field.service";
import { CreateVehicleFieldDto } from "../dto/field/create-vehicle-field.dto";


@Controller('vehicles/field')
export class VehiclesFieldController {

    constructor(
        @Inject(VehiclesFieldService)
        private readonly vehiclesFieldService: VehiclesFieldService,
    ) { }

    @Get()
    async getVehiclesField() {
        return this.vehiclesFieldService.getVehiclesField();
    }

    @Get(':id')
    async getVehicleField(@Param('id', ParseUUIDPipe) id: string) {
        return this.vehiclesFieldService.getVehicleField(id);
    }

    @Patch(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateVehicleFieldDto: CreateVehicleFieldDto) {
        return this.vehiclesFieldService.update(id, updateVehicleFieldDto);
    }
}
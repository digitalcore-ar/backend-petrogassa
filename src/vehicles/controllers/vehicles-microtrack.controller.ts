import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { VehiclesMicrotrackService } from "../services/vehicles-microtrack.service";
import { CreateVehicleMicrotrackDto } from "../dto/microtrack/create-vehicle-microtrack.dto";


@Controller('vehicles/microtrack')
export class VehiclesMicrotrackController {
    constructor(
        @Inject(VehiclesMicrotrackService)
        private readonly vehicleMicrotrackService: VehiclesMicrotrackService
    ) { }

    @Get()
    getVehicles() {
        return this.vehicleMicrotrackService.getVehicles();
    }

    @Get(':id')
    getVehicle(@Param('id', ParseUUIDPipe) id: string) {
        return this.vehicleMicrotrackService.getVehicle(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateVehicleMicrotrackDto: CreateVehicleMicrotrackDto
    ) {
        return this.vehicleMicrotrackService.update(id, updateVehicleMicrotrackDto);
    }
}
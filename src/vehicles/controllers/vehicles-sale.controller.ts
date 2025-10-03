import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { VehiclesSaleService } from "../services/vehicles-sale.service";
import { CreateVehicleSaleDto } from "../dto/sales/create-vehicle-sale.dto";



@Controller('vehicles/sales')
export class VehiclesSaleController {

    constructor(
        @Inject(VehiclesSaleService)
        private readonly vehiclesSaleService: VehiclesSaleService,
    ) { }

    @Get()
    getVehiclesSales() {
        return this.vehiclesSaleService.getVehiclesSales();
    }

    @Get(':id')
    getVehicleSale(
        @Param('id', ParseUUIDPipe) id: string
    ) {
        return this.vehiclesSaleService.getVehicleSale(id);
    }

    @Patch(':id')
    updateVehicleSale(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateVehicleSaleDto: CreateVehicleSaleDto
    ) {
        return this.vehiclesSaleService.updateVehicleSale(id, updateVehicleSaleDto);
    }
}
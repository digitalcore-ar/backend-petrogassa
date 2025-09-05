import { Controller, Inject, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { VehiclesFieldService } from "../services/vehicles-fields.service";


@Controller('vehicles/field')
export class VehicleFieldController {

    constructor(
        @Inject(VehiclesFieldService)
        private readonly vehiclesFieldService: VehiclesFieldService,
    ) { }

    @Patch(':id')
    async update(@Param('id', ParseUUIDPipe) id: string) {
        return this.vehiclesFieldService.update(id);
    }
}
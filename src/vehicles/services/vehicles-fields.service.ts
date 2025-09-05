import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { VehiclesField } from "../entities/vehicles-field.entity";
import { Repository } from "typeorm";
import { VehiclesStatusConditionsService } from "./vehicles-status-conditions.service";


@Injectable()
export class VehiclesFieldService {

    constructor(
        @InjectRepository(VehiclesField)
        private readonly vehiclesFieldRepository: Repository<VehiclesField>,
        @Inject(VehiclesStatusConditionsService)
        private readonly vehiclesStatusConditionsService: VehiclesStatusConditionsService,
    ) { }

    async update(id: string) {
        const vehicle = await this.vehiclesStatusConditionsService.checkVehicleExist(id);
    }
}
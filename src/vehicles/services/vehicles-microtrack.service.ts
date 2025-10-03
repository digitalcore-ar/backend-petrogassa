import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VehiclesMicrotrack } from "../entities/vehicle-microtrack.entity";
import { CreateVehicleMicrotrackDto } from "../dto/microtrack/create-vehicle-microtrack.dto";
import { VehiclesStatusConditionsService } from "./vehicles-status-conditions.service";
import { Vehicle } from "../entities/vehicle-core.entity";
import { Conditions } from "../enums";
import { flattenObject } from "src/common/utils/flattern.util";

@Injectable()
export class VehiclesMicrotrackService {
    constructor(
        @InjectRepository(VehiclesMicrotrack)
        private readonly vehiclesMicrotrackRepository: Repository<VehiclesMicrotrack>,
        @InjectRepository(Vehicle)
        private readonly vehiclesRepository: Repository<Vehicle>,
        @Inject(VehiclesStatusConditionsService)
        private readonly vehiclesStatusConditionsService: VehiclesStatusConditionsService
    ) { }

    async update(id: string, updateVehicleMicrotrack: CreateVehicleMicrotrackDto) {
        //1. buscar el vehiculo
        const vehicle = await this.vehiclesStatusConditionsService.checkVehicleExist(id);

        //2. Verificar Microtrack
        if (!vehicle.vehiclesMicrotrack) {
            throw new NotFoundException('Vehicles Microtrack no encontrado');
        }

        //3. Actualizar los campos de vehiclesMicrotrack
        Object.assign(vehicle.vehiclesMicrotrack, updateVehicleMicrotrack);
        //4. Guardar el vehiculo
        return await this.vehiclesMicrotrackRepository.save(vehicle.vehiclesMicrotrack);
    }

    async getVehicles() {
        const vehicles = await this.vehiclesRepository.find({
            where: {
                condicion: Conditions.OPERATIVO
            },
            relations: ['vehiclesMicrotrack', 'vehiclesField'],
            select: {
                id: true,
                patente: true,
                vehiclesField: {
                    area: true,
                    operadora: true,
                    funcion: true
                }
            }
        })
        return vehicles.map((vehicle) => flattenObject(vehicle));
    }

    async getVehicle(id: string) {
        const vehicle = await this.vehiclesRepository.findOne({
            where: {
                id,
                condicion: Conditions.OPERATIVO
            },
            relations: ['vehiclesMicrotrack', 'vehiclesField'],
            select: {
                id: true,
                patente: true,
                vehiclesField: {
                    area: true,
                    operadora: true,
                    funcion: true
                }
            }
        })
        return flattenObject(vehicle);
    }
}
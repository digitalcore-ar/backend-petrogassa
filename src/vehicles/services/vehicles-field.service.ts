import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { VehiclesField } from "../entities/vehicles-field.entity";
import { Repository } from "typeorm";
import { VehiclesStatusConditionsService } from "./vehicles-status-conditions.service";
import { CreateVehicleFieldDto } from "../dto/field/create-vehicle-field.dto";
import { Vehicle } from "../entities/vehicle-core.entity";
import { Conditions } from "../enums";
import { flattenObject } from '../../common/utils/flattern.util'


@Injectable()
export class VehiclesFieldService {

    constructor(
        @InjectRepository(VehiclesField)
        private readonly vehiclesFieldRepository: Repository<VehiclesField>,
        @InjectRepository(Vehicle)
        private readonly vehicleRepository: Repository<Vehicle>,
        @Inject(VehiclesStatusConditionsService)
        private readonly vehiclesStatusConditionsService: VehiclesStatusConditionsService,
    ) { }

    async update(id: string, updateVehicleFieldDto: CreateVehicleFieldDto) {
        // 1. Obtener el vehículo con las relaciones
        const vehicle = await this.vehiclesStatusConditionsService.checkVehicleExist(id);

        // 2. Verificar vehiclesField
        if (!vehicle.vehiclesField) {
            throw new NotFoundException('Vehicles field no encontrado');
        }

        // 3. Actualizar los campos del vehiclesField
        Object.assign(vehicle.vehiclesField, updateVehicleFieldDto);

        // 4. Guardar cambios
        const updatedField = await this.vehiclesFieldRepository.save(vehicle.vehiclesField);

        // 5. Actualizar estado y condición del vehículo
        await this.vehiclesStatusConditionsService.updateVehicleStatus(id);

        return updatedField;
    }

    async getVehiclesField() {
        const vehicles = await this.vehicleRepository.find({
            where: {
                condicion: Conditions.OPERATIVO
            },
            relations: ['vehiclesField'],
            select: {
                id: true,
                patente: true,
                marca: true,
                modelo: true,
                anio: true,
            }
        })
        return vehicles.map((vehicle) => flattenObject(vehicle));
    }

    async getVehicleField(id: string) {
        const vehicle = await this.vehicleRepository.findOne({
            where: {
                id
            },
            relations: ['vehiclesField'],
            select: {
                id: true,
                patente: true,
                marca: true,
                modelo: true,
                anio: true
            }
        })
        return flattenObject(vehicle);
    }
}
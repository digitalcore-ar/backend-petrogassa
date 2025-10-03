import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VehiclesSales } from '../entities/vehicle-sale.entity'
import { Vehicle } from '../entities/vehicle-core.entity'
import { VehiclesStatusConditionsService } from "./vehicles-status-conditions.service";
import { flattenObject } from "../../common/utils/flattern.util";
import { CreateVehicleSaleDto } from "../dto/sales/create-vehicle-sale.dto";
import { Status } from "../enums";


@Injectable()
export class VehiclesSaleService {
    constructor(
        @InjectRepository(VehiclesSales)
        private readonly vehiclesSaleRepository: Repository<VehiclesSales>,
        @InjectRepository(Vehicle)
        private readonly vehiclesRepository: Repository<Vehicle>,
        @Inject(VehiclesStatusConditionsService)
        private readonly vehiclesStatusConditionsService: VehiclesStatusConditionsService,
    ) { }

    async getVehicleSale(id: string) {
        const vehicle = await this.vehiclesRepository.findOne({
            where: {
                id
            },
            relations: ['vehiclesSale'],
            select: {
                id: true,
                patente: true,
                estado: true
            }
        })
        return flattenObject(vehicle);
    }

    async getVehiclesSales() {
        const vehicles = await this.vehiclesRepository.find({
            relations: ['vehiclesSale'],
            select: {
                id: true,
                patente: true,
                estado: true
            }
        })
        return vehicles.map(vehicle => flattenObject(vehicle));
    }

    async updateVehicleSale(id: string, updateVehiclesSale: CreateVehicleSaleDto) {
        const vehicle = await this.vehiclesStatusConditionsService.checkVehicleExist(id);

        if (vehicle.fechaDevTitular && vehicle.estado === Status.DEVUELTO) {
            throw new BadRequestException('No se puede crear/actualizar una venta para un vehículo devuelto. ' +
                'Primero debe eliminar la fecha de devolución al titular.');
        }

        if (!vehicle.vehiclesSale) {
            throw new NotFoundException('Vehicles Sale not found');
        }

        Object.assign(vehicle.vehiclesSale, updateVehiclesSale);
        await this.vehiclesSaleRepository.save(vehicle.vehiclesSale);
        const updatedVehicle = await this.vehiclesStatusConditionsService.updateVehicleStatus(id);
        return flattenObject(updatedVehicle);
    }
}
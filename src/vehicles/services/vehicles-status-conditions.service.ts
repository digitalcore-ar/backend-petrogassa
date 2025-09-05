import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Vehicle } from "../entities/vehicle-core.entity";
import { Repository } from "typeorm";
import { Conditions, Status } from "../enums";


//estos son metodos de uso interno para el servicio de vehiculos,
//ya que en cada endpoint es necesario cambiar el estado o condicion del vehiculo
//dadas las condiciones
@Injectable()
export class VehiclesStatusConditionsService {
    constructor(
        @InjectRepository(Vehicle) private readonly vehicleRepository: Repository<Vehicle>
    ) { }

    //metodo para buscar un vehiculo
    async checkVehicleExist(id: string) {
        const vehicle = await this.vehicleRepository.findOneBy({ id });
        if (!vehicle) {
            throw new Error(`Vehicle with id ${id} not found`);
        }
        return vehicle;
    }

    //metodo para cambiar la "condicion" de un vehiculo
    async updateCondition(id: string, newCondition: Conditions) {
        const vehicle = await this.checkVehicleExist(id);
        vehicle.condicion = newCondition;
        return await this.vehicleRepository.save(vehicle);
    }

    //metodo para cambiar el "estado" de un vehiculo
    async updateStatus(id: string, newStatus: Status) {
        const vehicle = await this.checkVehicleExist(id);
        vehicle.estado = newStatus;
        return await this.vehicleRepository.save(vehicle);
    }
} 
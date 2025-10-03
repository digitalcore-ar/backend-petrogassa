import { Injectable, NotFoundException } from "@nestjs/common";
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

    async checkVehicleExist(vehicleId: string): Promise<Vehicle> {
        const vehicle = await this.vehicleRepository.findOne({
            where: { id: vehicleId },
            relations: ['vehiclesField', 'vehiclesSale', 'vehiclesMicrotrack']
        });

        if (!vehicle) {
            throw new NotFoundException('Vehículo no encontrado');
        }

        return vehicle;
    }

    private calculateEstado(vehicle: Vehicle): Status | null {
        const sales = vehicle.vehiclesSale;

        if (vehicle.fechaDevTitular) return Status.DEVUELTO;

        if (!sales) return null;

        const hasBasicData = sales.nombreComprador &&
            sales.cuilCUITcomprador &&
            sales.direccionComprador &&
            sales.fechaVenta;

        if (!hasBasicData) return null;

        const hasProcessDates = sales.fechaDenunciaVenta ||
            sales.transferenciaFecha ||
            sales.fechaBajaSeguro ||
            sales.fechaBajaPatente;

        return hasProcessDates ? Status.VENDIDO : Status.EN_VENTA;
    }

    private calculateCondicion(vehicle: Vehicle): Conditions {
        //fue devuelto?
        if (vehicle.estado === Status.DEVUELTO) return Conditions.INACTIVO;

        // esta en venta?
        if (vehicle.estado === Status.EN_VENTA) return Conditions.ACTIVO;

        // fue vendido?
        if (vehicle.estado === Status.VENDIDO) return Conditions.INACTIVO;

        // tiene area?
        if (vehicle.vehiclesField?.area) return Conditions.OPERATIVO;

        return Conditions.ACTIVO;
    }


    async updateVehicleStatus(vehicleId: string): Promise<Vehicle> {
        // 1. Buscar el vehículo con todas sus relaciones
        const vehicle = await this.checkVehicleExist(vehicleId);

        // 2. Calcular nuevo estado
        const newEstado = this.calculateEstado(vehicle);
        console.log('newEstado', newEstado);

        // 3. Calcular nueva condición (usando el nuevo estado)
        const vehicleWithNewEstado = { ...vehicle, estado: newEstado };
        const newCondicion = this.calculateCondicion(vehicleWithNewEstado);
        console.log('newCondicion', newCondicion);

        // 4. ¿Hay cambios que hacer?
        const updates: any = {};
        console.log('updates', updates);

        if (newEstado && vehicle.estado !== newEstado) {
            updates.estado = newEstado;
        }

        if (vehicle.condicion !== newCondicion) {
            updates.condicion = newCondicion;
        }

        // 5. Actualizar solo si hay cambios
        if (Object.keys(updates).length > 0) {
            await this.vehicleRepository.update(vehicleId, updates);
        }

        // 6. Devolver el vehículo actualizado
        return this.checkVehicleExist(vehicleId);
    }
} 
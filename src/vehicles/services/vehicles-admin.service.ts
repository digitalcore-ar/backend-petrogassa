import { HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCompleteVehicleDto } from '../dto/admin/update-vehicle-complete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from '../entities/vehicle-core.entity';
import { DataSource, Repository } from 'typeorm';
import { Conditions } from '../enums';
import { CreateCompleteVehicleDto } from '../dto/admin/create-vehicle-complete.dto';
import { VehiclesField } from '../entities/vehicles-field.entity';
import { VehiclesMicrotrack } from '../entities/vehicle-microtrack.entity';
import { VehiclesSales } from '../entities/vehicle-sale.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @Inject(DataSource) private dataSource: DataSource,
    @InjectRepository(Vehicle) private vehicleRepository: Repository<Vehicle>,
  ) { }

  async create(createCompleteVehicle: CreateCompleteVehicleDto): Promise<Vehicle | null> {
    return this.dataSource.transaction(async manager => {
      const vehicle = manager.create(Vehicle, createCompleteVehicle.vehicle);
      const savedVehicle = await manager.save(vehicle);

      const vehicleField = manager.create(VehiclesField, {
        vehicle: savedVehicle
      });

      const vehicleMicrotrack = manager.create(VehiclesMicrotrack, {
        vehicle: savedVehicle
      });

      const vehicleSale = manager.create(VehiclesSales, {
        vehicle: savedVehicle
      });

      await Promise.all([
        manager.save(vehicleField),
        manager.save(vehicleMicrotrack),
        manager.save(vehicleSale)
      ]);

      return manager.findOne(Vehicle, {
        where: { id: savedVehicle.id },
        relations: ['vehiclesField', 'vehiclesMicrotrack', 'vehiclesSale']
      });
    })
  }

  async findAll() {
    const vehicles = await this.vehicleRepository.find({
      relations: ['vehiclesField', 'vehiclesMicrotrack']
    });
    if (vehicles.length === 0) {
      return {
        message: 'No se encontraron vehículos',
        vehicles: []
      };
    }
    return vehicles;
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['vehiclesField', 'vehiclesMicrotrack', 'vehiclesSale']
    });

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return vehicle;
  }

  async update(id: string, updateDto: UpdateCompleteVehicleDto) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Verificar que el vehículo existe
      const vehicle = await this.findOne(id);

      // 2. Actualizar vehículo principal si se proporciona
      if (updateDto.vehicle) {
        Object.assign(vehicle, updateDto.vehicle);
        await manager.save(vehicle);
      }

      // 3. Actualizar field si se proporciona
      if (updateDto.field) {
        Object.assign(vehicle.vehiclesField, updateDto.field);
        await manager.save(vehicle.vehiclesField);
      }

      // 4. Actualizar microtrack si se proporciona
      if (updateDto.microtrack) {
        Object.assign(vehicle.vehiclesMicrotrack, updateDto.microtrack);
        await manager.save(vehicle.vehiclesMicrotrack);
      }

      // 5. Actualizar sale si se proporciona
      if (updateDto.sale) {
        Object.assign(vehicle.vehiclesSale, updateDto.sale);
        await manager.save(vehicle.vehiclesSale);
      }

      // 6. Retornar vehículo actualizado
      return vehicle;
      // return manager.findOne(Vehicle, {
      //   where: { id },
      //   relations: ['vehiclesField', 'vehiclesMicrotrack', 'vehiclesSale']
      // });
    });
  }

  async desactivate(id: string) {
    const vehicle = await this.findOne(id);
    if (vehicle.condicion === Conditions.ACTIVO) {
      vehicle.condicion = Conditions.INACTIVO;
    } else {
      throw new HttpException('Vehicle is not active', 400);
    }
    return await this.vehicleRepository.save(vehicle);
  }

  async active(id: string) {
    const vehicle = await this.findOne(id);
    if (vehicle.condicion === Conditions.INACTIVO) {
      vehicle.condicion = Conditions.ACTIVO;
    } else {
      throw new HttpException('Vehicle is active', 400);
    }
    return await this.vehicleRepository.save(vehicle);
  }
}

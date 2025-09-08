import { HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateVehicleDto } from '../dto/admin/update-vehicle-complete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from '../entities/vehicle-core.entity';
import { DataSource, Repository } from 'typeorm';
import { Conditions } from '../enums';
import { VehiclesStatusConditionsService } from './vehicles-status-conditions.service';
import { CreateCompleteVehicleDto } from '../dto/admin/create-vehicle-complete.dto';
import { VehiclesField } from '../entities/vehicles-field.entity';
import { VehiclesMicrotrack } from '../entities/vehicle-microtrack.entity';
import { VehiclesSales } from '../entities/vehicle-sale.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @Inject(DataSource) private dataSource: DataSource,
    @InjectRepository(Vehicle) private vehicleRepository: Repository<Vehicle>,
    @Inject(VehiclesStatusConditionsService)
    private readonly vehiclesStatusConditionsService: VehiclesStatusConditionsService,
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

      return this.findOne(savedVehicle.id);
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

  async findOne(id: string) {
    return await this.vehicleRepository.findOne({
      where: { id },
      relations: ['vehiclesField', 'vehiclesMicrotrack']
    });
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    await this.vehiclesStatusConditionsService.checkVehicleExist(id);
    await this.vehicleRepository.update(id, updateVehicleDto);
    return await this.vehicleRepository.findOneBy({ id });
  }

  async desactivate(id: string) {
    const vehicle = await this.vehiclesStatusConditionsService.checkVehicleExist(id);
    if (vehicle.condicion === Conditions.ACTIVO) {
      vehicle.condicion = Conditions.INACTIVO;
    } else {
      throw new HttpException('Vehicle is not active', 400);
    }
    return await this.vehicleRepository.save(vehicle);
  }
}

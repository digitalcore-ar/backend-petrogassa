import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehicleDto } from '../dto/create-vehicle-admin.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle-admin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private vehicleRepository: Repository<Vehicle>,
  ) { }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return await this.vehicleRepository.save(vehicle);
  }

  async findAll() {
    const vehicles = await this.vehicleRepository.find();
    if (vehicles.length === 0) {
      return {
        message: 'No se encontraron vehículos',
        vehicles: []
      };
    }
    return vehicles;
  }

  findOne(id: string) {
    return `This action returns a #${id} vehicle`;
  }

  update(id: number, updateVehicleDto: UpdateVehicleDto) {
    return `This action updates a #${id} vehicle`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicle`;
  }
}

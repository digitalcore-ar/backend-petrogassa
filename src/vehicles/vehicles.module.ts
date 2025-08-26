import { Module } from '@nestjs/common';
import { VehiclesService } from './services/vehicles-admin.service';
import { VehiclesController } from './controllers/vehicles-admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    CommonModule
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule { }

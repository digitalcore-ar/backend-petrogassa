import { Module } from '@nestjs/common';
import { VehiclesService } from './services/vehicles-admin.service';
import { VehiclesController } from './controllers/vehicles-admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle-core.entity';
import { CommonModule } from '../common/common.module';
import { VehiclesStatusConditionsService } from './services/vehicles-status-conditions.service';
import { VehicleFieldController } from './controllers/vehicle-fields.controller';
import { VehiclesFieldService } from './services/vehicles-fields.service';
import { VehiclesField } from './entities/vehicles-field.entity';
import { VehiclesSales } from './entities/vehicle-sale.entity';
import { VehiclesMicrotrack } from './entities/vehicle-microtrack.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehiclesField, VehiclesSales, VehiclesMicrotrack]),
    CommonModule
  ],
  controllers: [
    VehiclesController,
    VehicleFieldController
  ],
  providers: [
    VehiclesService,
    VehiclesStatusConditionsService,
    VehiclesFieldService
  ],
})
export class VehiclesModule { }

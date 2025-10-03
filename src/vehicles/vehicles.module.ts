import { Module } from '@nestjs/common';
import { VehiclesAdminService } from './services/vehicles-admin.service';
import { VehiclesController } from './controllers/vehicles-admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle-core.entity';
import { CommonModule } from '../common/common.module';
import { VehiclesStatusConditionsService } from './services/vehicles-status-conditions.service';
import { VehiclesFieldController } from './controllers/vehicles-field.controller';
import { VehiclesFieldService } from './services/vehicles-field.service';
import { VehiclesField } from './entities/vehicles-field.entity';
import { VehiclesSales } from './entities/vehicle-sale.entity';
import { VehiclesMicrotrack } from './entities/vehicle-microtrack.entity';
import { VehiclesMicrotrackController } from './controllers/vehicles-microtrack.controller';
import { VehiclesMicrotrackService } from './services/vehicles-microtrack.service';
import { VehiclesSaleController } from './controllers/vehicles-sale.controller';
import { VehiclesSaleService } from './services/vehicles-sale.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehiclesField, VehiclesSales, VehiclesMicrotrack]),
    CommonModule
  ],
  controllers: [
    VehiclesController,
    VehiclesFieldController,
    VehiclesMicrotrackController,
    VehiclesSaleController
  ],
  providers: [
    VehiclesAdminService,
    VehiclesStatusConditionsService,
    VehiclesFieldService,
    VehiclesMicrotrackService,
    VehiclesSaleService
  ],
})
export class VehiclesModule { }

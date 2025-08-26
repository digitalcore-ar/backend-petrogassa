import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicle-admin.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}

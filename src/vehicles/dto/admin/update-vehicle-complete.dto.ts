import { PartialType } from '@nestjs/mapped-types';
import { CreateCompleteVehicleDto } from './create-vehicle-complete.dto';

export class UpdateCompleteVehicleDto extends PartialType(CreateCompleteVehicleDto) {}

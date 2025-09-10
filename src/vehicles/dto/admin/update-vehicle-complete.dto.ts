import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateVehicleDto } from './partial types/update-vehicle-admin.dto';
import { CreateVehicleAdminSalesDto } from './partial types/create-vehicle-admin-sales.dto';
import { CreateVehicleAdminFieldDto } from './partial types/create-vehicle-admin-field.dto';
import { CreateVehicleAdminMicrotrackDto } from './partial types/create-vehicle-admin-microtrack.dto';

export class UpdateCompleteVehicleDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateVehicleDto)
    vehicle?: UpdateVehicleDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateVehicleAdminFieldDto)
    field?: CreateVehicleAdminFieldDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateVehicleAdminMicrotrackDto)
    microtrack?: CreateVehicleAdminMicrotrackDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateVehicleAdminSalesDto)
    sale?: CreateVehicleAdminSalesDto;
}

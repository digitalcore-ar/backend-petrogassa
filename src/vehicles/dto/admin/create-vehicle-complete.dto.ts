import { Type } from "class-transformer";
import { IsOptional, ValidateNested } from "class-validator";
import { CreateVehicleDto } from "./partial types/create-vehicle-admin.dto";
import { CreateVehicleFieldAdminDto } from "./partial types/create-vehicle-admin-field.dto";
import { CreateVehicleAdminMicrotrackDto } from "./partial types/create-vehicle-admin-microtrack.dto";
import { CreateVehicleAdminSalesDto } from "./partial types/create-vehicle-admin-sales.dto";

export class CreateCompleteVehicleDto {
  // Datos del vehículo principal
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleDto)
  vehicle: CreateVehicleDto;

  // Datos de campo (opcional)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleFieldAdminDto)
  field?: CreateVehicleFieldAdminDto;

  // Datos de microtrack (opcional)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleAdminMicrotrackDto)
  microtrack?: CreateVehicleAdminMicrotrackDto;

  // Datos de venta (opcional)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleAdminSalesDto)
  sale?: CreateVehicleAdminSalesDto;
}
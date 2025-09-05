import { Type } from "class-transformer";
import { IsOptional, ValidateNested } from "class-validator";
import { CreateVehicleDto } from "./create-vehicle-admin.dto";
import { CreateVehicleSaleDto } from "../sales/create-vehicle-sale.dto";
import { CreateVehicleFieldDto } from "../field/create-vehicle-field.dto";
import { CreateVehicleMicrotrackDto } from "../microtrack/create-vehicle-microtrack.dto";

export class CreateCompleteVehicleDto {
  // Datos del vehículo principal
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleDto)
  vehicle: CreateVehicleDto;

  // Datos de campo (opcional)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleFieldDto)
  field?: CreateVehicleFieldDto;

  // Datos de microtrack (opcional)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleMicrotrackDto)
  microtrack?: CreateVehicleMicrotrackDto;

  // Datos de venta (opcional)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleSaleDto)
  sale?: CreateVehicleSaleDto;
}
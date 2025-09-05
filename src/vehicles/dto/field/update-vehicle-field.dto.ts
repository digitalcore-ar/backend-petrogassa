import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleFieldDto } from "./field/create-vehicle-field.dto";

export class UpdateVehicleFieldDto extends PartialType(CreateVehicleFieldDto) { }
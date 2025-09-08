import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleSaleDto } from "./create-vehicle-sale.dto";

export class UpdateVehicleSaleDto extends PartialType(CreateVehicleSaleDto) { }
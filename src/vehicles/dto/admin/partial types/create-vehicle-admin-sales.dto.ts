import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleSaleDto } from "../../sales/create-vehicle-sale.dto";

export class CreateVehicleAdminSalesDto extends PartialType(CreateVehicleSaleDto) { }
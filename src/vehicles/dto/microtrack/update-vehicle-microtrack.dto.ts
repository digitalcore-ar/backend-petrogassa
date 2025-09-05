import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleMicrotrackDto } from "./create-vehicle-microtrack.dto";

export class UpdateVehicleMicrotrackDto extends PartialType(CreateVehicleMicrotrackDto) {}
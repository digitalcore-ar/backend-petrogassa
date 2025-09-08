import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleMicrotrackDto } from "../../microtrack/create-vehicle-microtrack.dto";

export class CreateVehicleAdminMicrotrackDto extends PartialType(CreateVehicleMicrotrackDto) { }
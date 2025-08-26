import { IsDate, IsEnum, IsOptional, IsString } from "class-validator";
import { Contracts, Operators, Zones } from "src/common/enums";
import { VehicularFunctions } from "../enums";

export class UpdateVehicleCampoDto {
    @IsOptional()
    @IsEnum(Operators)
    operadora?: Operators;

    @IsOptional()
    @IsEnum(Zones)
    area?: Zones;

    @IsOptional()
    @IsEnum(Contracts)
    contrato?: Contracts;

    @IsOptional()
    @IsEnum(VehicularFunctions)
    funcion?: VehicularFunctions;

    @IsOptional()
    @IsString()
    nro_hab_vtv?: string;

    @IsOptional()
    @IsDate()
    fecha_inicio_vtv?: Date;

    @IsOptional()
    @IsDate()
    vto_vtv?: Date;
}
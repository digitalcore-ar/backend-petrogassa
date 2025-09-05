import { IsArray, IsDate, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Contracts, Operators, Zones } from "src/common/enums";
import { VehicularFunctions } from "../../enums";

export class CreateVehicleFieldDto {

    @IsNotEmpty()
    @IsEnum(Operators)
    operadora?: Operators;

    @IsNotEmpty()
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
    nroHabVTV?: string;

    @IsOptional()
    @IsDate()
    fechaInicioVTV?: Date;

    @IsOptional()
    @IsDate()
    vtoVTV?: Date;

    @IsOptional()
    @IsString()
    equipoRadio: string;

    @IsOptional()
    @IsDate()
    vtoCertificacion: Date;

    @IsOptional()
    @IsEnum(Operators)
    propietarioRadio: Operators;

    @IsOptional()
    @IsString()
    nroSerieRadio: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @IsEmail({}, { each: true })
    correosAviso: string[];

    @IsOptional()
    @IsString()
    chofer: string;

    @IsOptional()
    @IsString()
    nroCelularChofer: string;
}
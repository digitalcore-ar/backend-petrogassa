import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { Cities } from '../../../common/enums';
import { VehicleBrands, Insurances, VehiclesTypes } from '../../enums';
import { Transform } from 'class-transformer';

export class CreateVehicleDto {
    //admin
    @IsNotEmpty()
    @IsString()
    @MaxLength(10)
    @Transform(({ value }) => value.toUpperCase())
    patente: string;

    // @IsOptional()
    // @IsEnum(Conditions)
    // condicion: Conditions;

    // @IsOptional()
    // @IsEnum(Status)
    // estado?: Status;

    @IsNotEmpty()
    @IsEnum(VehiclesTypes)
    tipo: VehiclesTypes;

    @ValidateIf(obj => obj.tipo !== VehiclesTypes.TRAILER && obj.tipo !== VehiclesTypes.PORTACONTENEDOR)
    @IsNotEmpty()
    @IsEnum(VehicleBrands)
    marca?: VehicleBrands;

    @ValidateIf(obj => obj.tipo !== VehiclesTypes.TRAILER && obj.tipo !== VehiclesTypes.PORTACONTENEDOR)
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    @Transform(({ value }) => value.toUpperCase())
    modelo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(6)
    asientos?: string;

    @IsOptional()
    @IsDate()
    @MaxLength(6)
    carga?: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsNumber()
    anio?: number;

    @IsNotEmpty()
    @IsString()
    @MaxLength(40)
    @Transform(({ value }) => value.toUpperCase())
    titular: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsEnum(Cities)
    patenteDe?: Cities;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsDate()
    vtoPatente?: Date;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsEnum(Insurances)
    aseguradora?: Insurances;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsString()
    @MaxLength(25)
    nroPoliza?: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsString()
    @MaxLength(25)
    refPoliza?: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsDate()
    vtoSeguro?: Date;

    //en caso de que el tipo de vehiculo sea hidro
    @ValidateIf(obj => obj.tipo === VehiclesTypes.HIDROGRUA)
    @IsNotEmpty()
    @IsDate()
    vtoInspeccionGrua?: Date;

    @ValidateIf(obj => obj.tipo === VehiclesTypes.HIDROGRUA)
    @IsNotEmpty()
    @IsString()
    seguroTecnico?: string;

    @ValidateIf(obj => obj.tipo === VehiclesTypes.HIDROGRUA)
    @IsNotEmpty()
    @IsString()
    rc?: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    nroChasis?: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    nroMotor?: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsDate()
    fechaInscripcion?: Date;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsEnum(Cities)
    lugarInscripcion?: Cities;

    @IsOptional()
    @IsNumber()
    antiguedad?: number;

    @IsOptional()
    @IsString()
    nroFacturaCompra?: string;

    @IsOptional()
    @IsString()
    concesionaria?: string;

    @IsNotEmpty()
    @IsDate()
    fechaIngreso: Date;

    @IsOptional()
    @IsDate()
    fechaDevTitular?: Date;

    @IsOptional()
    @IsString()
    @MaxLength(25)
    telUnidadAlquilada?: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    @MaxLength(25)
    mailUnidadAlquilada?: string;
}

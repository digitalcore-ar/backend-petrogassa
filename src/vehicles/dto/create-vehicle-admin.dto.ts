import { IsBoolean, IsDate, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { Operators, Cities, Zones, Contracts } from '../../common/enums';
import { VehicleBrands, Conditions, Insurances, VehicularFunctions, VehiclesTypes } from '../enums';
import { Transform } from 'class-transformer';

export class CreateVehicleDto {
    //admin
    @IsOptional()
    @IsString()
    @MaxLength(10)
    @Transform(({ value }) => value.toUpperCase())
    patente: string;

    @IsOptional()
    @IsEnum(Conditions)
    condicion: Conditions;

    @IsOptional()
    @IsString()
    observacion?: string;

    @IsNotEmpty()
    @IsEnum(VehiclesTypes)
    tipo: VehiclesTypes;

    @ValidateIf(obj => obj.tipo !== VehiclesTypes.TRAILER && obj.tipo !== VehiclesTypes.PORTACONTENEDOR)
    @IsNotEmpty()
    @IsEnum(VehicleBrands)
    marca: VehicleBrands;

    @ValidateIf(obj => obj.tipo !== VehiclesTypes.TRAILER && obj.tipo !== VehiclesTypes.PORTACONTENEDOR)
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    @Transform(({ value }) => value.toUpperCase())
    modelo: string;

    @IsOptional()
    @IsString()
    @MaxLength(6)
    asientos?: string;

    @IsOptional()
    @IsDate()
    @MaxLength(6)
    carga?: string;

    @IsOptional()
    @IsNumber()
    anio: number;

    @IsNotEmpty()
    @IsString()
    @MaxLength(40)
    @Transform(({ value }) => value.toUpperCase())
    titular: string;

    @IsOptional()
    @IsString()
    @MaxLength(25)
    leasing?: string;

    @IsOptional()
    @IsNotEmpty()
    @IsEnum(Cities)
    patentado_en?: Cities;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsDate()
    vto_patente: Date;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsEnum(Insurances)
    aseguradora: Insurances;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsString()
    @MaxLength(25)
    nro_poliza: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsString()
    @MaxLength(25)
    ref_poliza: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsDate()
    vto_poliza?: Date;

    //en caso de que el tipo de vehiculo sea hidro
    @ValidateIf(obj => obj.tipo === VehiclesTypes.HIDROGRUA)
    @IsNotEmpty()
    @IsDate()
    vto_inspec_grua?: Date;

    @ValidateIf(obj => obj.tipo === VehiclesTypes.HIDROGRUA)
    @IsNotEmpty()
    @IsString()
    seguro_tecnico: string;

    @ValidateIf(obj => obj.tipo === VehiclesTypes.HIDROGRUA)
    @IsNotEmpty()
    @IsString()
    rc: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    nro_chasis: string;

    @ValidateIf(obj => ![VehiclesTypes.TRAILER, VehiclesTypes.PORTACONTENEDOR].includes(obj.tipo))
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    nro_motor: string;

    @IsOptional()
    @IsDate()
    fecha_inscripcion?: Date;

    @IsNotEmpty()
    @IsEnum(Cities)
    lugar_inscripcion: Cities;

    @IsNotEmpty()
    @IsDate()
    fecha_ingreso: Date;

    @IsOptional()
    @IsString()
    @MaxLength(25)
    tel_unidad_alquilada?: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    @MaxLength(25)
    mail_unidad_alquilada?: string;

    //Agustin
    @IsOptional()
    @IsDate()
    fecha_alta_ruta?: Date;

    @IsOptional()
    @IsString()
    @MaxLength(25)
    nro_ruta?: string;

    @IsOptional()
    @IsBoolean()
    microtrack?: boolean;

    @IsOptional()
    @IsBoolean()
    yer_estado?: boolean;

    @IsOptional()
    @IsBoolean()
    yer_tarjeta?: boolean;

    //Campo
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

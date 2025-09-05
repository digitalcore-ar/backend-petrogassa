import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { Cities } from "../../common/enums";

export class CreateVehicleSaleDto {

    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    nombreComprador: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    apellidoComprador: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    cuilCUITcomprador: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    direccionComprador: string;

    @IsNotEmpty()
    @IsEnum(Cities)
    ciudad: Cities;

    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    provincia: string;

    @IsNotEmpty()
    @IsDate()
    fechaVenta: Date;

    @IsNotEmpty()
    @IsDate()
    fechaEntrega: Date;

    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    telefonoComprador: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    emailComprador?: string;

    @IsOptional()
    @IsDate()
    fechaDenunciaVenta?: Date;

    @IsOptional()
    @IsDate()
    transferenciaFecha?: Date;

    @IsOptional()
    @IsDate()
    fechaBajaSeguro?: Date;

    @IsOptional()
    @IsDate()
    fechaBajaPatente?: Date;
}
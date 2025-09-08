import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateVehicleMicrotrackDto {
    @IsOptional()
    @IsDate()
    fechaAltaRuta?: Date;

    @IsOptional()
    @IsDate()
    fechaBajaRuta?: Date;

    @IsOptional()
    @IsString()
    @MaxLength(25)
    numRuta?: string;

    @IsNotEmpty()
    @IsBoolean()
    microtrack: boolean;

    @IsNotEmpty()
    @IsBoolean()
    YERestado: boolean;

    @IsNotEmpty()
    @IsBoolean()
    YERtarjeta: boolean;
}
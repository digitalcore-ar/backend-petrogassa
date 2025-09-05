import { IsBoolean, IsDate, IsOptional, IsString, MaxLength } from "class-validator";

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

    @IsOptional()
    @IsBoolean()
    microtrack?: boolean;

    @IsOptional()
    @IsBoolean()
    YERestado?: boolean;

    @IsOptional()
    @IsBoolean()
    YERtarjeta?: boolean;
}
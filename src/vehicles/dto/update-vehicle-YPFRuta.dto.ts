import { IsBoolean, IsDate, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateVehicleYPFRutaDto {
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
}
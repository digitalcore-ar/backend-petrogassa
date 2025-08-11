import { IsArray, IsEnum, IsOptional } from "class-validator";
import { PermissionsTypes } from "../enums/permissions.enum";

export class UpdatePermissionsDto {
    @IsArray()
    @IsOptional()
    @IsEnum(PermissionsTypes, {
        each: true,
    })
    permissions?: PermissionsTypes[];
}
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { PermissionsTypes } from "../enums/permissions.enum";

export class CreateUserDto {

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/, {
        message: 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;

    @IsArray()
    @IsOptional()
    @IsEnum(PermissionsTypes, {
        each: true,
    })
    permissions?: PermissionsTypes[];
}

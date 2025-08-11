import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UpdateMailDto {
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;
}
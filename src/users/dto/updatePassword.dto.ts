import { IsNotEmpty, IsString, Matches } from "class-validator";

export class UpdatePasswordDto {
    @IsNotEmpty()
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/, {
        message: 'Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;
}
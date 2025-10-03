import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-user.dto';
import { Throttle } from '@nestjs/throttler';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @Throttle({ short: {} })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}

# 🔄 Manual Completo: Refresh Tokens en NestJS

## 📋 Índice

1. [¿Qué son los Refresh Tokens?](#qué-son-los-refresh-tokens)
2. [¿Por qué usar Refresh Tokens?](#por-qué-usar-refresh-tokens)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Implementación Paso a Paso](#implementación-paso-a-paso)
5. [Entidad RefreshToken](#entidad-refreshtoken)
6. [Servicio RefreshToken](#servicio-refreshtoken)
7. [Actualización del AuthService](#actualización-del-authservice)
8. [Endpoints de Autenticación](#endpoints-de-autenticación)
9. [Seguridad y Rotación](#seguridad-y-rotación)
10. [Testing](#testing)
11. [Mejores Prácticas](#mejores-prácticas)
12. [Configuración de Producción](#configuración-de-producción)

---

## 🤔 ¿Qué son los Refresh Tokens?

Los **Refresh Tokens** son credenciales especiales que permiten obtener nuevos **Access Tokens** sin requerir que el usuario vuelva a autenticarse.

### Diferencias Clave:

| Aspecto | Access Token | Refresh Token |
|---------|--------------|---------------|
| **Duración** | Corta (15-30 min) | Larga (7-30 días) |
| **Propósito** | Acceder a recursos | Renovar access tokens |
| **Almacenamiento** | Memoria/localStorage | Base de datos |
| **Revocación** | Automática (expiración) | Manual (logout/compromiso) |
| **Uso** | Cada request a la API | Solo para renovación |

### Flujo Visual:
```
1. Login → Access Token (30min) + Refresh Token (7 días)
2. API Calls → Usar Access Token
3. Token Expira → Usar Refresh Token para obtener nuevo Access Token
4. Logout → Revocar Refresh Token
```

---

## 🎯 ¿Por qué usar Refresh Tokens?

### 🔒 **Seguridad Mejorada**
- **Tokens de corta duración**: Menor ventana de exposición si se compromete
- **Revocación granular**: Posibilidad de invalidar sesiones específicas
- **Detección de ataques**: Identificar uso malicioso de tokens

### 👤 **Mejor Experiencia de Usuario**
- **Sesiones persistentes**: Usuario no necesita re-autenticarse constantemente
- **Renovación transparente**: Tokens se renuevan automáticamente
- **Múltiples dispositivos**: Gestión independiente de sesiones

### 🛡️ **Control de Acceso**
- **Logout remoto**: Cerrar sesiones desde otros dispositivos
- **Gestión de dispositivos**: Ver y controlar sesiones activas
- **Políticas de seguridad**: Aplicar reglas de expiración personalizadas

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales:

```typescript
// Estructura del sistema
AuthModule
├── AuthController     // Endpoints de autenticación
├── AuthService       // Lógica de autenticación
├── RefreshTokenService // Gestión de refresh tokens
├── JwtStrategy       // Validación de access tokens
└── RefreshToken      // Entidad de base de datos

User
├── id: string
├── email: string
├── password: string
└── refreshTokens: RefreshToken[]

RefreshToken
├── id: string
├── token: string (hasheado)
├── userId: string
├── expiresAt: Date
├── isRevoked: boolean
├── deviceInfo: string
└── createdAt: Date
```

### Flujo de Datos:

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as AuthController
    participant S as AuthService
    participant R as RefreshTokenService
    participant D as Database
    
    C->>A: POST /auth/login
    A->>S: login(credentials)
    S->>R: generateRefreshToken(user)
    R->>D: save(refreshToken)
    S-->>A: { accessToken, refreshToken }
    A-->>C: Tokens + User Info
    
    Note over C: Access Token expira
    
    C->>A: POST /auth/refresh
    A->>R: refreshAccessToken(token)
    R->>D: validate & revoke old token
    R->>D: save new token
    R-->>A: { accessToken, refreshToken }
    A-->>C: Nuevos Tokens
```

---

## 🚀 Implementación Paso a Paso

### 1. Instalación de Dependencias

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt uuid
npm install -D @types/bcrypt @types/passport-jwt
```

### 2. Variables de Entorno

```env
# .env
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRES_IN=7d
```

### 3. Configuración del Módulo JWT

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
```

---

## 🗄️ Entidad RefreshToken

```typescript
// entities/refresh-token.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
@Index(['userId', 'isRevoked']) // Índice para consultas eficientes
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  @Index() // Índice para búsquedas rápidas por token
  tokenHash: string; // Token hasheado por seguridad

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE', // Eliminar tokens si se elimina el usuario
  })
  user: User;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  @Index() // Índice para filtrar tokens activos
  isRevoked: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deviceInfo: string; // Info del dispositivo/navegador

  @Column({ type: 'inet', nullable: true })
  ipAddress: string; // IP desde donde se creó

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date; // Última vez que se usó

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método helper para verificar si el token está expirado
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Método helper para verificar si el token es válido
  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }
}
```

### Actualización de la Entidad User

```typescript
// entities/user.entity.ts
import { OneToMany } from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity('users')
export class User {
  // ... otras propiedades

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    cascade: true, // Eliminar tokens al eliminar usuario
  })
  refreshTokens: RefreshToken[];
}
```

---

## 🔧 Servicio RefreshToken

```typescript
// services/refresh-token.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private configService: ConfigService,
  ) {}

  /**
   * Genera un nuevo refresh token para un usuario
   */
  async generateRefreshToken(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ token: string; entity: RefreshToken }> {
    // Generar token único
    const token = uuidv4() + '.' + uuidv4(); // Token más largo y único
    
    // Hashear el token antes de guardarlo
    const tokenHash = await bcrypt.hash(token, 10);
    
    // Calcular fecha de expiración
    const expiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpirationDate(expiresIn);
    
    // Crear entidad
    const refreshTokenEntity = this.refreshTokenRepository.create({
      tokenHash,
      userId: user.id,
      user,
      expiresAt,
      deviceInfo: deviceInfo || 'Unknown Device',
      ipAddress,
      lastUsedAt: new Date(),
    });
    
    // Guardar en base de datos
    await this.refreshTokenRepository.save(refreshTokenEntity);
    
    return {
      token, // Retornar token sin hashear
      entity: refreshTokenEntity,
    };
  }

  /**
   * Valida un refresh token
   */
  async validateRefreshToken(token: string): Promise<RefreshToken> {
    if (!token) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    // Buscar todos los tokens no revocados del usuario
    const refreshTokens = await this.refreshTokenRepository.find({
      where: {
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    // Verificar el token contra todos los hashes
    for (const refreshTokenEntity of refreshTokens) {
      const isValidToken = await bcrypt.compare(token, refreshTokenEntity.tokenHash);
      
      if (isValidToken) {
        // Actualizar última vez usado
        refreshTokenEntity.lastUsedAt = new Date();
        await this.refreshTokenRepository.save(refreshTokenEntity);
        
        return refreshTokenEntity;
      }
    }

    throw new UnauthorizedException('Refresh token inválido o expirado');
  }

  /**
   * Revoca un refresh token específico
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    const result = await this.refreshTokenRepository.update(
      { id: tokenId },
      { isRevoked: true },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Refresh token no encontrado');
    }
  }

  /**
   * Revoca todos los refresh tokens de un usuario
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  /**
   * Renueva un access token usando un refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // 1. Validar refresh token actual
    const tokenEntity = await this.validateRefreshToken(refreshToken);
    
    // 2. Verificar si el token fue comprometido (reutilización)
    if (tokenEntity.isRevoked) {
      // Token ya fue usado - posible ataque
      await this.revokeAllUserTokens(tokenEntity.userId);
      throw new UnauthorizedException(
        'Token comprometido. Todas las sesiones han sido revocadas.',
      );
    }
    
    // 3. Revocar token actual (rotación)
    await this.revokeRefreshToken(tokenEntity.id);
    
    // 4. Generar nuevo refresh token
    const { token: newRefreshToken } = await this.generateRefreshToken(
      tokenEntity.user,
      deviceInfo,
      ipAddress,
    );
    
    // 5. Generar nuevo access token
    const newAccessToken = await this.generateAccessToken(tokenEntity.user);
    
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: tokenEntity.user,
    };
  }

  /**
   * Obtiene todos los refresh tokens activos de un usuario
   */
  async getUserActiveTokens(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      order: {
        lastUsedAt: 'DESC',
      },
    });
  }

  /**
   * Limpia tokens expirados (para tarea programada)
   */
  async cleanExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: MoreThan(new Date()),
    });
    
    return result.affected || 0;
  }

  /**
   * Genera un access token JWT
   */
  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      permissions: user.permissions || [],
    };
    
    // Aquí deberías inyectar JwtService
    // return this.jwtService.sign(payload);
    return 'access_token_placeholder'; // Placeholder
  }

  /**
   * Calcula fecha de expiración basada en string de duración
   */
  private calculateExpirationDate(duration: string): Date {
    const now = new Date();
    
    // Parsear duración (ej: '7d', '24h', '30m')
    const match = duration.match(/^(\d+)([dhm])$/);
    if (!match) {
      throw new Error(`Formato de duración inválido: ${duration}`);
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'd': // días
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h': // horas
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm': // minutos
        return new Date(now.getTime() + value * 60 * 1000);
      default:
        throw new Error(`Unidad de tiempo no soportada: ${unit}`);
    }
  }
}
```

---

## 🔐 Actualización del AuthService

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RefreshTokenService } from './refresh-token.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * Autenticación de usuario con email y password
   */
  async login(
    loginDto: LoginDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    // 1. Validar credenciales
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Generar access token
    const accessToken = await this.generateAccessToken(user);
    
    // 3. Generar refresh token
    const { token: refreshToken } = await this.refreshTokenService.generateRefreshToken(
      user,
      deviceInfo,
      ipAddress,
    );

    // 4. Retornar tokens y datos del usuario (sin password)
    const { password, ...userWithoutPassword } = user;
    
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  /**
   * Renovar access token usando refresh token
   */
  async refresh(
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    const result = await this.refreshTokenService.refreshAccessToken(
      refreshToken,
      deviceInfo,
      ipAddress,
    );
    
    const { password, ...userWithoutPassword } = result.user;
    
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: userWithoutPassword,
    };
  }

  /**
   * Cerrar sesión (revocar refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenEntity = await this.refreshTokenService.validateRefreshToken(refreshToken);
    await this.refreshTokenService.revokeRefreshToken(tokenEntity.id);
  }

  /**
   * Cerrar todas las sesiones de un usuario
   */
  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  /**
   * Verificar estado de autenticación (renovar si es necesario)
   */
  async checkAuthStatus(
    user: User,
  ): Promise<{
    accessToken: string;
    user: Partial<User>;
  }> {
    // Generar nuevo access token
    const accessToken = await this.generateAccessToken(user);
    
    const { password, ...userWithoutPassword } = user;
    
    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  /**
   * Obtener sesiones activas de un usuario
   */
  async getActiveSessions(userId: string) {
    const tokens = await this.refreshTokenService.getUserActiveTokens(userId);
    
    return tokens.map(token => ({
      id: token.id,
      deviceInfo: token.deviceInfo,
      ipAddress: token.ipAddress,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
    }));
  }

  /**
   * Revocar una sesión específica
   */
  async revokeSession(userId: string, tokenId: string): Promise<void> {
    // Verificar que el token pertenece al usuario
    const tokens = await this.refreshTokenService.getUserActiveTokens(userId);
    const tokenExists = tokens.some(token => token.id === tokenId);
    
    if (!tokenExists) {
      throw new UnauthorizedException('Token no encontrado o no autorizado');
    }
    
    await this.refreshTokenService.revokeRefreshToken(tokenId);
  }

  /**
   * Validar credenciales de usuario
   */
  private async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    
    return null;
  }

  /**
   * Generar access token JWT
   */
  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      permissions: user.permissions || [],
      iat: Math.floor(Date.now() / 1000), // Issued at
    };
    
    return this.jwtService.sign(payload);
  }
}
```

---

## 🌐 Endpoints de Autenticación

### DTOs

```typescript
// dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email debe ser válido' })
  email: string;

  @IsString({ message: 'Password debe ser un string' })
  @MinLength(6, { message: 'Password debe tener al menos 6 caracteres' })
  password: string;
}

// dto/refresh-token.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token debe ser un string' })
  @IsNotEmpty({ message: 'Refresh token es requerido' })
  refreshToken: string;
}
```

### Controlador Actualizado

```typescript
// auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login - Autenticación inicial
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ) {
    const deviceInfo = this.extractDeviceInfo(request);
    const ipAddress = this.extractIpAddress(request);
    
    return this.authService.login(loginDto, deviceInfo, ipAddress);
  }

  /**
   * Refresh - Renovar access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
  ) {
    const deviceInfo = this.extractDeviceInfo(request);
    const ipAddress = this.extractIpAddress(request);
    
    return this.authService.refresh(
      refreshTokenDto.refreshToken,
      deviceInfo,
      ipAddress,
    );
  }

  /**
   * Logout - Cerrar sesión actual
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Logout All - Cerrar todas las sesiones
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@GetUser() user: User) {
    await this.authService.logoutAll(user.id);
    return { message: 'Todas las sesiones han sido cerradas' };
  }

  /**
   * Check Status - Verificar estado de autenticación
   */
  @Get('check-status')
  @UseGuards(JwtAuthGuard)
  async checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  /**
   * Sessions - Obtener sesiones activas
   */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getActiveSessions(@GetUser() user: User) {
    const sessions = await this.authService.getActiveSessions(user.id);
    return {
      sessions,
      total: sessions.length,
    };
  }

  /**
   * Revoke Session - Revocar sesión específica
   */
  @Delete('sessions/:tokenId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @GetUser() user: User,
    @Param('tokenId') tokenId: string,
  ) {
    await this.authService.revokeSession(user.id, tokenId);
    return { message: 'Sesión revocada exitosamente' };
  }

  /**
   * Extraer información del dispositivo
   */
  private extractDeviceInfo(request: Request): string {
    const userAgent = request.headers['user-agent'] || 'Unknown';
    
    // Parsear user agent para obtener info del dispositivo
    if (userAgent.includes('Mobile')) {
      return 'Mobile Device';
    } else if (userAgent.includes('Chrome')) {
      return 'Chrome Browser';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox Browser';
    } else if (userAgent.includes('Safari')) {
      return 'Safari Browser';
    }
    
    return userAgent.substring(0, 100); // Limitar longitud
  }

  /**
   * Extraer dirección IP
   */
  private extractIpAddress(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.ip ||
      'Unknown'
    ) as string;
  }
}
```

---

## 🔒 Seguridad y Rotación

### 1. Detección de Reutilización de Tokens

```typescript
// services/security.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  
  constructor(
    private refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * Detectar uso sospechoso de tokens
   */
  async detectSuspiciousActivity(
    userId: string,
    ipAddress: string,
    deviceInfo: string,
  ): Promise<boolean> {
    const activeTokens = await this.refreshTokenService.getUserActiveTokens(userId);
    
    // Verificar múltiples dispositivos desde IPs muy diferentes
    const uniqueIPs = new Set(activeTokens.map(token => token.ipAddress));
    const uniqueDevices = new Set(activeTokens.map(token => token.deviceInfo));
    
    if (uniqueIPs.size > 5 || uniqueDevices.size > 10) {
      this.logger.warn(`Actividad sospechosa detectada para usuario ${userId}`, {
        uniqueIPs: uniqueIPs.size,
        uniqueDevices: uniqueDevices.size,
        currentIP: ipAddress,
        currentDevice: deviceInfo,
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Notificar al usuario sobre nueva sesión
   */
  async notifyNewSession(
    user: any,
    deviceInfo: string,
    ipAddress: string,
  ): Promise<void> {
    // Aquí implementarías notificación por email
    this.logger.log(`Nueva sesión para ${user.email} desde ${ipAddress}`);
    
    // Ejemplo de notificación
    // await this.emailService.sendNewSessionAlert(user.email, {
    //   deviceInfo,
    //   ipAddress,
    //   timestamp: new Date(),
    // });
  }
}
```

### 2. Rotación Automática de Tokens

```typescript
// services/token-rotation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class TokenRotationService {
  private readonly logger = new Logger(TokenRotationService.name);
  
  constructor(
    private refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * Limpiar tokens expirados cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const deletedCount = await this.refreshTokenService.cleanExpiredTokens();
      
      if (deletedCount > 0) {
        this.logger.log(`Limpieza completada: ${deletedCount} tokens expirados eliminados`);
      }
    } catch (error) {
      this.logger.error('Error durante limpieza de tokens', error);
    }
  }

  /**
   * Rotar tokens que están cerca de expirar
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async rotateNearExpiryTokens(): Promise<void> {
    try {
      // Implementar lógica para rotar tokens que expiran pronto
      this.logger.log('Verificando tokens próximos a expirar...');
      
      // Esta funcionalidad se puede implementar según necesidades específicas
    } catch (error) {
      this.logger.error('Error durante rotación de tokens', error);
    }
  }
}
```

### 3. Configuración de Seguridad

```typescript
// config/security.config.ts
export const SecurityConfig = {
  // Configuración de tokens
  accessToken: {
    expiresIn: '30m', // 30 minutos
    algorithm: 'HS256',
  },
  
  refreshToken: {
    expiresIn: '7d', // 7 días
    maxActiveTokens: 5, // Máximo 5 sesiones activas por usuario
    rotateOnUse: true, // Rotar en cada uso
  },
  
  // Límites de seguridad
  limits: {
    maxDevicesPerUser: 10,
    maxIPsPerUser: 5,
    suspiciousActivityThreshold: 3,
  },
  
  // Configuración de notificaciones
  notifications: {
    newSessionAlert: true,
    suspiciousActivityAlert: true,
    tokenExpiryWarning: true,
  },
};
```

---

## 🧪 Testing

### 1. Tests Unitarios del RefreshTokenService

```typescript
// refresh-token.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let repository: Repository<RefreshToken>;
  let configService: ConfigService;
  
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword',
    refreshTokens: [],
  } as User;
  
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  const mockConfigService = {
    get: jest.fn(),
  };
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
    
    service = module.get<RefreshTokenService>(RefreshTokenService);
    repository = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    configService = module.get<ConfigService>(ConfigService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('generateRefreshToken', () => {
    it('should generate a refresh token successfully', async () => {
      // Arrange
      mockConfigService.get.mockReturnValue('7d');
      const mockRefreshToken = {
        id: 'token-id',
        tokenHash: 'hashed-token',
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
      };
      
      mockRepository.create.mockReturnValue(mockRefreshToken);
      mockRepository.save.mockResolvedValue(mockRefreshToken);
      
      // Act
      const result = await service.generateRefreshToken(mockUser, 'Chrome', '192.168.1.1');
      
      // Assert
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('entity');
      expect(result.token).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
  
  describe('validateRefreshToken', () => {
    it('should validate a correct refresh token', async () => {
      // Arrange
      const token = 'valid-token';
      const hashedToken = await bcrypt.hash(token, 10);
      
      const mockRefreshToken = {
        id: 'token-id',
        tokenHash: hashedToken,
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        lastUsedAt: new Date(),
      };
      
      mockRepository.find.mockResolvedValue([mockRefreshToken]);
      mockRepository.save.mockResolvedValue(mockRefreshToken);
      
      // Act
      const result = await service.validateRefreshToken(token);
      
      // Assert
      expect(result).toEqual(mockRefreshToken);
      expect(mockRepository.save).toHaveBeenCalled(); // Para actualizar lastUsedAt
    });
    
    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);
      
      // Act & Assert
      await expect(service.validateRefreshToken('invalid-token'))
        .rejects
        .toThrow('Refresh token inválido o expirado');
    });
  });
  
  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token successfully', async () => {
      // Arrange
      const tokenId = 'token-id';
      mockRepository.update.mockResolvedValue({ affected: 1 });
      
      // Act
      await service.revokeRefreshToken(tokenId);
      
      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: tokenId },
        { isRevoked: true },
      );
    });
    
    it('should throw NotFoundException if token not found', async () => {
      // Arrange
      mockRepository.update.mockResolvedValue({ affected: 0 });
      
      // Act & Assert
      await expect(service.revokeRefreshToken('non-existent-id'))
        .rejects
        .toThrow('Refresh token no encontrado');
    });
  });
});
```

### 2. Tests de Integración E2E

```typescript
// auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { RefreshToken } from '../src/auth/entities/refresh-token.entity';

describe('Auth with Refresh Tokens (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let refreshTokenRepository: Repository<RefreshToken>;
  
  let testUser: User;
  let accessToken: string;
  let refreshToken: string;
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    refreshTokenRepository = moduleFixture.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
    
    // Crear usuario de prueba
    testUser = await userRepository.save({
      email: 'test@example.com',
      password: '$2b$10$hashedPassword', // Password hasheado
      permissions: ['USER'],
    });
  });
  
  afterEach(async () => {
    // Limpiar datos de prueba
    await refreshTokenRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });
  
  describe('/auth/login (POST)', () => {
    it('should login and return both tokens', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);
      
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
      
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
      
      // Verificar que el refresh token se guardó en la base de datos
      const savedTokens = await refreshTokenRepository.find({
        where: { userId: testUser.id },
      });
      expect(savedTokens).toHaveLength(1);
    });
  });
  
  describe('/auth/refresh (POST)', () => {
    beforeEach(async () => {
      // Login para obtener tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      refreshToken = loginResponse.body.refreshToken;
    });
    
    it('should refresh access token successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      
      // El nuevo refresh token debe ser diferente (rotación)
      expect(response.body.refreshToken).not.toBe(refreshToken);
    });
    
    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
    
    it('should reject reused refresh token', async () => {
      // Usar el refresh token una vez
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      
      // Intentar usar el mismo token otra vez
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
  
  describe('/auth/logout (POST)', () => {
    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      refreshToken = loginResponse.body.refreshToken;
    });
    
    it('should logout successfully', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(200);
      
      // Verificar que el token fue revocado
      const revokedTokens = await refreshTokenRepository.find({
        where: { userId: testUser.id, isRevoked: true },
      });
      expect(revokedTokens).toHaveLength(1);
    });
  });
  
  describe('/auth/sessions (GET)', () => {
    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      accessToken = loginResponse.body.accessToken;
    });
    
    it('should return active sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('total');
      expect(response.body.sessions).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });
  });
});
```

---

## 📈 Mejores Prácticas

### 🔐 Seguridad de Refresh Tokens

1. **Almacenamiento Seguro**
   ```typescript
   // ❌ NUNCA guardar en localStorage
   localStorage.setItem('refreshToken', token);
   
   // ✅ Usar httpOnly cookies
   response.cookie('refreshToken', token, {
     httpOnly: true,
     secure: true, // Solo HTTPS
     sameSite: 'strict',
     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
   });
   ```

2. **Rotación Obligatoria**
   ```typescript
   // ✅ Siempre rotar refresh tokens
   async refreshAccessToken(oldRefreshToken: string) {
     // 1. Validar token actual
     const tokenEntity = await this.validateRefreshToken(oldRefreshToken);
     
     // 2. Revocar token actual
     await this.revokeRefreshToken(tokenEntity.id);
     
     // 3. Generar nuevo token
     const newRefreshToken = await this.generateRefreshToken(tokenEntity.user);
     
     return { accessToken, refreshToken: newRefreshToken };
   }
   ```

3. **Detección de Reutilización**
   ```typescript
   async validateRefreshToken(token: string) {
     const tokenEntity = await this.findRefreshToken(token);
     
     if (tokenEntity.isRevoked) {
       // Token ya fue usado - posible ataque
       await this.revokeAllUserTokens(tokenEntity.userId);
       throw new UnauthorizedException('Token comprometido');
     }
     
     return tokenEntity;
   }
   ```

### ⚡ Optimización de Performance

1. **Índices de Base de Datos**
   ```sql
   -- Índices recomendados
   CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
   CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
   CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
   CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);
   ```

2. **Cache de Tokens Activos**
   ```typescript
   @Injectable()
   export class TokenCacheService {
     constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
     
     async cacheActiveTokens(userId: string, tokens: RefreshToken[]) {
       const key = `user_tokens:${userId}`;
       await this.cacheManager.set(key, tokens, 300); // 5 minutos
     }
     
     async getCachedTokens(userId: string): Promise<RefreshToken[] | null> {
       const key = `user_tokens:${userId}`;
       return this.cacheManager.get(key);
     }
   }
   ```

### 📊 Monitoreo y Métricas

1. **Métricas Importantes**
   ```typescript
   @Injectable()
   export class RefreshTokenMetrics {
     async getMetrics() {
       return {
         activeTokens: await this.countActiveTokens(),
         expiredTokens: await this.countExpiredTokens(),
         revokedTokens: await this.countRevokedTokens(),
         tokenRotations: await this.countTokenRotations(),
         suspiciousActivity: await this.countSuspiciousActivity(),
       };
     }
   }
   ```

2. **Alertas de Seguridad**
   ```typescript
   @Injectable()
   export class SecurityAlerts {
     async checkForAnomalies(userId: string) {
       const tokens = await this.getActiveTokens(userId);
       
       // Múltiples dispositivos
       if (tokens.length > 10) {
         await this.sendAlert('MULTIPLE_DEVICES', { userId, count: tokens.length });
       }
       
       // IPs sospechosas
       const uniqueIPs = new Set(tokens.map(t => t.ipAddress));
       if (uniqueIPs.size > 5) {
         await this.sendAlert('MULTIPLE_IPS', { userId, ips: Array.from(uniqueIPs) });
       }
     }
   }
   ```

---

## 🚀 Configuración de Producción

### Variables de Entorno

```env
# .env.production
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_min_32_chars
JWT_EXPIRES_IN=30m

# Refresh Token Configuration
REFRESH_TOKEN_SECRET=your_refresh_token_secret_different_from_jwt
REFRESH_TOKEN_EXPIRES_IN=7d
MAX_REFRESH_TOKENS_PER_USER=5

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/production_db

# Security
COOKIE_SECRET=your_cookie_secret_for_sessions
CORS_ORIGIN=https://yourdomain.com
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=warn
```

### Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    deploy:
      resources:
        limits:
          memory: 1G

volumes:
  postgres_data:
```

### Configuración de Nginx

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy to NestJS app
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Special handling for auth endpoints
    location /auth/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Additional security for auth
        proxy_hide_header X-Powered-By;
    }
}
```

---

## 📋 Checklist de Implementación

### ✅ Configuración Básica
- [ ] Dependencias instaladas (@nestjs/jwt, bcrypt, uuid)
- [ ] Variables de entorno configuradas
- [ ] Módulo JWT configurado
- [ ] Base de datos configurada

### ✅ Entidades y Servicios
- [ ] Entidad RefreshToken creada
- [ ] Relación User-RefreshToken establecida
- [ ] RefreshTokenService implementado
- [ ] AuthService actualizado

### ✅ Endpoints
- [ ] POST /auth/login implementado
- [ ] POST /auth/refresh implementado
- [ ] POST /auth/logout implementado
- [ ] POST /auth/logout-all implementado
- [ ] GET /auth/sessions implementado
- [ ] DELETE /auth/sessions/:id implementado

### ✅ Seguridad
- [ ] Tokens hasheados en base de datos
- [ ] Rotación automática implementada
- [ ] Detección de reutilización implementada
- [ ] Límite de tokens activos por usuario
- [ ] Información de dispositivo/IP registrada

### ✅ Testing
- [ ] Tests unitarios del RefreshTokenService
- [ ] Tests unitarios del AuthService
- [ ] Tests E2E de endpoints de auth
- [ ] Tests de seguridad (reutilización, expiración)

### ✅ Monitoreo
- [ ] Logging de eventos de seguridad
- [ ] Métricas de tokens activos
- [ ] Alertas de actividad sospechosa
- [ ] Limpieza automática de tokens expirados

### ✅ Producción
- [ ] Variables de entorno seguras
- [ ] Configuración HTTPS
- [ ] Headers de seguridad
- [ ] Backup de base de datos
- [ ] Monitoreo de performance

---

## 🎯 Conclusión

Este manual te proporciona una implementación completa y robusta de **Refresh Tokens en NestJS** que incluye:

### 🔒 **Seguridad Robusta**
- Tokens hasheados y rotación automática
- Detección de ataques de reutilización
- Gestión granular de sesiones por dispositivo

### 👤 **Experiencia de Usuario Mejorada**
- Sesiones persistentes sin re-autenticación
- Renovación transparente de tokens
- Gestión de múltiples dispositivos

### 🛠️ **Flexibilidad y Control**
- Revocación remota de sesiones
- Monitoreo de actividad sospechosa
- Configuración personalizable por entorno

### 📊 **Observabilidad Completa**
- Logging detallado de eventos de seguridad
- Métricas de uso y performance
- Alertas automáticas de anomalías

¡Tu sistema de autenticación ahora está listo para producción con refresh tokens seguros y escalables! 🚀
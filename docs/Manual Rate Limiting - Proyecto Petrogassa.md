# 🛡️ Manual Rate Limiting - Proyecto Petrogassa

## 📋 Índice
1. [Análisis del Proyecto](#análisis-del-proyecto)
2. [Endpoints Sensibles Identificados](#endpoints-sensibles-identificados)
3. [Configuración Básica](#configuración-básica)
4. [Implementación Específica](#implementación-específica)
5. [Testing y Verificación](#testing-y-verificación)
6. [Próximos Pasos](#próximos-pasos)

---

## 🔍 Análisis del Proyecto

### Estado Actual de Seguridad
✅ **Ya implementado:**
- Autenticación con JWT (`@nestjs/jwt`)
- Protección por roles con decorador `@Auth()`
- Guards personalizados para permisos
- Validación de datos con `class-validator`

🔧 **Dependencias ya instaladas:**
- `@nestjs/throttler` (v6.4.0) - ¡Perfecto!
- `@nestjs/config` (v4.0.2) - Para variables de entorno

### ¿Por qué necesitas Rate Limiting?
Aunque ya tienes buena seguridad, el rate limiting añade una **capa adicional** que protege contra:
- **Ataques de fuerza bruta** en el login
- **Spam de creación de usuarios**
- **Sobrecarga del servidor** por requests masivos
- **Costos innecesarios** de base de datos

---

## 🎯 Endpoints Sensibles Identificados

### 🚨 **CRÍTICOS** (Máxima protección)
```typescript
// auth.controller.ts
@Post('login')  // ← MUY VULNERABLE a ataques de fuerza bruta

// users.controller.ts  
@Post()  // ← Crear usuarios sin protección
```

### ⚠️ **IMPORTANTES** (Protección media)
```typescript
// users.controller.ts
@Patch(':id/password')  // ← Cambio de contraseña
@Patch(':id/mail')      // ← Cambio de email
@Delete(':id')          // ← Eliminación de usuarios
```

### 📊 **CONSULTAS** (Protección ligera)
```typescript
// users.controller.ts
@Get()      // ← Listar usuarios
@Get(':id') // ← Ver usuario específico
```

---

## ⚙️ Configuración Básica

### 🤔 **Conceptos Fundamentales Explicados**

#### **¿Qué es `ThrottlerModule.forRoot()`?**

`ThrottlerModule.forRoot()` es el **configurador principal** del sistema de rate limiting. Piénsalo como el "cerebro central" que define las **reglas globales** de tu aplicación.

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',     // 🏷️ NOMBRE de la configuración
    ttl: 1000,         // ⏱️ TIEMPO de ventana (1 segundo)
    limit: 3,          // 🔢 LÍMITE de requests en esa ventana
  },
  {
    name: 'medium',    // 🏷️ Otra configuración
    ttl: 10000,        // ⏱️ 10 segundos
    limit: 20,         // 🔢 20 requests
  }
])
```

#### **¿Qué son esas "instancias" o configuraciones?**

Cada objeto `{}` dentro del array es una **"configuración nombrada"** o **"throttler instance"**:

- **`name`**: Es como el "ID" de esa configuración
- **`ttl`**: Time To Live - cuánto dura la "ventana de tiempo"
- **`limit`**: Cuántos requests se permiten en esa ventana

**Analogía:** Es como tener diferentes "velocímetros" en tu auto:
- 🏃‍♂️ **"short"** = Velocímetro para ciudad (límite bajo, tiempo corto)
- 🚗 **"medium"** = Velocímetro para carretera (límite medio, tiempo medio)
- 🏎️ **"long"** = Velocímetro para autopista (límite alto, tiempo largo)

#### **¿Cuándo usar `@SkipThrottle()`?**

`@SkipThrottle()` se usa cuando quieres **DESACTIVAR** el rate limiting en un endpoint específico:

```typescript
// ❌ Este endpoint NO tendrá rate limiting
@Get('public-info')
@SkipThrottle()  // 🚫 Saltea TODAS las configuraciones
getPublicInfo() {
  return { message: 'Información pública sin límites' };
}

// ❌ Saltear solo una configuración específica
@Get('some-endpoint')
@SkipThrottle({ default: false, short: true })  // Solo saltea 'short'
getSomeData() {
  return 'Este endpoint usa todas las configs EXCEPTO "short"';
}
```

#### **¿Cuándo usar múltiples configuraciones vs @SkipThrottle()?**

**🎯 Usa MÚLTIPLES CONFIGURACIONES cuando:**
- Quieres diferentes límites para diferentes tipos de endpoints
- Necesitas protección a corto Y largo plazo
- Quieres flexibilidad para aplicar reglas específicas

**🚫 Usa @SkipThrottle() cuando:**
- El endpoint es completamente público (ej: información estática)
- Es un endpoint interno/administrativo
- Necesitas desactivar temporalmente el rate limiting

#### **📊 Estrategias de Configuración**

**ESTRATEGIA 1: Configuración Global + Overrides Específicos**
```typescript
// En app.module.ts - Configuración base para TODOS los endpoints
ThrottlerModule.forRoot([
  {
    name: 'default',
    ttl: 60000,    // 1 minuto
    limit: 100,    // 100 requests por minuto (GLOBAL)
  }
])

// En controllers - Solo cambias lo que necesitas
@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } })  // Override: solo 5 para login
login() { /* ... */ }

@Get('users')
// Usa la configuración global (100 requests/minuto)
findAll() { /* ... */ }
```

**ESTRATEGIA 2: Múltiples Configuraciones Nombradas**
```typescript
// En app.module.ts - Diferentes "niveles" de protección
ThrottlerModule.forRoot([
  { name: 'strict', ttl: 60000, limit: 5 },     // Para login, passwords
  { name: 'normal', ttl: 60000, limit: 50 },    // Para operaciones normales
  { name: 'relaxed', ttl: 60000, limit: 200 },  // Para consultas
])

// En controllers - Eliges qué "nivel" usar
@Post('login')
@Throttle({ strict: { limit: 5, ttl: 60000 } })  // Usa config 'strict'
login() { /* ... */ }

@Get('users')
@Throttle({ normal: { limit: 50, ttl: 60000 } })  // Usa config 'normal'
findAll() { /* ... */ }
```

**🎯 Para tu proyecto Petrogassa, recomiendo ESTRATEGIA 1:**
- Más simple de mantener
- Fácil de entender para el equipo
- Configuración global sensata + overrides donde necesites

### 1. Configuración Global en `app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Tu configuración existente...
    ConfigModule.forRoot(),
    
    // 🛡️ CONFIGURACIÓN RATE LIMITING
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 segundo
        limit: 3,     // 3 requests por segundo (global)
      },
      {
        name: 'medium', 
        ttl: 10000,   // 10 segundos
        limit: 20,    // 20 requests por 10 segundos
      },
      {
        name: 'long',
        ttl: 60000,   // 1 minuto
        limit: 100,   // 100 requests por minuto
      }
    ]),
  ],
  providers: [
    // 🔒 ACTIVAR RATE LIMITING GLOBALMENTE
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Tus otros providers...
  ],
})
export class AppModule {}
```

### 2. Variables de Entorno (`.env`)

```env
# Rate Limiting Configuration
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
THROTTLE_LOGIN_LIMIT=5
THROTTLE_CREATE_USER_LIMIT=3
```

---

## 🎯 Implementación Específica

### 1. Protección del Login (MUY RESTRICTIVO)

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 🛡️ 5 intentos por minuto
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

### 2. Ejemplos Prácticos con Múltiples Configuraciones

#### **🎯 Aplicando Configuraciones Específicas**

**❌ INCORRECTO - Reescribiendo configuración:**
```typescript
// ❌ MAL: Estás redefiniendo los valores que ya pusiste en app.module.ts
@Post('login')
@Throttle({ short: { limit: 5, ttl: 60000 } })  // ❌ Duplicando config
login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

**✅ CORRECTO - Usando instancias del app.module.ts:**

Si en tu `app.module.ts` definiste:
```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,     // 1 segundo
    limit: 3,      // 3 requests
  },
  {
    name: 'medium', 
    ttl: 10000,    // 10 segundos
    limit: 20,     // 20 requests
  },
  {
    name: 'long',
    ttl: 60000,    // 1 minuto
    limit: 100,    // 100 requests
  }
])
```

**Entonces en tus controllers usas SOLO el nombre:**
```typescript
// ✅ CORRECTO: Solo especificas QUÉ configuración usar
@Post('login')
@Throttle({ short: {} })  // 🔥 Usa la config 'short' del app.module.ts
login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}

// ✅ CORRECTO: Usa la config 'medium' del app.module.ts
@Get('users')
@Throttle({ medium: {} })  // 🚗 Usa config 'medium'
findAll() {
  return this.usersService.findAll();
}

// ✅ CORRECTO: Usa la config 'long' del app.module.ts
@Get('public-stats')
@Throttle({ long: {} })  // 🏎️ Usa config 'long'
getPublicStats() {
  return this.statsService.getPublicStats();
}

// ✅ CORRECTO: Usar múltiples configuraciones a la vez
@Post('critical-operation')
@Throttle({ short: {}, medium: {} })  // Aplica AMBAS configs
criticalOperation() {
  return this.service.doCriticalStuff();
}
```

**🎯 Solo redefines valores si quieres OVERRIDE específico:**
```typescript
// ✅ Override solo cuando necesites cambiar algo específico
@Post('special-login')
@Throttle({ short: { limit: 1 } })  // Usa config 'short' pero solo 1 request
specialLogin(@Body() loginDto: LoginDto) {
  return this.authService.specialLogin(loginDto);
}
```

#### **📋 Resumen de Sintaxis**

| Sintaxis | Qué hace | Cuándo usar |
|----------|----------|-------------|
| `@Throttle({ short: {} })` | Usa la config 'short' EXACTA del app.module.ts | ✅ **Caso normal** - Quieres usar la configuración tal como la definiste |
| `@Throttle({ short: { limit: 10 } })` | Usa config 'short' pero cambia solo el `limit` | 🔧 **Override parcial** - Quieres cambiar solo un valor |
| `@Throttle({ short: { limit: 5, ttl: 30000 } })` | Redefine completamente la config 'short' | ⚠️ **Override total** - Mejor cambiar en app.module.ts |
| `@Throttle({ short: {}, medium: {} })` | Aplica AMBAS configuraciones | 🛡️ **Protección múltiple** - Endpoints muy críticos |
| `@SkipThrottle()` | NO aplica ninguna configuración | 🚫 **Sin límites** - Endpoints públicos |

#### **🎯 Para tu proyecto Petrogassa:**

```typescript
// ✅ RECOMENDADO: Usar configuraciones tal como las definiste
@Post('login')
@Throttle({ short: {} })  // 3 requests por segundo (del app.module.ts)
login() { /* ... */ }

@Post()
@Throttle({ medium: {} })  // 20 requests por 10 segundos (del app.module.ts)
create() { /* ... */ }

@Get()
@Throttle({ long: {} })  // 100 requests por minuto (del app.module.ts)
findAll() { /* ... */ }
```

#### **🚫 Ejemplos de @SkipThrottle() en tu proyecto**

```typescript
// ❌ Endpoint completamente público - SIN rate limiting
@Get('health')
@SkipThrottle()  // No limits para health check
getHealth() {
  return { status: 'OK', timestamp: new Date() };
}

// ❌ Endpoint interno - SIN rate limiting
@Get('internal/metrics')
@SkipThrottle()  // Para monitoreo interno
@Auth(PermissionsTypes.SUPER_ADMIN)
getInternalMetrics() {
  return this.metricsService.getAll();
}

// 🎯 Saltear solo UNA configuración específica
@Get('users/:id')
@SkipThrottle({ short: true })  // Saltea 'short', pero usa 'medium' y 'long'
@Auth(PermissionsTypes.SUPER_ADMIN, PermissionsTypes.USER)
findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

### 3. Protección de Creación de Usuarios

```typescript
// src/users/users.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMailDto } from './dto/updateMail.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Auth } from 'src/auth/decorators/auth.decorator.ts.decorator';
import { PermissionsTypes } from './enums/permissions.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 🛡️ 3 usuarios por 5 minutos
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 🔍 50 consultas por minuto
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Auth(PermissionsTypes.SUPER_ADMIN, PermissionsTypes.USER)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 🔍 30 consultas por minuto
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/mail')
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 🔄 5 cambios de email por 5 minutos
  updateMail(@Param('id') id: string, @Body() updateMailDto: UpdateMailDto) {
    return this.usersService.updateMail(id, updateMailDto);
  }

  @Patch(':id/password')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 🔐 3 cambios de password por 5 minutos
  updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto) {
    return this.usersService.updatePassword(id, updatePasswordDto);
  }

  @Patch(':id/permissions')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // ⚙️ 10 cambios de permisos por minuto
  updatePermissions(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updatePermissions(id, updateUserDto);
  }

  @Patch(':id/reactive')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 🔄 5 reactivaciones por minuto
  reactiveUser(@Param('id') id: string) {
    return this.usersService.reactiveUser(id);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 🗑️ 5 eliminaciones por 5 minutos
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Delete(':id/desactive')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 🔒 10 desactivaciones por minuto
  desactiveUser(@Param('id') id: string) {
    return this.usersService.desactiveUser(id);
  }
}
```

---

## 🎨 Personalización de Mensajes de Error

### 📝 **Problema: Mensaje genérico**

Por defecto, cuando se activa el rate limiting, obtienes:
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

### ✅ **Solución 1: Interceptor Global (Recomendado)**

Crea un interceptor para personalizar todos los mensajes:

```typescript
// src/common/interceptors/throttler-error.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class ThrottlerErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof ThrottlerException) {
          // 🎯 Mensaje personalizado en español
          const customError = new HttpException(
            {
              statusCode: 429,
              error: 'Demasiadas Solicitudes',
              message: 'Has excedido el límite de solicitudes. Intenta nuevamente en unos momentos.',
              timestamp: new Date().toISOString(),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
          return throwError(() => customError);
        }
        return throwError(() => error);
      }),
    );
  }
}
```

**Registrar el interceptor en `app.module.ts`:**
```typescript
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerErrorInterceptor } from './common/interceptors/throttler-error.interceptor';

@Module({
  // ... tus imports existentes
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 🎨 Agregar interceptor personalizado
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottlerErrorInterceptor,
    },
    // ... tus otros providers
  ],
})
export class AppModule {}
```

### ✅ **Solución 2: Guard Personalizado**

Crea un guard que extienda el ThrottlerGuard:

```typescript
// src/common/guards/custom-throttler.guard.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): void {
    throw new HttpException(
      {
        statusCode: 429,
        error: 'Límite Excedido',
        message: 'Demasiadas solicitudes. Por favor, espera antes de intentar nuevamente.',
        hint: 'Puedes intentar nuevamente en 1 minuto.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
```

**Usar el guard personalizado en `app.module.ts`:**
```typescript
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // 🔄 Cambiar por tu guard personalizado
    },
  ],
})
export class AppModule {}
```

### ✅ **Solución 3: Mensajes Específicos por Endpoint**

Para diferentes mensajes según el endpoint:

```typescript
// src/auth/auth.controller.ts
import { HttpException, HttpStatus } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ short: {} })
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      if (error.status === 429) {
        throw new HttpException(
          {
            statusCode: 429,
            error: 'Demasiados Intentos de Login',
            message: 'Has intentado iniciar sesión demasiadas veces. Espera 1 minuto antes de intentar nuevamente.',
            nextAttemptIn: '60 segundos',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }
  }
}
```

### 🌍 **Mensajes Internacionalizados**

Para soporte multiidioma:

```typescript
// src/common/interceptors/i18n-throttler.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class I18nThrottlerInterceptor implements NestInterceptor {
  private messages = {
    es: {
      error: 'Demasiadas Solicitudes',
      message: 'Has excedido el límite de solicitudes. Intenta nuevamente en unos momentos.',
    },
    en: {
      error: 'Too Many Requests',
      message: 'You have exceeded the request limit. Please try again in a few moments.',
    },
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof ThrottlerException) {
          const request = context.switchToHttp().getRequest();
          const lang = request.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
          
          const customError = new HttpException(
            {
              statusCode: 429,
              error: this.messages[lang].error,
              message: this.messages[lang].message,
              timestamp: new Date().toISOString(),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
          return throwError(() => customError);
        }
        return throwError(() => error);
      }),
    );
  }
}
```

### 📊 **Resultado Final**

Con cualquiera de estas soluciones, en lugar de:
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

Obtendrás:
```json
{
  "statusCode": 429,
  "error": "Demasiadas Solicitudes",
  "message": "Has excedido el límite de solicitudes. Intenta nuevamente en unos momentos.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 Testing y Verificación

### 1. Comando para Probar Rate Limiting

```bash
# Instalar herramienta de testing (opcional)
npm install -g artillery

# O usar curl para pruebas manuales
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrongpassword"}'
```

### 2. Script de Prueba Rápida

Crea un archivo `test-rate-limit.js`:

```javascript
// test-rate-limit.js
const axios = require('axios');

async function testRateLimit() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Probando Rate Limiting en Login...');
  
  for (let i = 1; i <= 7; i++) {
    try {
      const response = await axios.post(`${baseURL}/auth/login`, {
        email: 'test@test.com',
        password: 'wrongpassword'
      });
      console.log(`✅ Intento ${i}: OK`);
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`🛡️ Intento ${i}: BLOQUEADO por Rate Limiting`);
        console.log(`Headers:`, error.response.headers);
      } else {
        console.log(`❌ Intento ${i}: Error ${error.response?.status}`);
      }
    }
    
    // Esperar 1 segundo entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testRateLimit();
```

### 3. Verificar Headers de Rate Limiting

Cuando funcione correctamente, verás estos headers:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

---

## 🚀 Próximos Pasos

### Para Endpoints de Archivos (Futuro)

Cuando implementes subida de archivos:

```typescript
@Post('upload')
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 archivos por minuto
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Tu lógica de subida
}
```

### Configuración por Tamaño de Archivo

```typescript
@Post('upload/large')
@Throttle({ default: { limit: 2, ttl: 300000 } }) // 2 archivos grandes por 5 minutos
uploadLargeFile(@UploadedFile() file: Express.Multer.File) {
  // Para archivos > 10MB
}

@Post('upload/small')
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 archivos pequeños por minuto
uploadSmallFile(@UploadedFile() file: Express.Multer.File) {
  // Para archivos < 1MB
}
```

### Monitoreo Básico

Agregar logs para monitorear:

```typescript
import { Logger } from '@nestjs/common';

@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } })
login(@Body() loginDto: LoginDto) {
  Logger.log(`Login attempt for: ${loginDto.email}`, 'AuthController');
  return this.authService.login(loginDto);
}
```

---

## 📊 Resumen de Configuración

| Endpoint | Límite | Tiempo | Razón |
|----------|--------|--------|---------|
| `POST /auth/login` | 5 requests | 1 minuto | Prevenir fuerza bruta |
| `POST /users` | 3 requests | 5 minutos | Evitar spam de usuarios |
| `PATCH /users/:id/password` | 3 requests | 5 minutos | Limitar cambios de contraseña |
| `PATCH /users/:id/mail` | 5 requests | 5 minutos | Controlar cambios de email |
| `DELETE /users/:id` | 5 requests | 5 minutos | Prevenir eliminaciones masivas |
| `GET /users` | 50 requests | 1 minuto | Permitir consultas normales |

---

## ✅ Checklist de Implementación

- [ ] ✅ Dependencia `@nestjs/throttler` ya instalada
- [ ] Configurar `ThrottlerModule` en `app.module.ts`
- [ ] Agregar `ThrottlerGuard` como guard global
- [ ] Aplicar `@Throttle()` en endpoint de login
- [ ] Aplicar `@Throttle()` en endpoint de creación de usuarios
- [ ] Aplicar `@Throttle()` en endpoints sensibles de usuarios
- [ ] Probar con script de testing
- [ ] Verificar headers de rate limiting
- [ ] Documentar límites para el equipo

**¡Tu proyecto ya tiene una base sólida de seguridad! El rate limiting será la cereza del pastel. 🍰**
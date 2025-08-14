# 🚦 Manual Completo: Rate Limiting en NestJS
## 📚 Guía Didáctica desde Básico hasta Avanzado

---

## 📋 Índice

### 🎯 **Fundamentos Teóricos**
1. [¿Qué es Rate Limiting?](#qué-es-rate-limiting)
2. [¿Por qué es tan importante?](#por-qué-es-tan-importante)
3. [Casos de uso reales](#casos-de-uso-reales)
4. [Tipos y estrategias](#tipos-y-estrategias)

### 🚀 **Nivel Básico - Proyectos Pequeños**
5. [Implementación básica paso a paso](#implementación-básica)
6. [Configuración simple](#configuración-simple)
7. [Primeros tests](#primeros-tests)

### ⚡ **Nivel Intermedio - Proyectos Medianos**
8. [Configuración por endpoint](#configuración-por-endpoint)
9. [Rate limiting por usuario](#rate-limiting-por-usuario)
10. [Manejo de errores personalizado](#manejo-de-errores)

### 🏗️ **Nivel Avanzado - Proyectos Empresariales**
11. [Rate limiting con Redis](#rate-limiting-con-redis)
12. [Guards y decoradores personalizados](#guards-personalizados)
13. [Estrategias múltiples](#estrategias-múltiples)
14. [Monitoreo y métricas](#monitoreo-y-métricas)

### 🚀 **Producción**
15. [Configuración de producción](#configuración-de-producción)
16. [Mejores prácticas](#mejores-prácticas)
17. [Troubleshooting](#troubleshooting)

---

# 🎯 FUNDAMENTOS TEÓRICOS

## 🤔 ¿Qué es Rate Limiting?

**Rate Limiting** es como un "semáforo inteligente" para tu API. Imagínate que tu API es una tienda y el rate limiting es el guardia de seguridad que controla cuántas personas pueden entrar por minuto.

### 🏪 **Analogía Simple:**
```
🏪 Tu API = Una tienda
👥 Requests = Clientes queriendo entrar
🚪 Rate Limit = Guardia que dice "máximo 10 clientes por minuto"
⏰ Ventana de tiempo = El minuto que cuenta el guardia
```

### 📊 **¿Cómo funciona en la práctica?**

Supongamos que configuras: **"máximo 100 requests por minuto por usuario"**

```
⏰ Minuto 1:
   Usuario Juan: 50 requests ✅ (permitido)
   Usuario Ana: 120 requests ❌ (bloqueado después de 100)
   Usuario Luis: 30 requests ✅ (permitido)

⏰ Minuto 2:
   Todos empiezan de nuevo con 0 requests
```

### 🔑 **Conceptos Clave que Debes Entender:**

| Concepto | ¿Qué es? | Ejemplo |
|----------|----------|----------|
| **Rate** | Velocidad permitida | "100 requests" |
| **Window** | Ventana de tiempo | "por minuto" |
| **Throttling** | Acción de frenar | Bloquear requests extras |
| **Bucket** | Contador virtual | "Te quedan 50 requests" |
| **TTL** | Tiempo hasta resetear | "Se resetea en 30 segundos" |

---

## 🎯 ¿Por qué es tan importante?

### 🚨 **Imagínate estos escenarios SIN rate limiting:**

**Escenario 1: El Bot Malicioso** 🤖
```
❌ Sin Rate Limiting:
Bot hace 10,000 requests/segundo → Tu servidor se cae → Todos los usuarios se quedan sin servicio

✅ Con Rate Limiting:
Bot hace 10,000 requests/segundo → Solo las primeras 100 pasan → Tu servidor sigue funcionando
```

**Escenario 2: El Usuario "Entusiasta"** 😅
```
❌ Sin Rate Limiting:
Usuario hace clic 500 veces en "Buscar" → Base de datos colapsa → App se vuelve lenta para todos

✅ Con Rate Limiting:
Usuario hace clic 500 veces → Solo 50 búsquedas se procesan → App funciona normal
```

**Escenario 3: El Ataque de Login** 🔓
```
❌ Sin Rate Limiting:
Hacker intenta 1 millón de passwords → Puede hackear cuentas → Usuarios pierden sus datos

✅ Con Rate Limiting:
Hacker intenta 1 millón de passwords → Solo 5 intentos por minuto → Imposible hackear
```

### 💡 **Beneficios Reales que Verás:**

#### 🛡️ **1. Protección (Tu app no se cae)**
- **DDoS Protection**: Tu servidor resiste ataques masivos
- **Brute Force Protection**: Las cuentas de usuarios están seguras
- **Resource Protection**: Tu base de datos no colapsa

#### 💰 **2. Ahorro de Dinero**
- **Menos recursos de servidor**: No necesitas servidores gigantes
- **APIs externas**: No pagas de más por servicios como SendGrid, Stripe
- **Base de datos**: Menos consultas = menos costo en AWS/Google Cloud

#### 😊 **3. Usuarios Felices**
- **App siempre disponible**: No se cae por sobrecarga
- **Velocidad consistente**: No se vuelve lenta
- **Experiencia justa**: Todos pueden usar la app por igual

#### 📈 **4. Escalabilidad**
- **Crecimiento controlado**: Tu app puede crecer sin romperse
- **Predicción de recursos**: Sabes cuántos recursos necesitas
- **Debugging más fácil**: Menos tráfico = más fácil encontrar bugs

---

## 📋 Casos de uso reales

### 🎯 **¿Cuándo y dónde aplicar Rate Limiting?**

#### 🔐 **1. Endpoints de Autenticación**
```typescript
// ¿Por qué? Prevenir ataques de fuerza bruta
POST /auth/login        → 5 intentos por minuto por IP
POST /auth/register     → 3 registros por hora por IP
POST /auth/forgot       → 2 solicitudes por hora por email
```
**Explicación**: Si alguien intenta hackear una cuenta, solo puede probar 5 passwords por minuto. ¡Tardaría años en hackear una cuenta!

#### 🔍 **2. Endpoints de Búsqueda**
```typescript
// ¿Por qué? Las búsquedas consumen mucha base de datos
GET /api/search         → 50 búsquedas por minuto por usuario
GET /api/products       → 100 requests por minuto por IP
```
**Explicación**: Las búsquedas hacen consultas complejas a la base de datos. Sin límites, un usuario podría hacer tu app lenta para todos.

#### 📤 **3. Endpoints de Upload**
```typescript
// ¿Por qué? Los archivos consumen espacio y ancho de banda
POST /api/upload        → 10 archivos por hora por usuario
POST /api/avatar        → 3 cambios por día por usuario
```
**Explicación**: Subir archivos es costoso. Sin límites, alguien podría llenar tu servidor de archivos basura.

#### 💬 **4. Endpoints de Comunicación**
```typescript
// ¿Por qué? Prevenir spam y abuso
POST /api/comments      → 20 comentarios por hora por usuario
POST /api/messages      → 100 mensajes por día por usuario
POST /api/contact       → 5 mensajes por día por IP
```
**Explicación**: Sin límites, los spammers podrían inundar tu app con mensajes basura.

#### 🏆 **5. Endpoints Premium vs Gratuitos**
```typescript
// Diferentes límites según el plan del usuario
Usuarios Gratuitos:
  GET /api/data         → 100 requests por hora
  
Usuarios Premium:
  GET /api/data         → 1000 requests por hora
  
Usuarios Enterprise:
  GET /api/data         → Sin límites
```
**Explicación**: Puedes monetizar tu API dando más límites a usuarios que pagan.

### 🎨 **Estrategias por Tipo de Aplicación**

#### 📱 **App de Redes Sociales**
```typescript
POST /posts             → 50 posts por día
POST /likes             → 1000 likes por hora
POST /follows           → 100 follows por día
GET /feed               → 200 requests por hora
```

#### 🛒 **E-commerce**
```typescript
POST /cart/add          → 100 items por hora
POST /orders            → 10 órdenes por día
GET /products/search    → 200 búsquedas por hora
POST /reviews           → 5 reviews por día
```

#### 🏦 **API Financiera**
```typescript
POST /transactions      → 50 transacciones por día
GET /balance            → 500 consultas por hora
POST /transfers         → 20 transferencias por día
```

---

## 🔧 Tipos y estrategias

### 🪣 **1. Token Bucket (Cubo de Fichas)**

**¿Cómo funciona?** Imagínate un cubo con fichas. Cada request consume una ficha. El cubo se rellena automáticamente.

```typescript
// Ejemplo: 100 fichas, se rellena 1 ficha por segundo
Cubo inicial: [🪙🪙🪙🪙🪙] (5 fichas)
Request 1: [🪙🪙🪙🪙] (consume 1 ficha)
Request 2: [🪙🪙🪙] (consume 1 ficha)
+1 segundo: [🪙🪙🪙🪙] (se agrega 1 ficha)
```

**✅ Ventajas:**
- Permite "ráfagas" de requests
- Flexible y natural
- Fácil de entender

**❌ Desventajas:**
- Más complejo de implementar
- Consume más memoria

**🎯 Cuándo usarlo:** APIs que necesitan flexibilidad (ej: subir múltiples archivos de vez en cuando)

### 🪟 **2. Fixed Window (Ventana Fija)**

**¿Cómo funciona?** Divide el tiempo en ventanas fijas. Cada ventana tiene un límite.

```typescript
// Ejemplo: 100 requests por hora
Ventana 1 (14:00-15:00): 100 requests ✅
Ventana 2 (15:00-16:00): 100 requests ✅ (se resetea)
Ventana 3 (16:00-17:00): 100 requests ✅ (se resetea)
```

**✅ Ventajas:**
- Muy simple de implementar
- Consume poca memoria
- Fácil de entender

**❌ Desventajas:**
- Permite "picos" al inicio de cada ventana
- No es muy flexible

**🎯 Cuándo usarlo:** Proyectos simples, APIs internas, cuando necesitas algo rápido

### 🌊 **3. Sliding Window (Ventana Deslizante)**

**¿Cómo funciona?** La ventana se mueve constantemente, no tiene "resets" abruptos.

```typescript
// Ejemplo: 100 requests por hora
14:30: Cuenta requests desde 13:30 hasta 14:30
14:31: Cuenta requests desde 13:31 hasta 14:31
14:32: Cuenta requests desde 13:32 hasta 14:32
```

**✅ Ventajas:**
- Muy preciso
- No permite picos
- Distribución uniforme

**❌ Desventajas:**
- Complejo de implementar
- Consume más recursos

**🎯 Cuándo usarlo:** APIs críticas, sistemas financieros, cuando necesitas máxima precisión

### 🏃 **4. Leaky Bucket (Cubo con Agujero)**

**¿Cómo funciona?** Los requests se acumulan en un cubo que se "vacía" a velocidad constante.

```typescript
// Ejemplo: Procesa 10 requests por segundo
Cubo: [📨📨📨📨📨] (5 requests esperando)
Cada segundo: Procesa 1 request del cubo
Si el cubo se llena: Rechaza nuevos requests
```

**✅ Ventajas:**
- Suaviza el tráfico
- Protege el backend
- Bueno para sistemas con capacidad limitada

**❌ Desventajas:**
- Agrega latencia
- Complejo de implementar

**🎯 Cuándo usarlo:** Cuando tu backend no puede manejar picos, sistemas con recursos limitados

### 📊 **Comparación Rápida**

| Estrategia | Simplicidad | Precisión | Flexibilidad | Uso Recomendado |
|------------|-------------|-----------|--------------|------------------|
| **Fixed Window** | 🟢 Muy fácil | 🟡 Media | 🔴 Baja | Proyectos pequeños |
| **Token Bucket** | 🟡 Media | 🟢 Alta | 🟢 Alta | Proyectos medianos |
| **Sliding Window** | 🔴 Difícil | 🟢 Muy alta | 🟡 Media | Proyectos críticos |
| **Leaky Bucket** | 🔴 Difícil | 🟢 Alta | 🟡 Media | Sistemas limitados |

### 🎯 **¿Cuál elegir para tu proyecto?**

#### 🚀 **Proyecto Pequeño/Personal**
```typescript
// Usa Fixed Window - Simple y efectivo
ThrottlerModule.forRoot([{
  ttl: 60000,  // 1 minuto
  limit: 100,  // 100 requests
}])
```

#### ⚡ **Proyecto Mediano/Startup**
```typescript
// Usa Token Bucket - Flexible y escalable
// (NestJS usa Token Bucket por defecto)
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 100,
}])
```

#### 🏢 **Proyecto Empresarial/Crítico**
```typescript
// Usa Sliding Window con Redis
// Implementación personalizada con mayor precisión
```

---

# ⚡ NIVEL INTERMEDIO - Proyectos Medianos

## 🎯 ¿Cuándo necesitas el nivel intermedio?

**Señales de que necesitas más control:**
- Tu API tiene diferentes tipos de endpoints (públicos, privados, admin)
- Algunos endpoints son más "costosos" que otros (uploads, búsquedas)
- Tienes usuarios con diferentes niveles de acceso
- Quieres proteger endpoints específicos de manera diferente

**🎯 ¿Qué vas a aprender?**
- Configurar rate limiting por endpoint específico
- Crear múltiples configuraciones simultáneas
- Saltar rate limiting en endpoints específicos
- Configurar diferentes límites por tipo de operación

---

## 🎛️ Configuración por Endpoint

### 🎯 **¿Por qué configurar por endpoint?**

No todos los endpoints son iguales:

| Tipo de Endpoint | Costo | Límite Sugerido | ¿Por qué? |
|------------------|-------|-----------------|------------|
| 🔐 Login | Alto | 5/minuto | Prevenir ataques de fuerza bruta |
| 📤 Upload | Alto | 10/minuto | Evitar saturar el servidor |
| 🔍 Búsqueda | Medio | 50/minuto | Balance entre UX y rendimiento |
| 👤 Perfil | Bajo | 200/minuto | Operación ligera |
| ❤️ Health Check | Mínimo | Sin límite | Monitoreo debe ser libre |

### 🛠️ **Implementación paso a paso**

#### **Paso 1: Configuración global + específica**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // 🌍 Configuración global (base para todos los endpoints)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,  // 1 minuto
        limit: 100,  // 100 requests por defecto
      },
      {
        name: 'strict',
        ttl: 60000,  // 1 minuto
        limit: 10,   // 10 requests para endpoints sensibles
      },
      {
        name: 'generous',
        ttl: 60000,  // 1 minuto
        limit: 500,  // 500 requests para endpoints ligeros
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

#### **Paso 2: Usar decoradores en controladores**

```typescript
// src/users/users.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
  
  // 🔐 LOGIN: Muy restrictivo (prevenir ataques de fuerza bruta)
  @Throttle({ strict: { limit: 5, ttl: 60000 } })  // 5 intentos por minuto
  @Post('login')
  async login(@Body() loginDto: any) {
    // Lógica de login
    return { message: 'Login attempt' };
  }
  
  // 📝 REGISTRO: Restrictivo (prevenir spam de cuentas)
  @Throttle({ strict: { limit: 3, ttl: 300000 } })  // 3 registros por 5 minutos
  @Post('register')
  async register(@Body() registerDto: any) {
    // Lógica de registro
    return { message: 'User registered' };
  }
  
  // 👤 PERFIL: Usa configuración por defecto (100/minuto)
  @Get('profile')
  async getProfile() {
    // Lógica del perfil
    return { message: 'User profile' };
  }
  
  // 📋 LISTA: Más generoso (operación de solo lectura)
  @Throttle({ generous: { limit: 200, ttl: 60000 } })  // 200 por minuto
  @Get()
  async getUsers() {
    // Lógica para obtener usuarios
    return { message: 'Users list' };
  }
  
  // ❤️ HEALTH: Sin límites (para monitoreo)
  @SkipThrottle()  // 🚫 Sin rate limiting
  @Get('health')
  async health() {
    return { status: 'ok', timestamp: new Date() };
  }
}
```

#### **Paso 3: Entender los decoradores**

**🎯 `@Throttle()` - Configuración específica**
```typescript
// Sintaxis básica
@Throttle({ configName: { limit: número, ttl: milisegundos } })

// Ejemplos prácticos
@Throttle({ default: { limit: 50, ttl: 60000 } })     // 50/minuto
@Throttle({ strict: { limit: 5, ttl: 60000 } })       // 5/minuto
@Throttle({ generous: { limit: 1000, ttl: 60000 } })  // 1000/minuto
```

**🚫 `@SkipThrottle()` - Saltar rate limiting**
```typescript
// Sin parámetros: salta TODA la configuración
@SkipThrottle()

// Con parámetros: salta configuraciones específicas
@SkipThrottle({ default: true })     // Solo salta 'default'
@SkipThrottle({ strict: true })      // Solo salta 'strict'
```

---

## 🧪 **Probando la configuración intermedia**

### 🔬 **Test del endpoint de login**

```bash
# 1. Probar login normal (debería funcionar)
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# 2. Hacer 6 requests rápidos (el 6to debería fallar)
for i in {1..6}; do 
  curl -X POST http://localhost:3000/users/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"123456"}'
done
```

### 🔬 **Test del endpoint sin límites**

```bash
# Health check debería funcionar siempre
for i in {1..200}; do 
  curl http://localhost:3000/users/health
done
# Todos deberían responder 200 OK
```

---

## 🎨 **Configuraciones comunes por tipo de aplicación**

### 🛒 **E-commerce**

```typescript
// src/app.module.ts - Configuración para e-commerce
ThrottlerModule.forRoot([
  {
    name: 'default',
    ttl: 60000,   // 1 minuto
    limit: 100,   // Navegación general
  },
  {
    name: 'auth',
    ttl: 900000,  // 15 minutos
    limit: 5,     // Login muy restrictivo
  },
  {
    name: 'search',
    ttl: 60000,   // 1 minuto
    limit: 50,    // Búsquedas moderadas
  },
  {
    name: 'checkout',
    ttl: 300000,  // 5 minutos
    limit: 10,    // Compras controladas
  },
])

// src/products/products.controller.ts
@Controller('products')
export class ProductsController {
  
  @Throttle({ search: { limit: 50, ttl: 60000 } })
  @Get('search')
  async searchProducts(@Query('q') query: string) {
    // Búsqueda de productos
  }
  
  @Throttle({ checkout: { limit: 10, ttl: 300000 } })
  @Post('purchase')
  async purchaseProduct(@Body() purchaseDto: any) {
    // Proceso de compra
  }
}
```

### 📱 **API para App Móvil**

```typescript
// Configuración optimizada para apps móviles
ThrottlerModule.forRoot([
  {
    name: 'default',
    ttl: 60000,   // 1 minuto
    limit: 200,   // Apps hacen más requests
  },
  {
    name: 'sync',
    ttl: 60000,   // 1 minuto
    limit: 10,    // Sincronización controlada
  },
  {
    name: 'upload',
    ttl: 300000,  // 5 minutos
    limit: 5,     // Uploads muy limitados
  },
])
```

### 🏢 **API Empresarial**

```typescript
// Configuración para uso interno empresarial
ThrottlerModule.forRoot([
  {
    name: 'default',
    ttl: 60000,   // 1 minuto
    limit: 1000,  // Muy permisivo para uso interno
  },
  {
    name: 'reports',
    ttl: 300000,  // 5 minutos
    limit: 20,    // Reportes son costosos
  },
  {
    name: 'bulk',
    ttl: 3600000, // 1 hora
    limit: 5,     // Operaciones masivas muy limitadas
  },
])
```

---

## 🔧 **Rate Limiting por Usuario Autenticado**

### 🎯 **¿Por qué por usuario?**

Por defecto, el rate limiting es **por IP**. Pero esto tiene problemas:

| Problema | Ejemplo | Solución |
|----------|---------|----------|
| 🏢 **Oficinas** | 100 empleados, 1 IP | Rate limiting por usuario |
| 📱 **Apps móviles** | Muchos usuarios, pocas IPs | Rate limiting por usuario |
| 🎭 **Usuarios premium** | Quieren más límites | Límites por tipo de usuario |

### 🛠️ **Implementación paso a paso**

#### **Paso 1: Crear un Guard personalizado**

```typescript
// src/common/guards/user-throttler.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  
  // 🔑 Cambiar la clave de IP a User ID
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Si hay usuario autenticado, usar su ID
    if (req.user && req.user.id) {
      return `user-${req.user.id}`;
    }
    
    // Si no hay usuario, usar IP (fallback)
    return req.ip;
  }
  
  // 🎯 Límites dinámicos según tipo de usuario
  protected async getThrottlerLimit(
    context: ExecutionContext,
    throttlerName: string,
  ): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // 👑 Usuario premium: límites más altos
    if (user?.isPremium) {
      return 500; // 5x más límite
    }
    
    // 👤 Usuario normal: límites estándar
    if (user) {
      return 100;
    }
    
    // 🚫 Usuario anónimo: límites bajos
    return 50;
  }
}
```

#### **Paso 2: Aplicar el guard personalizado**

```typescript
// src/app.module.ts
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';

@Module({
  // ... otras configuraciones
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard, // 🔄 Cambiar por el guard personalizado
    },
  ],
})
export class AppModule {}
```

#### **Paso 3: Usar en controladores**

```typescript
// src/users/users.controller.ts
@Controller('users')
export class UsersController {
  
  // 🔐 Este endpoint ahora usa rate limiting por usuario
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('profile')
  async getProfile(@GetUser() user: any) {
    // El límite será:
    // - 500/min si es premium
    // - 100/min si es usuario normal
    // - 50/min si es anónimo
    return user;
  }
}
```

---

---

# 🚀 NIVEL AVANZADO - Proyectos Grandes

## 🎯 ¿Cuándo necesitas el nivel avanzado?

**Señales de que necesitas Redis y configuraciones avanzadas:**
- Tu aplicación tiene **múltiples instancias** (load balancer)
- Tienes **más de 10,000 usuarios activos**
- Necesitas **persistencia** del rate limiting entre reinicios
- Quieres **monitoreo avanzado** y métricas
- Tienes **diferentes regiones geográficas**

**🎯 ¿Qué vas a aprender?**
- Configurar Redis como storage para rate limiting
- Rate limiting distribuido entre múltiples servidores
- Configuraciones avanzadas de rendimiento
- Monitoreo y métricas
- Configuración para producción

---

## 🗄️ **Redis como Storage**

### 🤔 **¿Por qué Redis?**

**Problema con memoria local:**
```
🖥️ Servidor 1: Usuario hace 50 requests
🖥️ Servidor 2: Usuario hace 50 requests
🖥️ Servidor 3: Usuario hace 50 requests

❌ Total: 150 requests (debería ser máximo 100)
```

**Solución con Redis:**
```
🖥️ Servidor 1 ──┐
🖥️ Servidor 2 ──┼──► 🗄️ Redis (contador compartido)
🖥️ Servidor 3 ──┘

✅ Total: 100 requests (límite respetado)
```

### 🛠️ **Implementación paso a paso**

#### **Paso 1: Instalar dependencias**

##### 📦 **Dependencias de Node.js**

```bash
# 🗄️ Storage de Redis para Throttler
npm install @nestjs/throttler-storage-redis

# 🔧 Cliente de Redis
npm install redis

# 📝 Tipos de TypeScript para Redis
npm install -D @types/redis

# 📁 Variables de entorno (si no lo tienes)
npm install @nestjs/config

# 🚦 Throttler básico (si no lo tienes)
npm install @nestjs/throttler
```

##### 🐳 **Instalación de Redis Server**

**Opción 1: Docker (Recomendado para desarrollo)**

```bash
# 🐳 Instalar Docker Desktop desde https://docker.com/products/docker-desktop
# Luego ejecutar Redis:
docker run --name redis-dev -p 6379:6379 -d redis:7-alpine

# 🔍 Verificar que Redis esté corriendo
docker ps

# 🧪 Probar conexión
docker exec -it redis-dev redis-cli ping
# Debería responder: PONG
```

**Opción 2: Instalación local en Windows**

```powershell
# 📦 Usando Chocolatey (instalar desde https://chocolatey.org/)
choco install redis-64

# 🚀 Iniciar Redis
redis-server

# 🧪 En otra terminal, probar conexión
redis-cli ping
# Debería responder: PONG
```

**Opción 3: Redis en la nube (Producción)**

```bash
# 🌐 Opciones de Redis en la nube:
# - Redis Cloud (https://redis.com/redis-enterprise-cloud/)
# - AWS ElastiCache
# - Google Cloud Memorystore
# - Azure Cache for Redis

# Solo necesitas la URL de conexión, no instalación local
```

##### ✅ **Verificar instalación completa**

```bash
# 🔍 Verificar que todas las dependencias estén instaladas
npm list @nestjs/throttler @nestjs/throttler-storage-redis redis @nestjs/config

# 🧪 Verificar que Redis esté corriendo
redis-cli ping
# Debería responder: PONG

# 📋 Verificar versiones
node --version    # Debería ser >= 16
npm --version     # Debería ser >= 8
redis-cli --version  # Cualquier versión 6+
```

#### **Paso 2: Configurar Redis**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nestjs/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    
    // 🗄️ Configuración con Redis
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000,  // 1 minuto
            limit: 100,  // 100 requests
          },
          {
            name: 'strict',
            ttl: 60000,  // 1 minuto
            limit: 10,   // 10 requests
          },
        ],
        // 🔑 Configuración de Redis
        storage: new ThrottlerStorageRedisService({
          host: config.get('REDIS_HOST') || 'localhost',
          port: config.get('REDIS_PORT') || 6379,
          password: config.get('REDIS_PASSWORD'),
          db: config.get('REDIS_DB') || 0,
          // 🚀 Configuraciones de rendimiento
          keyPrefix: 'throttler:',
          connectTimeout: 5000,
          lazyConnect: true,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

#### **Paso 3: Variables de entorno**

```env
# .env
# 🗄️ Configuración de Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=tu_password_super_seguro
REDIS_DB=0

# 🚦 Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# 🌍 Ambiente
NODE_ENV=production
```

#### **Paso 4: Docker Compose para desarrollo**

```yaml
# docker-compose.yml
version: '3.8'
services:
  # 🗄️ Redis para rate limiting
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass tu_password_super_seguro
    volumes:
      - redis_data:/data
    restart: unless-stopped
  
  # 🚀 Tu aplicación NestJS
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=tu_password_super_seguro
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis_data:
```

---

## 🔧 **Configuraciones Avanzadas**

### 🎯 **Rate Limiting Inteligente**

```typescript
// src/common/guards/smart-throttler.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SmartThrottlerGuard extends ThrottlerGuard {
  constructor(private reflector: Reflector) {
    super();
  }

  // 🧠 Lógica inteligente para diferentes escenarios
  protected async getThrottlerLimit(
    context: ExecutionContext,
    throttlerName: string,
  ): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userAgent = request.headers['user-agent'];
    const hour = new Date().getHours();
    
    // 🤖 Detectar bots (límites más bajos)
    if (this.isBot(userAgent)) {
      return 20; // Límite bajo para bots
    }
    
    // ⏰ Horarios pico (límites más bajos)
    if (this.isPeakHour(hour)) {
      return 50; // Límite reducido en horarios pico
    }
    
    // 👑 Usuarios premium
    if (user?.subscription === 'premium') {
      return 1000; // Límite muy alto
    }
    
    // 💰 Usuarios pagos
    if (user?.subscription === 'paid') {
      return 500; // Límite alto
    }
    
    // 🆓 Usuarios gratuitos
    if (user) {
      return 100; // Límite estándar
    }
    
    // 🚫 Usuarios anónimos
    return 30; // Límite bajo
  }
  
  // 🤖 Detectar bots por User-Agent
  private isBot(userAgent: string): boolean {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
  }
  
  // ⏰ Detectar horarios pico (9-12 y 14-18)
  private isPeakHour(hour: number): boolean {
    return (hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 18);
  }
}
```

### 🌍 **Rate Limiting por Región**

```typescript
// src/common/guards/geo-throttler.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GeoThrottlerGuard extends ThrottlerGuard {
  
  protected async getThrottlerLimit(
    context: ExecutionContext,
    throttlerName: string,
  ): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const country = request.headers['cf-ipcountry']; // Cloudflare header
    
    // 🇺🇸 Países con alta capacidad
    const highCapacityCountries = ['US', 'CA', 'GB', 'DE', 'FR', 'JP'];
    if (highCapacityCountries.includes(country)) {
      return 200;
    }
    
    // 🌍 Países con capacidad media
    const mediumCapacityCountries = ['BR', 'MX', 'AR', 'ES', 'IT'];
    if (mediumCapacityCountries.includes(country)) {
      return 100;
    }
    
    // 🌏 Otros países (capacidad limitada)
    return 50;
  }
}
```

---

## 📊 **Monitoreo y Métricas**

### 🔍 **Interceptor para métricas**

```typescript
// src/common/interceptors/throttle-metrics.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class ThrottleMetricsInterceptor implements NestInterceptor {
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      tap(() => {
        // ✅ Request exitoso
        this.logMetric('throttle.request.success', {
          endpoint: request.route?.path,
          method: request.method,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
        });
      }),
      catchError((error) => {
        // ❌ Request bloqueado por rate limiting
        if (error.status === 429) {
          this.logMetric('throttle.request.blocked', {
            endpoint: request.route?.path,
            method: request.method,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            reason: 'rate_limit_exceeded',
          });
        }
        throw error;
      }),
    );
  }
  
  private logMetric(event: string, data: any) {
    // 📊 Enviar a tu sistema de métricas (DataDog, New Relic, etc.)
    console.log(`[METRIC] ${event}:`, data);
    
    // Ejemplo con DataDog
    // this.datadogService.increment(event, 1, data);
  }
}
```

### 📈 **Dashboard de métricas**

```typescript
// src/monitoring/monitoring.controller.ts
import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('monitoring')
@SkipThrottle() // Sin rate limiting para monitoreo
export class MonitoringController {
  
  @Get('throttle-stats')
  async getThrottleStats() {
    // 📊 Estadísticas de rate limiting
    return {
      totalRequests: 150000,
      blockedRequests: 1250,
      blockRate: '0.83%',
      topBlockedIPs: [
        { ip: '192.168.1.100', blocks: 45 },
        { ip: '10.0.0.50', blocks: 32 },
      ],
      topBlockedEndpoints: [
        { endpoint: '/api/login', blocks: 89 },
        { endpoint: '/api/search', blocks: 67 },
      ],
      peakHours: [
        { hour: 10, requests: 12000 },
        { hour: 15, requests: 11500 },
      ],
    };
  }
}
```

---

# 🚀 NIVEL BÁSICO - Proyectos Pequeños

## 📦 Implementación básica paso a paso

### 🎯 **¿Qué vamos a lograr?**
Al final de esta sección tendrás:
- Rate limiting funcionando en toda tu API
- Protección básica contra ataques
- Un sistema que puedes usar en producción

### 📋 **Prerrequisitos**
- Proyecto NestJS funcionando
- Node.js y npm instalados
- Conocimientos básicos de NestJS

---

### 🔧 **Paso 1: Instalar dependencias**

#### 📦 **Instalación básica (obligatoria)**

```bash
# 🚦 Librería principal de rate limiting
npm install @nestjs/throttler

# 📁 Para manejar variables de entorno (recomendado)
npm install @nestjs/config

# 🔧 Tipos de TypeScript (desarrollo)
npm install -D @types/node
```

#### 📦 **Instalación intermedia (opcional)**

```bash
# 🛡️ Para guards personalizados y reflexión
npm install @nestjs/core reflect-metadata

# 📊 Para logging y monitoreo
npm install winston
npm install -D @types/winston
```

#### 📦 **Instalación avanzada (Redis)**

```bash
# 🗄️ Redis para aplicaciones distribuidas
npm install @nestjs/throttler-storage-redis redis
npm install -D @types/redis

# 🐳 Docker Compose (opcional para desarrollo local)
# No requiere npm install, solo tener Docker instalado
```

#### 📦 **Instalación completa (todo junto)**

```bash
# 🚀 Comando único para instalar todo
npm install @nestjs/throttler @nestjs/config @nestjs/core reflect-metadata winston @nestjs/throttler-storage-redis redis

# 🔧 Dependencias de desarrollo
npm install -D @types/node @types/winston @types/redis
```

**🤔 ¿Qué hace cada librería?**

| Librería | ¿Para qué sirve? | ¿Cuándo usarla? |
|----------|------------------|------------------|
| `@nestjs/throttler` | Rate limiting básico | ✅ Siempre (obligatoria) |
| `@nestjs/config` | Variables de entorno | ✅ Recomendado siempre |
| `@nestjs/throttler-storage-redis` | Storage distribuido | 🔧 Solo con múltiples instancias |
| `redis` | Cliente de Redis | 🔧 Solo con Redis |
| `winston` | Logging avanzado | 📊 Solo si necesitas logs detallados |
| `@nestjs/core` | Funcionalidades core | 🛡️ Solo para guards personalizados |

**🎯 Recomendación por tipo de proyecto:**

```bash
# 🏠 Proyecto pequeño/personal
npm install @nestjs/throttler @nestjs/config

# 🏢 Proyecto mediano/empresarial
npm install @nestjs/throttler @nestjs/config @nestjs/core winston

# 🚀 Proyecto grande/producción
npm install @nestjs/throttler @nestjs/config @nestjs/throttler-storage-redis redis winston
```

---

### ⚙️ **Paso 2: Configuración súper simple**

Vamos a empezar con la configuración más básica posible:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // 🚦 Configuración básica de Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,  // ⏰ TTL = Time To Live = 60 segundos (1 minuto)
      limit: 100,  // 🔢 Máximo 100 requests por minuto
    }]),
    
    // ... tus otros módulos
  ],
  providers: [
    // 🛡️ Aplicar rate limiting a TODA la aplicación
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    
    // ... tus otros providers
  ],
})
export class AppModule {}
```

**🤔 ¿Qué significa cada parte?**

| Parámetro | ¿Qué es? | Ejemplo |
|-----------|----------|----------|
| `ttl: 60000` | Tiempo en milisegundos para resetear el contador | 60000ms = 1 minuto |
| `limit: 100` | Máximo número de requests permitidos | 100 requests |
| `APP_GUARD` | Aplica el guard a toda la app automáticamente | Protege todos los endpoints |
| `ThrottlerGuard` | El guard que hace la magia del rate limiting | Cuenta y bloquea requests |

**🎯 Resultado:** Ahora TODOS tus endpoints están limitados a 100 requests por minuto por IP.

---

### 🧪 **Paso 3: Probar que funciona**

Vamos a crear un endpoint simple para probar:

```typescript
// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  
  @Get('test')
  testRateLimit() {
    return {
      message: '¡Rate limiting funcionando!',
      timestamp: new Date().toISOString(),
    };
  }
}
```

**🔬 Cómo probar:**

1. **Inicia tu servidor:**
   ```bash
   npm run start:dev
   ```

2. **Haz requests normales (deberían funcionar):**
   ```bash
   # En otra terminal
   curl http://localhost:3000/test
   # Respuesta: {"message":"¡Rate limiting funcionando!", ...}
   ```

3. **Haz muchos requests rápidos (deberían bloquearse):**
   ```bash
   # Hacer 105 requests rápidos (más del límite de 100)
   for i in {1..105}; do curl http://localhost:3000/test; done
   ```

4. **Después del request 100, deberías ver:**
   ```json
   {"statusCode":429,"message":"ThrottlerException: Too Many Requests"}
   ```

**🎉 ¡Felicidades! Tu rate limiting está funcionando.**

---

### 📊 **Paso 4: Entender las respuestas**

Cuando el rate limiting está activo, verás estos headers en las respuestas:

```http
# ✅ Request permitido
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200

# ❌ Request bloqueado
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 45
```

**🔍 ¿Qué significa cada header?**

| Header | ¿Qué te dice? | Ejemplo |
|--------|---------------|----------|
| `X-RateLimit-Limit` | Límite total configurado | 100 requests |
| `X-RateLimit-Remaining` | Cuántos requests te quedan | 95 requests restantes |
| `X-RateLimit-Reset` | Cuándo se resetea el contador | Timestamp Unix |
| `Retry-After` | Cuántos segundos esperar | 45 segundos |

---

### 🎛️ **Configuración simple**

#### 🔧 **Opción 1: Configuración directa (más simple)**

```typescript
// Para proyectos pequeños - configuración fija
ThrottlerModule.forRoot([{
  ttl: 60000,   // 1 minuto
  limit: 100,   // 100 requests
}])
```

#### 🔧 **Opción 2: Con variables de entorno (recomendado)**

```typescript
// src/app.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // 📁 Cargar variables de entorno
    ConfigModule.forRoot(),
    
    // 🚦 Rate limiting con configuración flexible
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => [{
        ttl: config.get('THROTTLE_TTL') || 60000,     // Default: 1 minuto
        limit: config.get('THROTTLE_LIMIT') || 100,   // Default: 100 requests
      }],
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

**📄 Archivo .env:**
```env
# .env
# 🚦 Configuración de Rate Limiting
THROTTLE_TTL=60000    # 1 minuto en milisegundos
THROTTLE_LIMIT=100    # 100 requests por minuto

# 🌍 Configuración por ambiente
# Desarrollo: más permisivo
# Producción: más restrictivo
```

**🎯 Ventajas de usar variables de entorno:**
- Puedes cambiar límites sin recompilar
- Diferentes configuraciones por ambiente (dev/prod)
- Más seguro (no hardcodeas valores)
- Más fácil de mantener

---

### 🎨 **Configuraciones comunes para proyectos pequeños**

#### 🏠 **Blog Personal / Portfolio**
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,   // 1 minuto
  limit: 200,   // 200 requests (generoso para visitantes)
}])
```

#### 🛒 **E-commerce Pequeño**
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,   // 1 minuto
  limit: 100,   // 100 requests (balance entre uso y protección)
}])
```

#### 📱 **App Móvil Simple**
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,   // 1 minuto
  limit: 150,   // 150 requests (apps móviles hacen más requests)
}])
```

#### 🔐 **API Interna**
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,   // 1 minuto
  limit: 500,   // 500 requests (más permisivo para uso interno)
}])
```

---

## 🎯 **Mejores Prácticas**

### ✅ **DO - Qué SÍ hacer**

#### 🔧 **Configuración**
- ✅ **Usar variables de entorno** para límites (fácil cambio sin recompilar)
- ✅ **Configurar diferentes límites por endpoint** según su "costo"
- ✅ **Usar Redis en producción** si tienes múltiples instancias
- ✅ **Configurar límites generosos al inicio** y ajustar según métricas
- ✅ **Documentar tus límites** para que el frontend sepa qué esperar

#### 🛡️ **Seguridad**
- ✅ **Límites muy bajos para login** (5-10 por minuto)
- ✅ **Límites muy bajos para registro** (3-5 por hora)
- ✅ **Saltar rate limiting para health checks** (monitoreo)
- ✅ **Rate limiting por usuario autenticado** en lugar de solo IP
- ✅ **Logs detallados** de requests bloqueados

#### 📊 **Monitoreo**
- ✅ **Métricas de requests bloqueados** vs permitidos
- ✅ **Alertas cuando el rate de bloqueo es muy alto**
- ✅ **Dashboard con estadísticas en tiempo real**
- ✅ **Análisis de patrones** de uso por endpoint

### ❌ **DON'T - Qué NO hacer**

#### 🚫 **Errores comunes**
- ❌ **Límites demasiado bajos** que afecten UX normal
- ❌ **Límites demasiado altos** que no protejan contra ataques
- ❌ **Hardcodear límites** en el código (usar variables de entorno)
- ❌ **Aplicar rate limiting a health checks** (rompe monitoreo)
- ❌ **No monitorear** el rate de bloqueo

#### 🚫 **Problemas de rendimiento**
- ❌ **Usar memoria local** en aplicaciones con múltiples instancias
- ❌ **No configurar Redis correctamente** (timeouts, reconexión)
- ❌ **Crear guards complejos** que ralenticen cada request
- ❌ **No usar cache** para decisiones de rate limiting

---

## 🔧 **Troubleshooting - Solución de Problemas**

### 🚨 **Problema: "Rate limiting no funciona"**

**Síntomas:**
- Puedes hacer más requests de los configurados
- No ves headers de rate limiting

**Soluciones:**

1. **Verificar que el guard esté aplicado:**
   ```typescript
   // ✅ Correcto - en app.module.ts
   providers: [
     {
       provide: APP_GUARD,
       useClass: ThrottlerGuard,
     },
   ]
   ```

2. **Verificar configuración:**
   ```typescript
   // ❌ Incorrecto
   ThrottlerModule.forRoot({
     ttl: 60000,
     limit: 100,
   })
   
   // ✅ Correcto
   ThrottlerModule.forRoot([{
     ttl: 60000,
     limit: 100,
   }])
   ```

3. **Verificar que no estés saltando el throttling:**
   ```typescript
   // ❌ Esto salta el rate limiting
   @SkipThrottle()
   @Get('test')
   ```

### 🚨 **Problema: "Redis connection failed"**

**Síntomas:**
- Error al iniciar la aplicación
- Rate limiting funciona pero no persiste entre reinicios

**Soluciones:**

1. **Verificar que Redis esté corriendo:**
   ```bash
   # Probar conexión
   redis-cli ping
   # Debería responder: PONG
   ```

2. **Verificar configuración de conexión:**
   ```typescript
   // Agregar logs para debug
   storage: new ThrottlerStorageRedisService({
     host: config.get('REDIS_HOST'),
     port: config.get('REDIS_PORT'),
     password: config.get('REDIS_PASSWORD'),
     // 🔍 Agregar logs
     onConnect: () => console.log('✅ Redis connected'),
     onError: (err) => console.error('❌ Redis error:', err),
   })
   ```

3. **Configurar fallback a memoria:**
   ```typescript
   // Si Redis falla, usar memoria local
   const storage = config.get('REDIS_HOST') 
     ? new ThrottlerStorageRedisService({ /* config */ })
     : undefined; // Usa memoria por defecto
   ```

### 🚨 **Problema: "Usuarios legítimos bloqueados"**

**Síntomas:**
- Usuarios normales reportan error 429
- Rate de bloqueo muy alto en métricas

**Soluciones:**

1. **Revisar límites por endpoint:**
   ```typescript
   // ❌ Muy restrictivo
   @Throttle({ default: { limit: 5, ttl: 60000 } })
   @Get('products') // Lista de productos
   
   // ✅ Más apropiado
   @Throttle({ default: { limit: 100, ttl: 60000 } })
   @Get('products')
   ```

2. **Implementar rate limiting por usuario:**
   ```typescript
   // En lugar de solo por IP
   protected async getTracker(req: any): Promise<string> {
     return req.user?.id ? `user-${req.user.id}` : req.ip;
   }
   ```

3. **Configurar límites dinámicos:**
   ```typescript
   // Límites más altos para usuarios autenticados
   protected async getThrottlerLimit(): Promise<number> {
     return req.user ? 200 : 50; // Autenticado vs anónimo
   }
   ```

### 🚨 **Problema: "Performance degradado"**

**Síntomas:**
- API más lenta después de implementar rate limiting
- Timeouts en Redis

**Soluciones:**

1. **Optimizar configuración de Redis:**
   ```typescript
   storage: new ThrottlerStorageRedisService({
     // 🚀 Configuraciones de rendimiento
     connectTimeout: 1000,     // Timeout corto
     commandTimeout: 500,      // Comandos rápidos
     lazyConnect: true,        // Conexión bajo demanda
     maxRetriesPerRequest: 2,  // Pocos reintentos
     retryDelayOnFailover: 50, // Retry rápido
   })
   ```

2. **Usar cache local + Redis:**
   ```typescript
   // Implementar cache híbrido para mejor rendimiento
   // (Avanzado - requiere implementación custom)
   ```

---

## 🎓 **Conclusión**

### 🎯 **¿Qué aprendiste?**

**Nivel Básico:**
- ✅ Qué es rate limiting y por qué es importante
- ✅ Configuración básica con `@nestjs/throttler`
- ✅ Aplicar límites globales a toda tu API
- ✅ Probar que funciona correctamente

**Nivel Intermedio:**
- ✅ Configurar límites específicos por endpoint
- ✅ Usar múltiples configuraciones simultáneas
- ✅ Rate limiting por usuario autenticado
- ✅ Saltar rate limiting en endpoints específicos

**Nivel Avanzado:**
- ✅ Configurar Redis para aplicaciones distribuidas
- ✅ Rate limiting inteligente (bots, horarios, regiones)
- ✅ Monitoreo y métricas avanzadas
- ✅ Configuración para producción

### 🚀 **Próximos pasos recomendados**

1. **Implementa el nivel básico** en tu proyecto actual
2. **Monitorea las métricas** durante una semana
3. **Ajusta los límites** según el comportamiento real
4. **Agrega configuraciones específicas** para endpoints críticos
5. **Implementa Redis** cuando tengas múltiples instancias
6. **Configura alertas** para detectar ataques

### 💡 **Recursos adicionales**

- 📚 [Documentación oficial de @nestjs/throttler](https://docs.nestjs.com/security/rate-limiting)
- 🔧 [Redis Documentation](https://redis.io/documentation)
- 📊 [Rate Limiting Patterns](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- 🛡️ [OWASP Rate Limiting Guide](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)

### 🎉 **¡Felicidades!**

Ahora tienes el conocimiento para implementar rate limiting robusto en cualquier aplicación NestJS, desde proyectos pequeños hasta aplicaciones empresariales de gran escala.

**Recuerda:** El rate limiting es una herramienta de seguridad y rendimiento. Úsala sabiamente para proteger tu API sin afectar la experiencia de tus usuarios legítimos.

---

## 🚀 Implementación Básica

### 1. Rate Limiting Global

```typescript
// app.module.ts - Configuración dinámica
ThrottlerModule.forRootAsync({
  useFactory: () => ({
    throttlers: [
      {
        name: 'default',
        ttl: parseInt(process.env.THROTTLE_TTL) || 60000,
        limit: parseInt(process.env.THROTTLE_LIMIT) || 100,
      },
    ],
  }),
}),
```

### 2. Rate Limiting por Controlador

```typescript
// users.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('users')
@Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 por minuto
export class UsersController {
  
  @Get()
  findAll() {
    return 'Lista de usuarios';
  }
  
  @Get('profile')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Override: 10 por minuto
  getProfile() {
    return 'Perfil del usuario';
  }
}
```

### 3. Rate Limiting por Endpoint

```typescript
// auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 registros por 5 minutos
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
  
  @Post('forgot-password')
  @Throttle({ default: { limit: 2, ttl: 600000 } }) // 2 por 10 minutos
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotDto);
  }
  
  @Post('verify-email')
  @SkipThrottle() // Sin límites para verificación
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyDto);
  }
}
```

---

## 🔧 Rate Limiting Avanzado

### 1. Múltiples Configuraciones

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  {
    name: 'auth',
    ttl: 60000,  // 1 minuto
    limit: 5,    // 5 solicitudes
  },
  {
    name: 'api',
    ttl: 60000,  // 1 minuto
    limit: 100,  // 100 solicitudes
  },
  {
    name: 'upload',
    ttl: 3600000, // 1 hora
    limit: 10,    // 10 archivos
  },
]),
```

### 2. Uso de Configuraciones Específicas

```typescript
// Diferentes límites por contexto
@Controller('api')
export class ApiController {
  
  @Get('search')
  @Throttle({ api: { limit: 50, ttl: 60000 } })
  search() {
    return 'Resultados de búsqueda';
  }
  
  @Post('upload')
  @Throttle({ upload: { limit: 5, ttl: 3600000 } })
  uploadFile() {
    return 'Archivo subido';
  }
  
  @Post('auth/login')
  @Throttle({ auth: { limit: 3, ttl: 60000 } })
  login() {
    return 'Login exitoso';
  }
}
```

---

## 🗄️ Configuración con Redis

### 1. Instalación de Redis

```bash
npm install @nestjs/cache-manager cache-manager-redis-store redis
```

### 2. Configuración de Redis Storage

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    // Configurar Redis para cache
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0,
    }),
    
    // Throttler con Redis
    ThrottlerModule.forRootAsync({
      imports: [CacheModule],
      inject: [CACHE_MANAGER],
      useFactory: (cache: Cache) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000,
            limit: 100,
          },
        ],
        storage: new ThrottlerStorageRedisService(cache),
      }),
    }),
  ],
})
export class AppModule {}
```

### 3. Servicio de Storage Personalizado

```typescript
// throttler-storage-redis.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ThrottlerStorage } from '@nestjs/throttler';

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getRecord(key: string): Promise<number[]> {
    const record = await this.cacheManager.get<number[]>(key);
    return record || [];
  }

  async addRecord(key: string, ttl: number): Promise<void> {
    const record = await this.getRecord(key);
    const now = Date.now();
    
    // Limpiar registros expirados
    const validRecords = record.filter(time => now - time < ttl * 1000);
    
    // Agregar nuevo registro
    validRecords.push(now);
    
    // Guardar en Redis
    await this.cacheManager.set(key, validRecords, ttl);
  }
}
```

---

## 🛡️ Guards Personalizados

### 1. Guard Básico Personalizado

```typescript
// custom-throttler.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  
  // Personalizar cómo se obtiene el identificador del cliente
  protected async getTracker(req: any): Promise<string> {
    // Si hay usuario autenticado, usar su ID
    if (req.user?.id) {
      return `user-${req.user.id}`;
    }
    
    // Si hay API key, usarla
    if (req.headers['x-api-key']) {
      return `api-${req.headers['x-api-key']}`;
    }
    
    // Por defecto, usar IP
    return req.ip;
  }
  
  // Personalizar si se debe saltar el throttling
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Saltar para usuarios admin
    if (request.user?.permissions?.includes('ADMIN')) {
      return true;
    }
    
    // Saltar para IPs de confianza
    const trustedIPs = ['127.0.0.1', '::1'];
    if (trustedIPs.includes(request.ip)) {
      return true;
    }
    
    return false;
  }
  
  // Personalizar límites dinámicamente
  protected async getLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    
    // Límites según tipo de usuario
    if (request.user?.subscription === 'premium') {
      return 1000; // Premium: 1000 por minuto
    }
    
    if (request.user?.subscription === 'basic') {
      return 100; // Básico: 100 por minuto
    }
    
    return 50; // Anónimo: 50 por minuto
  }
}
```

### 2. Guard para Diferentes Tipos de Usuario

```typescript
// user-type-throttler.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserTypeThrottlerGuard extends ThrottlerGuard {
  
  protected async getTracker(req: any): Promise<string> {
    const userType = this.getUserType(req);
    const identifier = req.user?.id || req.ip;
    return `${userType}-${identifier}`;
  }
  
  protected async getLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const userType = this.getUserType(request);
    
    const limits = {
      admin: 10000,
      premium: 1000,
      basic: 100,
      anonymous: 50,
    };
    
    return limits[userType] || limits.anonymous;
  }
  
  private getUserType(req: any): string {
    if (req.user?.permissions?.includes('ADMIN')) return 'admin';
    if (req.user?.subscription === 'premium') return 'premium';
    if (req.user?.subscription === 'basic') return 'basic';
    return 'anonymous';
  }
}
```

---

## 🎨 Decoradores Personalizados

### 1. Decorador para Rate Limiting por Rol

```typescript
// decorators/role-throttle.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

export interface RoleThrottleConfig {
  admin?: { limit: number; ttl: number };
  premium?: { limit: number; ttl: number };
  basic?: { limit: number; ttl: number };
  anonymous?: { limit: number; ttl: number };
}

export const ROLE_THROTTLE_KEY = 'role_throttle';

export const RoleThrottle = (config: RoleThrottleConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(ROLE_THROTTLE_KEY, config)(target, propertyKey, descriptor);
  };
};
```

### 2. Decorador para API Rate Limiting

```typescript
// decorators/api-throttle.decorator.ts
import { Throttle } from '@nestjs/throttler';

// Presets comunes
export const AuthThrottle = () => Throttle({ default: { limit: 5, ttl: 60000 } });
export const SearchThrottle = () => Throttle({ default: { limit: 100, ttl: 60000 } });
export const UploadThrottle = () => Throttle({ default: { limit: 10, ttl: 3600000 } });
export const EmailThrottle = () => Throttle({ default: { limit: 3, ttl: 300000 } });

// Decorador dinámico
export const ApiThrottle = (limit: number, ttlMinutes: number = 1) => {
  return Throttle({ default: { limit, ttl: ttlMinutes * 60000 } });
};
```

### 3. Uso de Decoradores Personalizados

```typescript
// auth.controller.ts
import { Controller, Post } from '@nestjs/common';
import { AuthThrottle, EmailThrottle, ApiThrottle } from './decorators';

@Controller('auth')
export class AuthController {
  
  @Post('login')
  @AuthThrottle() // 5 intentos por minuto
  login() {
    return 'Login';
  }
  
  @Post('send-verification')
  @EmailThrottle() // 3 emails por 5 minutos
  sendVerification() {
    return 'Email enviado';
  }
  
  @Post('reset-password')
  @ApiThrottle(2, 10) // 2 intentos por 10 minutos
  resetPassword() {
    return 'Password reset';
  }
}
```

---

## ⚠️ Manejo de Errores

### 1. Interceptor para Rate Limiting

```typescript
// interceptors/throttle-exception.interceptor.ts
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
export class ThrottleExceptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof ThrottlerException) {
          const request = context.switchToHttp().getRequest();
          const response = context.switchToHttp().getResponse();
          
          // Agregar headers informativos
          response.setHeader('X-RateLimit-Limit', '100');
          response.setHeader('X-RateLimit-Remaining', '0');
          response.setHeader('X-RateLimit-Reset', Date.now() + 60000);
          
          // Log del evento
          console.log(`Rate limit exceeded for ${request.ip} on ${request.url}`);
          
          // Respuesta personalizada
          return throwError(() => new HttpException({
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
            error: 'Too Many Requests',
            retryAfter: 60, // segundos
          }, HttpStatus.TOO_MANY_REQUESTS));
        }
        
        return throwError(() => error);
      }),
    );
  }
}
```

### 2. Filtro de Excepciones Global

```typescript
// filters/throttle-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(ThrottlerException)
export class ThrottleExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    
    const status = HttpStatus.TOO_MANY_REQUESTS;
    
    // Headers de rate limiting
    response.setHeader('X-RateLimit-Limit', '100');
    response.setHeader('X-RateLimit-Remaining', '0');
    response.setHeader('X-RateLimit-Reset', Date.now() + 60000);
    response.setHeader('Retry-After', '60');
    
    // Respuesta estructurada
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Límite de solicitudes excedido',
      error: 'Too Many Requests',
      retryAfter: 60,
      details: {
        limit: 100,
        windowMs: 60000,
        remaining: 0,
      },
    });
  }
}
```

### 3. Configuración Global de Manejo de Errores

```typescript
// app.module.ts
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ThrottleExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleExceptionInterceptor,
    },
  ],
})
export class AppModule {}
```

---

## 🧪 Testing

### 1. Test Unitario del Guard

```typescript
// custom-throttler.guard.spec.ts
import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { CustomThrottlerGuard } from './custom-throttler.guard';
import { ThrottlerModule } from '@nestjs/throttler';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      providers: [CustomThrottlerGuard],
    }).compile();
    
    guard = module.get<CustomThrottlerGuard>(CustomThrottlerGuard);
  });
  
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
  
  it('should use user ID as tracker when user is authenticated', async () => {
    const mockRequest = {
      user: { id: '123' },
      ip: '192.168.1.1',
    };
    
    const tracker = await guard['getTracker'](mockRequest);
    expect(tracker).toBe('user-123');
  });
  
  it('should use IP as tracker when user is not authenticated', async () => {
    const mockRequest = {
      ip: '192.168.1.1',
    };
    
    const tracker = await guard['getTracker'](mockRequest);
    expect(tracker).toBe('192.168.1.1');
  });
  
  it('should skip throttling for admin users', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { permissions: ['ADMIN'] },
        }),
      }),
    } as ExecutionContext;
    
    const shouldSkip = await guard['shouldSkip'](mockContext);
    expect(shouldSkip).toBe(true);
  });
});
```

### 2. Test de Integración

```typescript
// throttle.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  afterEach(async () => {
    await app.close();
  });
  
  describe('/auth/login (POST)', () => {
    it('should allow requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'test@test.com', password: 'password' })
          .expect((res) => {
            expect(res.status).not.toBe(429);
          });
      }
    });
    
    it('should block requests exceeding limit', async () => {
      // Hacer 5 solicitudes (límite)
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'test@test.com', password: 'password' });
      }
      
      // La sexta debería ser bloqueada
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password' })
        .expect(429)
        .expect((res) => {
          expect(res.body.message).toContain('Límite de solicitudes excedido');
          expect(res.headers['retry-after']).toBeDefined();
        });
    });
    
    it('should include rate limit headers', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'password' })
        .expect((res) => {
          expect(res.headers['x-ratelimit-limit']).toBeDefined();
          expect(res.headers['x-ratelimit-remaining']).toBeDefined();
        });
    });
  });
  
  describe('Different endpoints with different limits', () => {
    it('should apply different limits to different endpoints', async () => {
      // Test endpoint con límite alto
      for (let i = 0; i < 50; i++) {
        await request(app.getHttpServer())
          .get('/api/search')
          .expect((res) => {
            expect(res.status).not.toBe(429);
          });
      }
      
      // Test endpoint con límite bajo
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: 'test@test.com' });
      }
      
      // La cuarta debería ser bloqueada
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test@test.com' })
        .expect(429);
    });
  });
});
```

---

## 📈 Mejores Prácticas

### 🔧 Configuración Inteligente

1. **Límites Graduales**
   ```typescript
   // Diferentes límites según criticidad
   const rateLimits = {
     // Endpoints críticos - límites estrictos
     auth: { limit: 5, ttl: 60000 },
     payment: { limit: 3, ttl: 300000 },
     
     // Endpoints de lectura - límites moderados
     search: { limit: 100, ttl: 60000 },
     profile: { limit: 50, ttl: 60000 },
     
     // Endpoints públicos - límites altos
     public: { limit: 1000, ttl: 60000 },
   };
   ```

2. **Identificación Inteligente**
   ```typescript
   protected async getTracker(req: any): Promise<string> {
     // Prioridad: Usuario > API Key > IP
     if (req.user?.id) {
       return `user:${req.user.id}`;
     }
     
     if (req.headers['x-api-key']) {
       return `api:${req.headers['x-api-key']}`;
     }
     
     // Para IPs, considerar proxies
     const ip = req.headers['x-forwarded-for'] || 
                req.headers['x-real-ip'] || 
                req.connection.remoteAddress || 
                req.ip;
     
     return `ip:${ip}`;
   }
   ```

### 🛡️ Seguridad Avanzada

1. **Detección de Patrones Sospechosos**
   ```typescript
   @Injectable()
   export class SecurityThrottlerGuard extends ThrottlerGuard {
     private suspiciousIPs = new Set<string>();
     
     protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
       const request = context.switchToHttp().getRequest();
       
       // Bloquear IPs sospechosas
       if (this.suspiciousIPs.has(request.ip)) {
         throw new ForbiddenException('IP bloqueada por actividad sospechosa');
       }
       
       return super.shouldSkip(context);
     }
     
     async handleRequest(context: ExecutionContext, limit: number, ttl: number): Promise<boolean> {
       try {
         return await super.handleRequest(context, limit, ttl);
       } catch (error) {
         if (error instanceof ThrottlerException) {
           await this.handleViolation(context);
         }
         throw error;
       }
     }
     
     private async handleViolation(context: ExecutionContext) {
       const request = context.switchToHttp().getRequest();
       const violations = await this.getViolationCount(request.ip);
       
       if (violations > 10) {
         this.suspiciousIPs.add(request.ip);
         // Notificar al sistema de seguridad
         await this.notifySecurityTeam(request.ip, violations);
       }
     }
   }
   ```

2. **Whitelist Dinámica**
   ```typescript
   @Injectable()
   export class DynamicWhitelistService {
     private trustedIPs = new Set<string>();
     
     async addTrustedIP(ip: string, duration: number = 3600000) {
       this.trustedIPs.add(ip);
       
       // Remover después del tiempo especificado
       setTimeout(() => {
         this.trustedIPs.delete(ip);
       }, duration);
     }
     
     isTrusted(ip: string): boolean {
       return this.trustedIPs.has(ip);
     }
   }
   ```

### 📊 Monitoreo y Métricas

1. **Servicio de Métricas**
   ```typescript
   @Injectable()
   export class RateLimitMetricsService {
     private violations = new Map<string, number>();
     
     recordViolation(ip: string, endpoint: string) {
       const key = `${ip}:${endpoint}`;
       this.violations.set(key, (this.violations.get(key) || 0) + 1);
     }
     
     getMetrics() {
       return {
         totalViolations: Array.from(this.violations.values()).reduce((a, b) => a + b, 0),
         uniqueViolators: this.violations.size,
         topViolators: this.getTopViolators(),
         violationsByEndpoint: this.getViolationsByEndpoint(),
       };
     }
     
     private getTopViolators() {
       return Array.from(this.violations.entries())
         .sort(([,a], [,b]) => b - a)
         .slice(0, 10);
     }
   }
   ```

2. **Logging Estructurado**
   ```typescript
   @Injectable()
   export class RateLimitLogger {
     private logger = new Logger('RateLimit');
     
     logViolation(context: ExecutionContext, limit: number, ttl: number) {
       const request = context.switchToHttp().getRequest();
       
       this.logger.warn({
         event: 'RATE_LIMIT_VIOLATION',
         ip: request.ip,
         userAgent: request.headers['user-agent'],
         endpoint: request.url,
         method: request.method,
         userId: request.user?.id,
         limit,
         ttl,
         timestamp: new Date().toISOString(),
       });
     }
   }
   ```

---

## 🚀 Configuración de Producción

### Docker Compose con Redis

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
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 256M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app

volumes:
  redis_data:
```

### Configuración de Nginx

```nginx
# nginx.conf
http {
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=1r/m;
    
    upstream backend {
        least_conn;
        server app:3000 max_fails=3 fail_timeout=30s;
        server app:3001 max_fails=3 fail_timeout=30s;
        server app:3002 max_fails=3 fail_timeout=30s;
    }
    
    server {
        listen 80;
        server_name api.tudominio.com;
        
        # Headers de seguridad
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        
        # Rate limiting por endpoint
        location /auth/ {
            limit_req zone=auth burst=5 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
        }
        
        location /api/upload {
            limit_req zone=upload burst=2 nodelay;
            
            # Límite de tamaño de archivo
            client_max_body_size 10M;
            
            proxy_pass http://backend;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        location / {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $host;
        }
    }
}
```

### Variables de Entorno de Producción

```env
# .env.production
NODE_ENV=production

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
THROTTLE_AUTH_LIMIT=5
THROTTLE_UPLOAD_LIMIT=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
REDIS_DB=0

# Seguridad
TRUSTED_IPS=127.0.0.1,::1,10.0.0.0/8
ADMIN_IPS=192.168.1.100,203.0.113.0/24

# Monitoreo
METRICS_ENABLED=true
LOG_LEVEL=warn
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## 📋 Checklist de Implementación

### ✅ Configuración Básica
- [ ] ThrottlerModule instalado y configurado
- [ ] Guards globales aplicados
- [ ] Variables de entorno configuradas
- [ ] Redis configurado para producción

### ✅ Rate Limiting por Endpoint
- [ ] Límites específicos para autenticación
- [ ] Límites para endpoints de búsqueda
- [ ] Límites para subida de archivos
- [ ] Límites para endpoints críticos

### ✅ Guards Personalizados
- [ ] Guard para diferentes tipos de usuario
- [ ] Identificación inteligente (usuario/IP/API key)
- [ ] Whitelist de IPs implementada
- [ ] Detección de actividad sospechosa

### ✅ Manejo de Errores
- [ ] Filtros de excepción configurados
- [ ] Headers de rate limiting incluidos
- [ ] Mensajes de error personalizados
- [ ] Logging de violaciones implementado

### ✅ Testing
- [ ] Tests unitarios de guards
- [ ] Tests de integración E2E
- [ ] Tests de límites por endpoint
- [ ] Tests de comportamiento con Redis

### ✅ Monitoreo
- [ ] Métricas de rate limiting
- [ ] Alertas automáticas configuradas
- [ ] Dashboard de monitoreo
- [ ] Logs estructurados implementados

### ✅ Producción
- [ ] Configuración de Docker/Redis
- [ ] Nginx con rate limiting
- [ ] Variables de entorno seguras
- [ ] Procedimientos de respuesta a incidentes

---

## 🎯 Conclusión

Este manual te proporciona una implementación completa de **Rate Limiting en NestJS** que incluye:

### 🔒 **Protección Robusta**
- Prevención de ataques DDoS y fuerza bruta
- Límites inteligentes según tipo de usuario
- Detección automática de actividad sospechosa

### ⚡ **Escalabilidad**
- Configuración con Redis para clusters
- Load balancing con Nginx
- Optimización de recursos del servidor

### 📊 **Visibilidad Completa**
- Monitoreo en tiempo real
- Métricas detalladas de uso
- Alertas automáticas de seguridad

### 🛠️ **Flexibilidad**
- Configuración por endpoint
- Guards personalizables
- Decoradores reutilizables

¡Tu API ahora está protegida contra abusos y lista para escalar! 🚀
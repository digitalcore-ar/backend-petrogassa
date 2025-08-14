# 🕵️ Manual: Interceptor de Auditoría EXPLICADO - Proyecto Petrogassa

## 🤔 **¿Qué es un Interceptor?**

Un **interceptor** es como un "espía" que se mete en el medio de todas las peticiones HTTP que llegan a tu API.

### **Analogía Simple:**
Imagínate que eres el portero de un edificio:
- **SIN interceptor:** Las personas entran y salen, pero no sabes quién, cuándo ni qué hicieron
- **CON interceptor:** Anotas en un cuaderno: "Juan entró a las 10:30, fue al piso 3, salió a las 11:00"

### **En tu API:**
- **SIN interceptor:** Los usuarios crean/editan/eliminan datos, pero no queda registro automático
- **CON interceptor:** Automáticamente se guarda: quién, qué, cuándo, desde dónde

---

## 🔍 **¿Cómo Funciona el Interceptor?**

### **Flujo Normal (SIN interceptor):**
```
1. Usuario hace POST /vehiculos
2. Controller recibe la petición
3. Service crea el vehículo
4. Se devuelve respuesta
```

### **Flujo CON Interceptor:**
```
1. Usuario hace POST /vehiculos
2. 🕵️ INTERCEPTOR: "Ojo, alguien va a crear algo"
3. Controller recibe la petición
4. Service crea el vehículo
5. 🕵️ INTERCEPTOR: "Ya terminó, voy a guardar qué pasó"
6. Se guarda en audit_logs: quién, qué, cuándo
7. Se devuelve respuesta
```

---

## 📝 **Código del Interceptor EXPLICADO Línea por Línea**

### **1. Imports y Decorador**
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
```

**¿Qué hace cada import?**
- `NestInterceptor`: La "interfaz" que debe cumplir nuestro espía
- `ExecutionContext`: Info sobre la petición actual (usuario, URL, método)
- `CallHandler`: Para "continuar" con la petición normal
- `Observable` y `tap`: Para "escuchar" cuando termina la operación
- `AuditLog`: Nuestra tabla donde guardamos el historial

### **2. Constructor**
```typescript
constructor(
  @InjectRepository(AuditLog)
  private auditRepository: Repository<AuditLog>,
) {}
```

**¿Para qué?**
- Inyecta el repositorio de `AuditLog`
- Es como decir: "Dame acceso a la tabla audit_logs para poder guardar registros"

### **3. Método Principal - intercept()**
```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const request = context.switchToHttp().getRequest();
  const user = request.user;
  const method = request.method;
  const url = request.url;
```

**¿Qué hace cada línea?**
- `context.switchToHttp().getRequest()`: Obtiene la petición HTTP completa
- `request.user`: El usuario que está logueado (viene del JWT)
- `request.method`: GET, POST, PATCH, DELETE
- `request.url`: /vehiculos, /users/123, etc.

**Ejemplo real:**
```javascript
// Si Juan hace: PATCH /vehiculos/123
user = { id: "juan-123", email: "juan@petrogassa.com" }
method = "PATCH"
url = "/vehiculos/123"
```

### **4. Continuar y Escuchar**
```typescript
return next.handle().pipe(
  tap(async (data) => {
    // Aquí se ejecuta DESPUÉS de que termina la operación
  }),
);
```

**¿Qué significa esto?**
- `next.handle()`: "Continúa con la operación normal (controller → service)"
- `.pipe(tap(...))`: "Cuando termine, ejecuta esta función"
- `data`: La respuesta que se va a devolver al usuario

**Analogía:**
```
🕵️ Interceptor: "Adelante, haz tu trabajo"
👨‍💼 Controller: "Voy a crear un vehículo"
🔧 Service: "Listo, vehículo creado"
👨‍💼 Controller: "Aquí está la respuesta"
🕵️ Interceptor: "Perfecto, ahora voy a anotar qué pasó"
```

### **5. Filtrar Qué Operaciones Auditar**
```typescript
if (user && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
  // Solo auditar si:
  // 1. Hay un usuario logueado
  // 2. Es una operación que modifica datos
}
```

**¿Por qué este filtro?**
- `user`: Si no hay usuario, no tiene sentido auditar
- `POST/PATCH/DELETE`: Solo operaciones que cambian datos
- **NO auditamos GET**: Porque solo consulta, no modifica

### **6. Guardar el Registro de Auditoría**
```typescript
await this.auditRepository.save({
  tableName: this.extractTableName(url),
  recordId: data?.id || request.params?.id,
  action: this.mapMethodToAction(method),
  userId: user.id,
  newValues: method !== 'DELETE' ? data : null,
  ipAddress: request.ip,
  userAgent: request.get('User-Agent'),
});
```

**¿Qué guarda cada campo?**
- `tableName`: "vehiculos", "users", etc. (extraído de la URL)
- `recordId`: ID del registro que se modificó
- `action`: "CREATE", "UPDATE", "DELETE"
- `userId`: Quién hizo la operación
- `newValues`: Los datos nuevos (excepto en DELETE)
- `ipAddress`: Desde qué IP se conectó
- `userAgent`: Qué navegador/app usó

### **7. Métodos Auxiliares**

#### **extractTableName()**
```typescript
private extractTableName(url: string): string {
  // /vehiculos/123 -> vehiculos
  return url.split('/')[1];
}
```

**¿Cómo funciona?**
```javascript
// Ejemplos:
url = "/vehiculos/123"     → split('/') = ["", "vehiculos", "123"] → [1] = "vehiculos"
url = "/users"             → split('/') = ["", "users"]           → [1] = "users"
url = "/auth/login"        → split('/') = ["", "auth", "login"]    → [1] = "auth"
```

#### **mapMethodToAction()**
```typescript
private mapMethodToAction(method: string): string {
  const map = {
    'POST': 'CREATE',
    'PATCH': 'UPDATE',
    'PUT': 'UPDATE',
    'DELETE': 'DELETE',
  };
  return map[method] || 'UNKNOWN';
}
```

**¿Para qué?**
Convierte métodos HTTP en acciones más claras:
- `POST` → `CREATE` (más entendible)
- `PATCH` → `UPDATE`
- `DELETE` → `DELETE`

---

## 🎬 **Ejemplo Paso a Paso**

### **Escenario:** Juan edita un vehículo

#### **1. Petición:**
```http
PATCH /vehiculos/abc-123
Authorization: Bearer <token_de_juan>
Content-Type: application/json

{
  "marca": "Toyota",
  "modelo": "Corolla"
}
```

#### **2. Interceptor - ANTES:**
```typescript
// El interceptor "escucha" la petición
const request = context.switchToHttp().getRequest();
const user = request.user;     // { id: "juan-123", email: "juan@petrogassa.com" }
const method = request.method; // "PATCH"
const url = request.url;       // "/vehiculos/abc-123"

// Dice: "Ok, continúa con la operación normal"
return next.handle().pipe(...);
```

#### **3. Operación Normal:**
```typescript
// Controller recibe la petición
@Patch(':id')
update(@Param('id') id: string, @Body() dto: UpdateVehiculoDto, @GetUser() user: User) {
  return this.vehiculosService.update(id, dto, user);
}

// Service actualiza el vehículo
async update(id: string, dto: UpdateVehiculoDto, user: User) {
  await this.repository.update(id, { ...dto, updatedBy: user.id });
  return await this.findOne(id);
}
```

#### **4. Interceptor - DESPUÉS:**
```typescript
// La operación terminó, ahora el interceptor actúa
tap(async (data) => {
  // data = el vehículo actualizado que se va a devolver
  
  if (user && method === 'PATCH') {  // ✅ Cumple condiciones
    await this.auditRepository.save({
      tableName: "vehiculos",           // extraído de "/vehiculos/abc-123"
      recordId: "abc-123",             // ID del vehículo
      action: "UPDATE",                // PATCH → UPDATE
      userId: "juan-123",              // ID de Juan
      newValues: {                     // Datos actualizados
        id: "abc-123",
        patente: "XYZ789",
        marca: "Toyota",
        modelo: "Corolla"
      },
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 Chrome/120.0"
    });
  }
})
```

#### **5. Resultado en audit_logs:**
```sql
INSERT INTO audit_logs (
  table_name, record_id, action, user_id, new_values, ip_address, user_agent, created_at
) VALUES (
  'vehiculos',
  'abc-123',
  'UPDATE',
  'juan-123',
  '{"id":"abc-123","patente":"XYZ789","marca":"Toyota","modelo":"Corolla"}',
  '192.168.1.100',
  'Mozilla/5.0 Chrome/120.0',
  '2024-01-20 14:45:00'
);
```

---

## 🔧 **¿Cómo Activar el Interceptor?**

### **Opción 1: Global (Recomendado)**
```typescript
// src/app.module.ts
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
```

**¿Qué hace?**
- Aplica el interceptor a **TODOS** los endpoints automáticamente
- No necesitas agregarlo manualmente a cada controller

### **Opción 2: Por Controller**
```typescript
// src/vehiculos/vehiculos.controller.ts
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@Controller('vehiculos')
@UseInterceptors(AuditInterceptor)  // ← Solo para este controller
export class VehiculosController {
  // ...
}
```

### **Opción 3: Por Endpoint**
```typescript
@Post()
@UseInterceptors(AuditInterceptor)  // ← Solo para este endpoint
create(@Body() dto: CreateVehiculoDto) {
  // ...
}
```

---

## 🎯 **Ventajas del Interceptor**

### **✅ Automático:**
- No necesitas recordar agregar código de auditoría en cada service
- Se aplica a todos los endpoints automáticamente

### **✅ Consistente:**
- Siempre guarda la misma información
- No hay riesgo de olvidar auditar algo

### **✅ Centralizado:**
- Todo el código de auditoría está en un solo lugar
- Fácil de mantener y modificar

### **✅ No Invasivo:**
- No necesitas modificar tus controllers existentes
- Se "mete" automáticamente en el flujo

---

## 🚀 **Próximos Pasos**

1. **Crear la entidad AuditLog**
2. **Implementar el interceptor**
3. **Activarlo globalmente**
4. **Probar con un endpoint existente**
5. **Ver los registros en la base de datos**

¿Te queda más claro ahora cómo funciona el interceptor? ¿Quieres que empecemos implementándolo paso a paso?
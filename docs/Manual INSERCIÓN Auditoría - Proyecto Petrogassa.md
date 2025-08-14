# 🔍 Manual: Cómo el Interceptor INSERTA Datos en Auditoría - Proyecto Petrogassa

## 🤔 **Tu Pregunta Clave**

> "¿Cómo se inserta la data en la tabla de auditorías? Por mi conocimiento entiendo que para poblar una tabla necesitas usar servicios"

**¡Excelente observación!** Tienes razón en que normalmente usamos servicios, pero el interceptor tiene una forma especial de acceder directamente al repositorio.

---

## 🏗️ **Arquitectura Normal vs Interceptor**

### **🔄 Flujo Normal (Controller → Service → Repository):**
```
📱 Request → 🎮 Controller → 🔧 Service → 🗄️ Repository → 💾 Database
```

### **🕵️ Flujo del Interceptor (Acceso Directo):**
```
📱 Request → 🕵️ Interceptor → 🗄️ Repository → 💾 Database
                    ↓
              🎮 Controller → 🔧 Service (operación normal)
```

**¿Por qué puede hacer esto?**
El interceptor tiene **inyección de dependencias** igual que un service, puede acceder directamente a repositorios.

---

## 🔧 **Cómo Funciona la Inyección en el Interceptor**

### **1. Declaración del Repositorio**
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)  // ← Inyección directa del repositorio
    private auditRepository: Repository<AuditLog>,
  ) {}
}
```

**¿Qué significa esto?**
- `@InjectRepository(AuditLog)`: Le dice a NestJS "Dame acceso directo a la tabla audit_logs"
- `Repository<AuditLog>`: Tipo TypeORM que permite hacer operaciones CRUD
- Es como tener un "service" pero solo para la tabla de auditoría

### **2. Uso Directo del Repositorio**
```typescript
// Dentro del interceptor
await this.auditRepository.save({
  tableName: 'vehiculos',
  recordId: 'abc-123',
  action: 'UPDATE',
  userId: 'juan-123',
  // ... más campos
});
```

**¿Qué hace `save()`?**
- Es un método de TypeORM
- Equivale a: `INSERT INTO audit_logs (...) VALUES (...)`
- No necesita service intermedio

---

## 🆚 **Comparación: Service vs Interceptor**

### **📋 Service Tradicional:**
```typescript
// audit.service.ts
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async createAuditLog(data: CreateAuditLogDto) {
    return await this.auditRepository.save(data);
  }
}

// vehiculos.service.ts
@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private vehiculoRepository: Repository<Vehiculo>,
    private auditService: AuditService,  // ← Inyectar service
  ) {}

  async update(id: string, dto: UpdateVehiculoDto, user: User) {
    const vehiculo = await this.vehiculoRepository.update(id, dto);
    
    // Manualmente crear auditoría
    await this.auditService.createAuditLog({
      tableName: 'vehiculos',
      recordId: id,
      action: 'UPDATE',
      userId: user.id,
      newValues: vehiculo,
    });
    
    return vehiculo;
  }
}
```

### **🕵️ Interceptor (Automático):**
```typescript
// audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,  // ← Acceso directo
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(async (data) => {
        // Automáticamente crear auditoría
        await this.auditRepository.save({  // ← Sin service intermedio
          tableName: 'vehiculos',
          recordId: data.id,
          action: 'UPDATE',
          userId: user.id,
          newValues: data,
        });
      }),
    );
  }
}

// vehiculos.service.ts (MÁS SIMPLE)
@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private vehiculoRepository: Repository<Vehiculo>,
    // ← NO necesita AuditService
  ) {}

  async update(id: string, dto: UpdateVehiculoDto, user: User) {
    const vehiculo = await this.vehiculoRepository.update(id, dto);
    // ← NO necesita código de auditoría manual
    return vehiculo;
  }
}
```

---

## 🎯 **Configuración: Global vs Decorador**

### **🌍 Configuración Global (app.module.ts):**
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
- No necesitas decoradores en controllers
- Se ejecuta en: `/users`, `/vehiculos`, `/auth`, etc.

### **🎯 Configuración por Decorador:**
```typescript
// src/vehiculos/vehiculos.controller.ts
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';

@Controller('vehiculos')
@UseInterceptors(AuditInterceptor)  // ← Solo para este controller
export class VehiculosController {
  // Solo se auditan endpoints de vehículos
}
```

**¿Qué hace?**
- Aplica el interceptor **SOLO** a endpoints de vehículos
- Más control granular
- Otros controllers no se auditan automáticamente

### **🤔 ¿Cuál Elegir?**

| Enfoque | Ventajas | Desventajas |
|---------|----------|-------------|
| **Global** | • Automático para todo<br>• No olvidas auditar<br>• Menos código | • Audita endpoints que no necesitas<br>• Menos control |
| **Decorador** | • Control granular<br>• Solo lo que necesitas<br>• Más eficiente | • Debes recordar agregarlo<br>• Más código manual |

**Mi Recomendación:**
- **Decorador** para empezar (como dijiste)
- **Global** cuando tengas muchos modules

---

## 🗄️ **Requisitos para que Funcione**

### **1. Entidad AuditLog debe estar registrada:**
```typescript
// src/app.module.ts o audit.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),  // ← Registrar entidad
  ],
})
```

### **2. El interceptor debe estar en un módulo:**
```typescript
// src/common/common.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),  // ← Para inyección
  ],
  providers: [AuditInterceptor],
  exports: [AuditInterceptor],  // ← Para usar en otros módulos
})
export class CommonModule {}
```

### **3. Importar CommonModule donde uses el interceptor:**
```typescript
// src/vehiculos/vehiculos.module.ts
@Module({
  imports: [
    CommonModule,  // ← Para acceder al interceptor
  ],
  controllers: [VehiculosController],
})
export class VehiculosModule {}
```

---

## 🔍 **Ejemplo Paso a Paso: Inserción Real**

### **1. Usuario hace petición:**
```http
PATCH /vehiculos/abc-123
{
  "marca": "Toyota"
}
```

### **2. Interceptor captura datos:**
```typescript
const request = context.switchToHttp().getRequest();
const user = request.user;     // { id: "juan-123" }
const method = request.method; // "PATCH"
const url = request.url;       // "/vehiculos/abc-123"
```

### **3. Operación normal se ejecuta:**
```typescript
// Controller y Service hacen su trabajo
const vehiculoActualizado = await this.vehiculosService.update(...);
```

### **4. Interceptor inserta en audit_logs:**
```typescript
// Esto es lo que hace el interceptor internamente:
const auditData = {
  tableName: "vehiculos",
  recordId: "abc-123",
  action: "UPDATE",
  userId: "juan-123",
  newValues: vehiculoActualizado,
  ipAddress: "192.168.1.100",
  userAgent: "Chrome/120.0",
};

// INSERCIÓN DIRECTA (sin service)
await this.auditRepository.save(auditData);
```

### **5. SQL que se ejecuta automáticamente:**
```sql
INSERT INTO audit_logs (
  table_name, record_id, action, user_id, 
  new_values, ip_address, user_agent, created_at
) VALUES (
  'vehiculos', 'abc-123', 'UPDATE', 'juan-123',
  '{"id":"abc-123","marca":"Toyota"}',
  '192.168.1.100', 'Chrome/120.0', NOW()
);
```

---

## 🎯 **Respuesta a tu Pregunta**

**"¿Cómo se inserta sin service?"**

1. **El interceptor ES como un service especial** que se ejecuta automáticamente
2. **Tiene inyección de dependencias** igual que un service normal
3. **Accede directamente al repositorio** sin necesidad de service intermedio
4. **TypeORM permite esto** porque `Repository<T>` es inyectable
5. **Es más eficiente** porque evita capas innecesarias

**"¿No es necesario configuración global si uso decoradores?"**

**¡Correcto!** Si usas `@UseInterceptors(AuditInterceptor)` en cada controller:
- **NO necesitas** la configuración en `app.module.ts`
- **SÍ necesitas** que el interceptor esté disponible (importar `CommonModule`)
- **Tienes control total** sobre qué se audita

---

## 🚀 **Próximo Paso Recomendado**

1. **Crear entidad AuditLog**
2. **Crear el interceptor**
3. **Probarlo en UN controller** (ej: VehiculosController)
4. **Ver que se inserten registros en la BD**
5. **Expandir a otros controllers**

¿Te queda claro ahora cómo funciona la inserción directa? ¿Quieres que empecemos implementando la entidad AuditLog?
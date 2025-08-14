# 🔍 Manual SIMPLE: Relaciones y Auditoría - Proyecto Petrogassa

## 🤔 **Tus Dudas Resueltas**

### **1. ¿Qué son las Relaciones en Base de Datos?**

Imagínate que tienes dos tablas:
- **Tabla Users** (usuarios)
- **Tabla Vehiculos** (vehículos)

Una **relación** es como decir: "Este vehículo pertenece a este usuario" o "Este usuario creó este vehículo".

```
Users Table:
id: 123e4567-e89b-12d3-a456-426614174000
email: juan@petrogassa.com

Vehiculos Table:
id: 987f6543-e21c-34d5-b678-987654321000
patente: ABC123
createdBy: 123e4567-e89b-12d3-a456-426614174000  ← Este ID conecta con Users
```

---

## 🎯 **2. Auditoría REAL - ¿Qué se Guarda?**

### **Problema que Resuelve:**
Sin auditoría, solo sabes:
- ✅ Existe un vehículo ABC123
- ❌ No sabes quién lo creó
- ❌ No sabes cuándo se creó
- ❌ No sabes quién lo modificó
- ❌ No sabes qué cambió

### **Con Auditoría, sabes TODO:**
```sql
-- Tabla: vehiculos
id: 987f6543-e21c-34d5-b678-987654321000
patente: ABC123
marca: Toyota
modelo: Corolla

-- AUDITORÍA AUTOMÁTICA:
createdBy: 123e4567-e89b-12d3-a456-426614174000  ← ID de Juan
createdAt: 2024-01-15 10:30:00                   ← Cuándo lo creó
updatedBy: 456e7890-e12b-34c5-d678-123456789000  ← ID de María
updatedAt: 2024-01-20 14:45:00                   ← Cuándo lo editó
deletedBy: null                                   ← Nadie lo eliminó aún
deletedAt: null
```

---

## 📊 **3. Tabla de Auditoría Separada (Opcional)**

### **¿Por qué una tabla separada?**
Para guardar **QUÉ cambió exactamente**:

```sql
-- Tabla: audit_logs
id: 1
table_name: 'vehiculos'
record_id: '987f6543-e21c-34d5-b678-987654321000'
action: 'UPDATE'
user_id: '456e7890-e12b-34c5-d678-123456789000'  ← María
user_email: 'maria@petrogassa.com'
old_values: '{"marca": "Ford", "modelo": "Focus"}'
new_values: '{"marca": "Toyota", "modelo": "Corolla"}'
changed_at: '2024-01-20 14:45:00'
ip_address: '192.168.1.100'
user_agent: 'Mozilla/5.0...'
```

### **¿Qué te dice esto?**
- 👤 **Quién:** María (maria@petrogassa.com)
- 📅 **Cuándo:** 20 de enero a las 14:45
- 🔄 **Qué hizo:** Cambió marca de Ford a Toyota
- 🔄 **Qué más:** Cambió modelo de Focus a Corolla
- 🌐 **Desde dónde:** IP 192.168.1.100

---

## 🛠️ **4. Implementación PASO A PASO**

### **Paso 1: Entidad User (Ya la tienes)**
```typescript
// src/users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;
  
  // ... resto de campos
}
```

### **Paso 2: Entidad Vehiculo CON Auditoría**
```typescript
// src/vehiculos/entities/vehiculo.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  patente: string;

  @Column({ type: 'varchar', length: 100 })
  marca: string;

  @Column({ type: 'varchar', length: 100 })
  modelo: string;

  // 🔍 AUDITORÍA - CREACIÓN
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { eager: true })  // eager: true = trae los datos del usuario automáticamente
  @JoinColumn({ name: 'createdBy' })
  creator: User;  // ← Aquí tienes TODA la info del usuario que creó

  // 🔍 AUDITORÍA - ACTUALIZACIÓN
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: User;  // ← Info del usuario que editó

  // 🔍 AUDITORÍA - ELIMINACIÓN (Soft Delete)
  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'deletedBy' })
  deleter: User;  // ← Info del usuario que eliminó

  @Column({ default: true })
  isActive: boolean;
}
```

### **Paso 3: Service CON Auditoría Automática**
```typescript
// src/vehiculos/vehiculos.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { User } from '../users/entities/user.entity';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private vehiculoRepository: Repository<Vehiculo>,
  ) {}

  // 🆕 CREAR con auditoría
  async create(createVehiculoDto: CreateVehiculoDto, user: User): Promise<Vehiculo> {
    const vehiculo = this.vehiculoRepository.create({
      ...createVehiculoDto,
      createdBy: user.id,    // ← Guarda quién lo creó
      updatedBy: user.id,    // ← Al crear, también es quien lo "actualizó"
    });
    
    return await this.vehiculoRepository.save(vehiculo);
  }

  // ✏️ ACTUALIZAR con auditoría
  async update(id: string, updateVehiculoDto: UpdateVehiculoDto, user: User): Promise<Vehiculo> {
    await this.vehiculoRepository.update(id, {
      ...updateVehiculoDto,
      updatedBy: user.id,    // ← Guarda quién lo editó
      updatedAt: new Date(), // ← Cuándo lo editó
    });
    
    return await this.findOne(id);
  }

  // 🗑️ ELIMINAR (Soft Delete) con auditoría
  async remove(id: string, user: User): Promise<void> {
    await this.vehiculoRepository.update(id, {
      deletedBy: user.id,      // ← Quién lo eliminó
      deletedAt: new Date(),   // ← Cuándo lo eliminó
      isActive: false,         // ← Marcarlo como inactivo
    });
  }

  // 👀 BUSCAR con información de auditoría
  async findOne(id: string): Promise<Vehiculo> {
    return await this.vehiculoRepository.findOne({
      where: { id, isActive: true },
      relations: ['creator', 'updater', 'deleter'], // ← Trae info completa de usuarios
    });
  }

  // 📋 LISTAR todos activos
  async findAll(): Promise<Vehiculo[]> {
    return await this.vehiculoRepository.find({
      where: { isActive: true },
      relations: ['creator', 'updater'],
    });
  }

  // 🗂️ HISTORIAL completo (incluyendo eliminados)
  async findHistory(): Promise<Vehiculo[]> {
    return await this.vehiculoRepository.find({
      relations: ['creator', 'updater', 'deleter'],
      order: { updatedAt: 'DESC' },
    });
  }
}
```

### **Paso 4: Controller CON Usuario Automático**
```typescript
// src/vehiculos/vehiculos.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { PermissionsTypes } from '../users/enums/permissions.enum';

@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @Auth(PermissionsTypes.VEHICULOS_CREAR)
  create(
    @Body() createVehiculoDto: CreateVehiculoDto,
    @GetUser() user: User  // ← Automáticamente obtiene el usuario del token
  ) {
    return this.vehiculosService.create(createVehiculoDto, user);
  }

  @Patch(':id')
  @Auth(PermissionsTypes.VEHICULOS_EDITAR)
  update(
    @Param('id') id: string,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
    @GetUser() user: User  // ← Usuario que está editando
  ) {
    return this.vehiculosService.update(id, updateVehiculoDto, user);
  }

  @Delete(':id')
  @Auth(PermissionsTypes.VEHICULOS_ELIMINAR)
  remove(
    @Param('id') id: string,
    @GetUser() user: User  // ← Usuario que está eliminando
  ) {
    return this.vehiculosService.remove(id, user);
  }

  @Get(':id')
  @Auth(PermissionsTypes.VEHICULOS_LEER)
  findOne(@Param('id') id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Get()
  @Auth(PermissionsTypes.VEHICULOS_LEER)
  findAll() {
    return this.vehiculosService.findAll();
  }

  // 📊 Endpoint para ver historial completo
  @Get('admin/historial')
  @Auth(PermissionsTypes.SUPER_ADMIN)
  findHistory() {
    return this.vehiculosService.findHistory();
  }
}
```

---

## 🎬 **5. ¿Cómo se Ve en la Práctica?**

### **Cuando Juan crea un vehículo:**
```json
// POST /vehiculos
// Headers: Authorization: Bearer <token_de_juan>
// Body:
{
  "patente": "ABC123",
  "marca": "Toyota",
  "modelo": "Corolla"
}

// Respuesta:
{
  "id": "987f6543-e21c-34d5-b678-987654321000",
  "patente": "ABC123",
  "marca": "Toyota",
  "modelo": "Corolla",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "creator": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "juan@petrogassa.com"
  },
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "updatedBy": "123e4567-e89b-12d3-a456-426614174000",
  "updater": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "juan@petrogassa.com"
  },
  "isActive": true
}
```

### **Cuando María edita el vehículo:**
```json
// PATCH /vehiculos/987f6543-e21c-34d5-b678-987654321000
// Headers: Authorization: Bearer <token_de_maria>
// Body:
{
  "marca": "Honda"
}

// Respuesta:
{
  "id": "987f6543-e21c-34d5-b678-987654321000",
  "patente": "ABC123",
  "marca": "Honda",        // ← Cambió
  "modelo": "Corolla",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "creator": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "juan@petrogassa.com"     // ← Sigue siendo Juan quien lo creó
  },
  "updatedAt": "2024-01-20T14:45:00.000Z",  // ← Nueva fecha
  "updatedBy": "456e7890-e12b-34c5-d678-123456789000",  // ← Ahora es María
  "updater": {
    "id": "456e7890-e12b-34c5-d678-123456789000",
    "email": "maria@petrogassa.com"   // ← María lo editó
  },
  "isActive": true
}
```

---

## 🔍 **6. Tabla de Auditoría Detallada (Opcional)**

### **Si quieres saber QUÉ cambió exactamente:**

```typescript
// src/common/entities/audit-log.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  tableName: string;  // 'vehiculos', 'users', etc.

  @Column({ type: 'uuid' })
  recordId: string;   // ID del registro modificado

  @Column({ type: 'varchar', length: 20 })
  action: string;     // 'CREATE', 'UPDATE', 'DELETE'

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'json', nullable: true })
  oldValues: any;     // Valores anteriores

  @Column({ type: 'json', nullable: true })
  newValues: any;     // Valores nuevos

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### **Interceptor para Auditoría Automática:**
```typescript
// src/common/interceptors/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    
    return next.handle().pipe(
      tap(async (data) => {
        if (user && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
          await this.auditRepository.save({
            tableName: this.extractTableName(url),
            recordId: data?.id || request.params?.id,
            action: this.mapMethodToAction(method),
            userId: user.id,
            newValues: method !== 'DELETE' ? data : null,
            ipAddress: request.ip,
            userAgent: request.get('User-Agent'),
          });
        }
      }),
    );
  }

  private extractTableName(url: string): string {
    // /vehiculos/123 -> vehiculos
    return url.split('/')[1];
  }

  private mapMethodToAction(method: string): string {
    const map = {
      'POST': 'CREATE',
      'PATCH': 'UPDATE',
      'PUT': 'UPDATE',
      'DELETE': 'DELETE',
    };
    return map[method] || 'UNKNOWN';
  }
}
```

---

## 🎯 **7. Resumen: ¿Qué Logras?**

### **✅ Con esta implementación sabrás:**

1. **👤 QUIÉN hizo QUÉ:**
   - Juan creó el vehículo ABC123 el 15/01/2024
   - María editó la marca el 20/01/2024
   - Pedro lo eliminó el 25/01/2024

2. **📊 INFORMACIÓN COMPLETA:**
   - Email del usuario
   - Fecha y hora exacta
   - Qué campos cambiaron
   - Valores anteriores y nuevos

3. **🔒 SEGURIDAD:**
   - No se puede falsificar (viene del token JWT)
   - Historial completo e inmutable
   - Soft deletes (no se pierde información)

4. **📈 REPORTES:**
   - "¿Quién creó más vehículos este mes?"
   - "¿Qué usuario editó este registro?"
   - "¿Cuándo se eliminó este vehículo?"

---

## 🚀 **Próximo Paso**

¿Quieres que implementemos esto paso a paso? Podemos empezar con:

1. **Crear la entidad Vehiculo con auditoría**
2. **Implementar el service con auditoría automática**
3. **Probar que funcione correctamente**
4. **Agregar la tabla de auditoría detallada (opcional)**

¿Por cuál empezamos?
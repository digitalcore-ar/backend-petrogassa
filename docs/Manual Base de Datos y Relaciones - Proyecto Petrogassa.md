# 📊 Manual Base de Datos y Relaciones - Proyecto Petrogassa

## 🎯 **Arquitectura Definida**

Basado en tus requerimientos específicos:

### ✅ **Decisiones de Arquitectura**
1. **Archivos separados por módulo** (no compartidos)
2. **Auditoría completa** (quién + qué cambió)
3. **Soft deletes** con archivos movidos a directorio de respaldo
4. **Permisos granulares** por módulo (ya implementados)
5. **Versionado de archivos** con historial

---

## 🏗️ **1. Entidad Base para Auditoría**

### **BaseEntity (Clase Abstracta)**
```typescript
// src/common/entities/base.entity.ts
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Auditoría de creación
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  // Auditoría de actualización
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'updatedBy' })
  updater: User;

  // Soft delete
  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'deletedBy' })
  deleter: User;

  // Estado activo
  @Column({ default: true })
  isActive: boolean;
}
```

---

## 🚗 **2. Ejemplo: Módulo Vehículos**

### **Entidad Vehículo**
```typescript
// src/vehiculos/entities/vehiculo.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { VehiculoArchivo } from './vehiculo-archivo.entity';

@Entity('vehiculos')
export class Vehiculo extends BaseEntity {
  @Column({ type: 'varchar', length: 10, unique: true })
  patente: string;

  @Column({ type: 'varchar', length: 100 })
  marca: string;

  @Column({ type: 'varchar', length: 100 })
  modelo: string;

  @Column({ type: 'int' })
  año: number;

  @Column({ type: 'varchar', length: 50 })
  color: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  // Relación con archivos
  @OneToMany(() => VehiculoArchivo, archivo => archivo.vehiculo)
  archivos: VehiculoArchivo[];
}
```

### **Entidad Archivo de Vehículo**
```typescript
// src/vehiculos/entities/vehiculo-archivo.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Vehiculo } from './vehiculo.entity';

export enum TipoArchivoVehiculo {
  VTV = 'vtv',
  SEGURO = 'seguro',
  CEDULA_VERDE = 'cedula_verde',
  CEDULA_AZUL = 'cedula_azul',
  PATENTE = 'patente',
  OTRO = 'otro'
}

@Entity('vehiculos_archivos')
export class VehiculoArchivo extends BaseEntity {
  @Column({ type: 'uuid' })
  vehiculoId: string;

  @ManyToOne(() => Vehiculo, vehiculo => vehiculo.archivos)
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehiculo;

  @Column({ type: 'varchar', length: 255 })
  nombreOriginal: string;

  @Column({ type: 'varchar', length: 255 })
  nombreArchivo: string;

  @Column({ type: 'varchar', length: 500 })
  rutaArchivo: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  tamaño: number;

  @Column({
    type: 'enum',
    enum: TipoArchivoVehiculo,
    default: TipoArchivoVehiculo.OTRO
  })
  tipo: TipoArchivoVehiculo;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento: Date;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // Versionado
  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true })
  archivoAnteriorId: string;

  @ManyToOne(() => VehiculoArchivo, { nullable: true })
  @JoinColumn({ name: 'archivoAnteriorId' })
  archivoAnterior: VehiculoArchivo;

  // Ruta de respaldo (cuando se reemplaza)
  @Column({ type: 'varchar', length: 500, nullable: true })
  rutaRespaldo: string;
}
```

---

## 📋 **3. Ejemplo: Módulo Inasistencias**

### **Entidad Inasistencia**
```typescript
// src/inasistencias/entities/inasistencia.entity.ts
import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { InasistenciaArchivo } from './inasistencia-archivo.entity';

export enum TipoInasistencia {
  ENFERMEDAD = 'enfermedad',
  PERSONAL = 'personal',
  FAMILIAR = 'familiar',
  VACACIONES = 'vacaciones',
  OTRO = 'otro'
}

@Entity('inasistencias')
export class Inasistencia extends BaseEntity {
  @Column({ type: 'uuid' })
  empleadoId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'empleadoId' })
  empleado: User;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({
    type: 'enum',
    enum: TipoInasistencia
  })
  tipo: TipoInasistencia;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @Column({ type: 'boolean', default: false })
  justificada: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  // Relación con archivos
  @OneToMany(() => InasistenciaArchivo, archivo => archivo.inasistencia)
  archivos: InasistenciaArchivo[];
}
```

### **Entidad Archivo de Inasistencia**
```typescript
// src/inasistencias/entities/inasistencia-archivo.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Inasistencia } from './inasistencia.entity';

export enum TipoArchivoInasistencia {
  CERTIFICADO_MEDICO = 'certificado_medico',
  JUSTIFICATIVO = 'justificativo',
  DOCUMENTACION = 'documentacion',
  OTRO = 'otro'
}

@Entity('inasistencias_archivos')
export class InasistenciaArchivo extends BaseEntity {
  @Column({ type: 'uuid' })
  inasistenciaId: string;

  @ManyToOne(() => Inasistencia, inasistencia => inasistencia.archivos)
  @JoinColumn({ name: 'inasistenciaId' })
  inasistencia: Inasistencia;

  @Column({ type: 'varchar', length: 255 })
  nombreOriginal: string;

  @Column({ type: 'varchar', length: 255 })
  nombreArchivo: string;

  @Column({ type: 'varchar', length: 500 })
  rutaArchivo: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  tamaño: number;

  @Column({
    type: 'enum',
    enum: TipoArchivoInasistencia,
    default: TipoArchivoInasistencia.OTRO
  })
  tipo: TipoArchivoInasistencia;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // Versionado
  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true })
  archivoAnteriorId: string;

  @ManyToOne(() => InasistenciaArchivo, { nullable: true })
  @JoinColumn({ name: 'archivoAnteriorId' })
  archivoAnterior: InasistenciaArchivo;

  // Ruta de respaldo
  @Column({ type: 'varchar', length: 500, nullable: true })
  rutaRespaldo: string;
}
```

---

## 🔄 **4. Servicio Base para Auditoría**

### **BaseService (Clase Abstracta)**
```typescript
// src/common/services/base.service.ts
import { Repository, DeepPartial } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { User } from '../../users/entities/user.entity';

export abstract class BaseService<T extends BaseEntity> {
  constructor(protected repository: Repository<T>) {}

  async create(createDto: DeepPartial<T>, user: User): Promise<T> {
    const entity = this.repository.create({
      ...createDto,
      createdBy: user.id,
      updatedBy: user.id,
    });
    return await this.repository.save(entity);
  }

  async update(id: string, updateDto: DeepPartial<T>, user: User): Promise<T> {
    await this.repository.update(id, {
      ...updateDto,
      updatedBy: user.id,
      updatedAt: new Date(),
    });
    return await this.findOne(id);
  }

  async softDelete(id: string, user: User): Promise<void> {
    await this.repository.update(id, {
      deletedBy: user.id,
      deletedAt: new Date(),
      isActive: false,
    } as any);
  }

  async findOne(id: string): Promise<T> {
    return await this.repository.findOne({
      where: { id, isActive: true } as any,
      relations: ['creator', 'updater']
    });
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find({
      where: { isActive: true } as any,
      relations: ['creator', 'updater']
    });
  }
}
```

---

## 📁 **5. Servicio de Manejo de Archivos**

### **FileService**
```typescript
// src/common/services/file.service.ts
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FileService {
  private readonly uploadsPath = './uploads';
  private readonly backupPath = './backups';

  async saveFile(
    file: Express.Multer.File,
    module: string,
    subFolder?: string
  ): Promise<{ fileName: string; filePath: string }> {
    const fileName = `${uuid()}-${file.originalname}`;
    const modulePath = join(this.uploadsPath, module);
    const fullPath = subFolder 
      ? join(modulePath, subFolder)
      : modulePath;
    
    // Crear directorios si no existen
    await fs.mkdir(fullPath, { recursive: true });
    
    const filePath = join(fullPath, fileName);
    await fs.writeFile(filePath, file.buffer);
    
    return { fileName, filePath };
  }

  async moveToBackup(
    originalPath: string,
    module: string,
    reason: string = 'replaced'
  ): Promise<string> {
    const backupDir = join(this.backupPath, module, reason);
    await fs.mkdir(backupDir, { recursive: true });
    
    const fileName = originalPath.split('/').pop();
    const backupPath = join(backupDir, `${Date.now()}-${fileName}`);
    
    await fs.rename(originalPath, backupPath);
    return backupPath;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}
```

---

## 🔐 **6. Actualización de Permisos**

### **Agregar Permisos para Nuevos Módulos**
```typescript
// src/users/enums/permissions.enum.ts
export enum PermissionsTypes {
    SUPER_ADMIN = 'super_admin',
    USER = 'user',
    
    // RRHH
    RRHH_CREAR = 'rrhh_crear',
    RRHH_LEER = 'rrhh_leer',
    RRHH_EDITAR = 'rrhh_editar',
    RRHH_ELIMINAR = 'rrhh_eliminar',

    // VEHICULOS
    VEHICULOS_CREAR = 'vehiculos_crear',
    VEHICULOS_LEER = 'vehiculos_leer',
    VEHICULOS_EDITAR = 'vehiculos_editar',
    VEHICULOS_ELIMINAR = 'vehiculos_eliminar',
    
    // INASISTENCIAS
    INASISTENCIAS_CREAR = 'inasistencias_crear',
    INASISTENCIAS_LEER = 'inasistencias_leer',
    INASISTENCIAS_EDITAR = 'inasistencias_editar',
    INASISTENCIAS_ELIMINAR = 'inasistencias_eliminar',
    
    // ARCHIVOS (permisos específicos)
    ARCHIVOS_SUBIR = 'archivos_subir',
    ARCHIVOS_DESCARGAR = 'archivos_descargar',
    ARCHIVOS_ELIMINAR = 'archivos_eliminar',
    ARCHIVOS_VER_HISTORIAL = 'archivos_ver_historial',
}
```

---

## 🎮 **7. Ejemplo de Controller con Auditoría**

### **VehiculosController**
```typescript
// src/vehiculos/vehiculos.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
    @GetUser() user: User
  ) {
    return this.vehiculosService.create(createVehiculoDto, user);
  }

  @Get()
  @Auth(PermissionsTypes.VEHICULOS_LEER)
  findAll() {
    return this.vehiculosService.findAll();
  }

  @Get(':id')
  @Auth(PermissionsTypes.VEHICULOS_LEER)
  findOne(@Param('id') id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Patch(':id')
  @Auth(PermissionsTypes.VEHICULOS_EDITAR)
  update(
    @Param('id') id: string,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
    @GetUser() user: User
  ) {
    return this.vehiculosService.update(id, updateVehiculoDto, user);
  }

  @Delete(':id')
  @Auth(PermissionsTypes.VEHICULOS_ELIMINAR)
  remove(
    @Param('id') id: string,
    @GetUser() user: User
  ) {
    return this.vehiculosService.softDelete(id, user);
  }

  // Endpoints específicos para archivos
  @Post(':id/archivos')
  @Auth(PermissionsTypes.ARCHIVOS_SUBIR)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') vehiculoId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: any,
    @GetUser() user: User
  ) {
    return this.vehiculosService.uploadFile(vehiculoId, file, metadata, user);
  }

  @Get(':id/archivos')
  @Auth(PermissionsTypes.VEHICULOS_LEER)
  getFiles(@Param('id') vehiculoId: string) {
    return this.vehiculosService.getFiles(vehiculoId);
  }

  @Get(':id/archivos/:archivoId/historial')
  @Auth(PermissionsTypes.ARCHIVOS_VER_HISTORIAL)
  getFileHistory(
    @Param('id') vehiculoId: string,
    @Param('archivoId') archivoId: string
  ) {
    return this.vehiculosService.getFileHistory(vehiculoId, archivoId);
  }
}
```

---

## 📊 **8. Estructura de Directorios**

```
backend-petrogassa/
├── uploads/
│   ├── vehiculos/
│   │   ├── vtv/
│   │   ├── seguros/
│   │   └── documentacion/
│   ├── inasistencias/
│   │   ├── certificados/
│   │   └── justificativos/
│   └── otros-modulos/
├── backups/
│   ├── vehiculos/
│   │   ├── replaced/
│   │   ├── deleted/
│   │   └── expired/
│   └── inasistencias/
│       ├── replaced/
│       └── deleted/
└── src/
    ├── common/
    │   ├── entities/
    │   │   └── base.entity.ts
    │   └── services/
    │       ├── base.service.ts
    │       └── file.service.ts
    ├── vehiculos/
    │   ├── entities/
    │   │   ├── vehiculo.entity.ts
    │   │   └── vehiculo-archivo.entity.ts
    │   ├── dto/
    │   ├── vehiculos.controller.ts
    │   ├── vehiculos.service.ts
    │   └── vehiculos.module.ts
    └── inasistencias/
        ├── entities/
        │   ├── inasistencia.entity.ts
        │   └── inasistencia-archivo.entity.ts
        ├── dto/
        ├── inasistencias.controller.ts
        ├── inasistencias.service.ts
        └── inasistencias.module.ts
```

---

## ✅ **9. Checklist de Implementación**

### **Paso 1: Entidades Base**
- [ ] Crear `BaseEntity` con auditoría completa
- [ ] Crear `BaseService` con métodos CRUD auditados
- [ ] Crear `FileService` para manejo de archivos

### **Paso 2: Módulo Vehículos**
- [ ] Crear entidad `Vehiculo`
- [ ] Crear entidad `VehiculoArchivo`
- [ ] Implementar service extendiendo `BaseService`
- [ ] Crear controller con permisos
- [ ] Agregar endpoints de archivos

### **Paso 3: Módulo Inasistencias**
- [ ] Crear entidad `Inasistencia`
- [ ] Crear entidad `InasistenciaArchivo`
- [ ] Implementar service y controller
- [ ] Configurar permisos específicos

### **Paso 4: Configuración**
- [ ] Actualizar permisos en enum
- [ ] Configurar multer para uploads
- [ ] Crear directorios de uploads y backups
- [ ] Configurar migraciones de base de datos

### **Paso 5: Testing**
- [ ] Probar auditoría de cambios
- [ ] Verificar soft deletes
- [ ] Testear versionado de archivos
- [ ] Validar permisos por módulo

---

## 🚀 **Próximos Pasos**

1. **Implementar BaseEntity y BaseService**
2. **Crear el primer módulo (Vehículos) como ejemplo**
3. **Configurar el sistema de archivos**
4. **Replicar el patrón para otros módulos**
5. **Agregar logs de auditoría detallados**

¿Te parece bien esta arquitectura? ¿Quieres que empecemos implementando algún módulo específico?
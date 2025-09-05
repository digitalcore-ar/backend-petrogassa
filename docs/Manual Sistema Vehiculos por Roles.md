# Manual Completo: Sistema de Vehículos por Roles

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Estructura de DTOs](#estructura-de-dtos)
3. [Entidades y Base de Datos](#entidades-y-base-de-datos)
4. [Servicios](#servicios)
5. [Controladores y Endpoints](#controladores-y-endpoints)
6. [Ejemplos de Postman](#ejemplos-de-postman)
7. [Flujo de Trabajo Completo](#flujo-de-trabajo-completo)
8. [Mejores Prácticas](#mejores-prácticas)

## Arquitectura General

### Concepto Principal
El sistema maneja vehículos con **separación de responsabilidades por roles**:

- **ADMIN**: Crea la estructura completa del vehículo (puede estar vacía)
- **FIELD**: Solo maneja datos de campo (operadora, área, contratos, VTV)
- **MICROTRACK**: Solo maneja datos de seguimiento
- **SALES**: Solo maneja datos de ventas

### Flujo de Datos
```
ADMIN crea estructura base → ROLES específicos completan sus datos
```

## Estructura de DTOs

### 1. DTOs Base (Campos Específicos)

#### CreateVehicleFieldDto (Para roles específicos)
```typescript
// src/vehicles/dto/create-vehicle-field.dto.ts
export class CreateVehicleFieldDto {
  @IsNotEmpty()
  @IsEnum(Operators)
  operadora: Operators;  // OBLIGATORIO para role field

  @IsNotEmpty()
  @IsEnum(Zones)
  area: Zones;  // OBLIGATORIO para role field

  @IsOptional()
  @IsString()
  contrato?: string;

  @IsOptional()
  @IsEnum(Functions)
  funcion?: Functions;

  @IsOptional()
  @IsDateString()
  fechaVtoVtv?: string;

  @IsOptional()
  @IsString()
  lugarVtv?: string;
}
```

#### CreateVehicleFieldAdminDto (Para admin - TODO OPCIONAL)
```typescript
// src/vehicles/dto/create-vehicle-field-admin.dto.ts
export class CreateVehicleFieldAdminDto {
  @IsOptional()
  @IsEnum(Operators)
  operadora?: Operators;  // OPCIONAL para admin

  @IsOptional()
  @IsEnum(Zones)
  area?: Zones;  // OPCIONAL para admin

  @IsOptional()
  @IsString()
  contrato?: string;

  @IsOptional()
  @IsEnum(Functions)
  funcion?: Functions;

  @IsOptional()
  @IsDateString()
  fechaVtoVtv?: string;

  @IsOptional()
  @IsString()
  lugarVtv?: string;
}
```

### 2. DTOs Completos

#### CreateCompleteVehicleDto (Para ADMIN)
```typescript
// src/vehicles/dto/create-vehicle-complete.dto.ts
export class CreateCompleteVehicleDto {
  // Datos del vehículo (OBLIGATORIO para admin)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateVehicleDto)
  vehicle: CreateVehicleDto;

  // Datos de campo (OPCIONAL para admin)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleFieldAdminDto)  // ← DTO específico para admin
  field?: CreateVehicleFieldAdminDto;

  // Datos de microtrack (OPCIONAL para admin)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleMicrotrackAdminDto)
  microtrack?: CreateVehicleMicrotrackAdminDto;

  // Datos de venta (OPCIONAL para admin)
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleSaleAdminDto)
  sale?: CreateVehicleSaleAdminDto;
}
```

#### UpdateVehicleFieldRoleDto (Para role FIELD)
```typescript
// src/vehicles/dto/update-vehicle-field-role.dto.ts
export class UpdateVehicleFieldRoleDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateVehicleFieldDto)  // ← DTO con validaciones estrictas
  field: CreateVehicleFieldDto;
}
```

## Entidades y Base de Datos

### Configuración de Entidades (TODO NULLABLE)

```typescript
// src/vehicles/entities/vehicle-field.entity.ts
@Entity('vehicle_fields')
export class VehicleField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Operators, nullable: true })  // ← NULLABLE
  operadora: Operators;

  @Column({ type: 'enum', enum: Zones, nullable: true })  // ← NULLABLE
  area: Zones;

  @Column({ type: 'varchar', length: 100, nullable: true })  // ← NULLABLE
  contrato: string;

  @Column({ type: 'enum', enum: Functions, nullable: true })  // ← NULLABLE
  funcion: Functions;

  @Column({ type: 'timestamp', nullable: true })  // ← NULLABLE
  fechaVtoVtv: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })  // ← NULLABLE
  lugarVtv: string;

  @OneToOne(() => Vehicle, vehicle => vehicle.vehicleField)
  @JoinColumn()
  vehicle: Vehicle;
}
```

## Servicios

### VehiclesAdminService

```typescript
// src/vehicles/services/vehicles-admin.service.ts
@Injectable()
export class VehiclesAdminService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(VehicleField)
    private vehicleFieldRepository: Repository<VehicleField>,
    @InjectRepository(VehicleMicrotrack)
    private vehicleMicrotrackRepository: Repository<VehicleMicrotrack>,
    @InjectRepository(VehicleSales)
    private vehicleSalesRepository: Repository<VehicleSales>,
    private dataSource: DataSource,
  ) {}

  // Crear vehículo completo (estructura base)
  async create(createDto: CreateCompleteVehicleDto) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Crear vehículo principal (OBLIGATORIO)
      const vehicle = manager.create(Vehicle, createDto.vehicle);
      const savedVehicle = await manager.save(vehicle);

      // 2. Crear estructura field (puede estar vacía)
      const vehicleField = manager.create(VehicleField, {
        vehicle: savedVehicle,
        ...createDto.field,  // Si admin envía datos, se usan
      });

      // 3. Crear estructura microtrack (puede estar vacía)
      const vehicleMicrotrack = manager.create(VehicleMicrotrack, {
        vehicle: savedVehicle,
        ...createDto.microtrack,
      });

      // 4. Crear estructura sales (puede estar vacía)
      const vehicleSale = manager.create(VehicleSales, {
        vehicle: savedVehicle,
        ...createDto.sale,
      });

      // 5. Guardar todas las estructuras
      await Promise.all([
        manager.save(vehicleField),
        manager.save(vehicleMicrotrack),
        manager.save(vehicleSale),
      ]);

      // 6. Retornar vehículo completo
      return this.findOne(savedVehicle.id);
    });
  }

  // Buscar vehículo con todas las relaciones
  async findOne(id: string) {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id },
      relations: ['vehicleField', 'vehicleMicrotrack', 'vehicleSale'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return vehicle;
  }

  // Actualizar vehículo completo (solo admin)
  async updateComplete(id: string, updateDto: UpdateCompleteVehicleDto) {
    return this.dataSource.transaction(async (manager) => {
      const vehicle = await this.findOne(id);

      // Actualizar vehículo principal si se proporciona
      if (updateDto.vehicle) {
        Object.assign(vehicle, updateDto.vehicle);
        await manager.save(vehicle);
      }

      // Actualizar field si se proporciona
      if (updateDto.field) {
        Object.assign(vehicle.vehicleField, updateDto.field);
        await manager.save(vehicle.vehicleField);
      }

      // Actualizar microtrack si se proporciona
      if (updateDto.microtrack) {
        Object.assign(vehicle.vehicleMicrotrack, updateDto.microtrack);
        await manager.save(vehicle.vehicleMicrotrack);
      }

      // Actualizar sale si se proporciona
      if (updateDto.sale) {
        Object.assign(vehicle.vehicleSale, updateDto.sale);
        await manager.save(vehicle.vehicleSale);
      }

      return this.findOne(id);
    });
  }
}
```

### VehiclesFieldsService

```typescript
// src/vehicles/services/vehicles-fields.service.ts
@Injectable()
export class VehiclesFieldsService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(VehicleField)
    private vehicleFieldRepository: Repository<VehicleField>,
  ) {}

  // Buscar datos de field por ID del vehículo
  async findByVehicleId(vehicleId: string) {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    const fieldData = await this.vehicleFieldRepository.findOne({
      where: { vehicle: { id: vehicleId } },
      relations: ['vehicle'],
    });

    if (!fieldData) {
      throw new NotFoundException('Datos de campo no encontrados');
    }

    return fieldData;
  }

  // Actualizar datos de field por ID del vehículo
  async updateByVehicleId(vehicleId: string, updateDto: UpdateVehicleFieldRoleDto) {
    const fieldData = await this.findByVehicleId(vehicleId);

    // Aplicar validaciones estrictas del DTO
    Object.assign(fieldData, updateDto.field);

    return await this.vehicleFieldRepository.save(fieldData);
  }
}
```

## Controladores y Endpoints

### VehiclesAdminController

```typescript
// src/vehicles/controllers/vehicles-admin.controller.ts
@Controller('vehicles/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class VehiclesAdminController {
  constructor(private readonly vehiclesService: VehiclesAdminService) {}

  // POST /api/vehicles/admin - Crear vehículo completo
  @Post()
  async create(@Body() createDto: CreateCompleteVehicleDto) {
    return await this.vehiclesService.create(createDto);
  }

  // GET /api/vehicles/admin/:id - Obtener vehículo completo
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.vehiclesService.findOne(id);
  }

  // PATCH /api/vehicles/admin/:id/complete - Actualizar vehículo completo
  @Patch(':id/complete')
  async updateComplete(
    @Param('id') id: string,
    @Body() updateDto: UpdateCompleteVehicleDto,
  ) {
    return await this.vehiclesService.updateComplete(id, updateDto);
  }
}
```

### VehicleFieldsController

```typescript
// src/vehicles/controllers/vehicle-fields.controller.ts
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FIELD)
export class VehicleFieldsController {
  constructor(private readonly vehiclesFieldsService: VehiclesFieldsService) {}

  // GET /api/vehicles/:vehicleId/field - Obtener datos de campo
  @Get(':vehicleId/field')
  async findFieldByVehicleId(@Param('vehicleId') vehicleId: string) {
    return await this.vehiclesFieldsService.findByVehicleId(vehicleId);
  }

  // PATCH /api/vehicles/:vehicleId/field - Actualizar datos de campo
  @Patch(':vehicleId/field')
  async updateFieldByVehicleId(
    @Param('vehicleId') vehicleId: string,
    @Body() updateDto: UpdateVehicleFieldRoleDto,
  ) {
    return await this.vehiclesFieldsService.updateByVehicleId(vehicleId, updateDto);
  }
}
```

## Ejemplos de Postman

### 1. Admin Crea Vehículo (Solo Estructura Base)

**Endpoint:** `POST /api/vehicles/admin`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "vehicle": {
    "patente": "BBG 721",
    "tipo": "REMOLQUE",
    "marca": "RANDON",
    "modelo": "SEMIREMOLQUE",
    "anio": 1997,
    "titular": "petrogas s.a",
    "patenteDe": "PLAZA HUINCUL",
    "aseguradora": "SANCOR SEGUROS",
    "fechaInscripcion": "2025-08-25T14:30:00.000Z",
    "lugarInscripcion": "JUJUY",
    "fechaIngreso": "2025-08-25T14:30:00.000Z",
    "vtoPatente": "2025-08-25T14:30:00.000Z",
    "nroPoliza": "13329984",
    "refPoliza": "10441465",
    "vtoSeguro": "2025-08-25T14:30:00.000Z",
    "nroChasis": "9ADP13530TM121853",
    "nroMotor": "NO POSEE"
  }
  // field, microtrack, sale NO se envían (estructura vacía)
}
```

**Respuesta Esperada:**
```json
{
  "id": "uuid-del-vehiculo",
  "patente": "BBG 721",
  "tipo": "REMOLQUE",
  // ... resto de datos del vehículo
  "vehicleField": {
    "id": "uuid-del-field",
    "operadora": null,
    "area": null,
    "contrato": null,
    // ... campos en null
  },
  "vehicleMicrotrack": {
    "id": "uuid-del-microtrack",
    // ... campos en null
  },
  "vehicleSale": {
    "id": "uuid-del-sale",
    // ... campos en null
  }
}
```

### 2. Admin Crea Vehículo con Algunos Datos

**Endpoint:** `POST /api/vehicles/admin`

**Body:**
```json
{
  "vehicle": {
    "patente": "ABC 123",
    "tipo": "CAMION",
    "marca": "MERCEDES",
    "modelo": "ACTROS"
    // ... resto de datos obligatorios
  },
  "field": {
    "operadora": "OPERADORA_A",
    "area": "ZONA_NORTE"
    // contrato, funcion, etc. pueden omitirse
  }
  // microtrack y sale se omiten (estructura vacía)
}
```

### 3. Role Field Completa Sus Datos

**Endpoint:** `PATCH /api/vehicles/{vehicleId}/field`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {field_token}
```

**Body:**
```json
{
  "field": {
    "operadora": "OPERADORA_B",     // OBLIGATORIO
    "area": "ZONA_SUR",            // OBLIGATORIO
    "contrato": "CONT-2025-001",
    "funcion": "TRANSPORTE",
    "fechaVtoVtv": "2025-12-31T00:00:00.000Z",
    "lugarVtv": "NEUQUEN"
  }
}
```

### 4. Role Field Obtiene Sus Datos

**Endpoint:** `GET /api/vehicles/{vehicleId}/field`

**Headers:**
```
Authorization: Bearer {field_token}
```

**Respuesta:**
```json
{
  "id": "uuid-del-field",
  "operadora": "OPERADORA_B",
  "area": "ZONA_SUR",
  "contrato": "CONT-2025-001",
  "funcion": "TRANSPORTE",
  "fechaVtoVtv": "2025-12-31T00:00:00.000Z",
  "lugarVtv": "NEUQUEN",
  "vehicle": {
    "id": "uuid-del-vehiculo",
    "patente": "ABC 123"
    // ... datos básicos del vehículo
  }
}
```

### 5. Role Microtrack Actualiza Sus Datos

**Endpoint:** `PATCH /api/vehicles/{vehicleId}/microtrack`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {microtrack_token}
```

**Body:**
```json
{
  "microtrack": {
    "dispositivoId": "DEVICE-001",
    "estadoDispositivo": "ACTIVO",
    "ultimaUbicacion": "Lat: -38.123, Lng: -68.456",
    "fechaUltimaSenal": "2025-01-15T10:30:00.000Z"
  }
}
```

### 6. Role Sales Actualiza Sus Datos

**Endpoint:** `PATCH /api/vehicles/{vehicleId}/sales`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {sales_token}
```

**Body:**
```json
{
  "sale": {
    "codigoVenta": "SALE-2025-001",
    "vendedor": "Juan Pérez",
    "cliente": "Empresa XYZ",
    "fechaVenta": "2025-01-15T00:00:00.000Z",
    "precio": 150000.00,
    "estado": "VENDIDO"
  }
}
```

## Flujo de Trabajo Completo

### Paso 1: Admin Crea Estructura
1. Admin hace `POST /api/vehicles/admin` con datos básicos del vehículo
2. Sistema crea vehículo + estructuras vacías (field, microtrack, sales)
3. Cada estructura tiene campos en `null` pero existe en BD

### Paso 2: Roles Completan Sus Datos
1. **Role Field**: `PATCH /api/vehicles/{id}/field` con validaciones estrictas
2. **Role Microtrack**: `PATCH /api/vehicles/{id}/microtrack` con sus validaciones
3. **Role Sales**: `PATCH /api/vehicles/{id}/sales` con sus validaciones

### Paso 3: Consultas por Rol
- **Admin**: Puede ver todo con `GET /api/vehicles/admin/{id}`
- **Field**: Solo ve sus datos con `GET /api/vehicles/{id}/field`
- **Microtrack**: Solo ve sus datos con `GET /api/vehicles/{id}/microtrack`
- **Sales**: Solo ve sus datos con `GET /api/vehicles/{id}/sales`

## Mejores Prácticas

### 1. Validaciones Contextuales
- **Admin DTOs**: Campos opcionales para flexibilidad
- **Role DTOs**: Campos obligatorios para integridad
- **Entidades**: Nullable para permitir estructura vacía inicial

### 2. Separación de Responsabilidades
- Cada rol tiene su propio servicio y controlador
- DTOs específicos por contexto
- Endpoints semánticamente correctos

### 3. Transacciones
- Usar transacciones para operaciones que afectan múltiples tablas
- Garantizar consistencia de datos

### 4. Manejo de Errores
- Validaciones específicas por rol
- Mensajes de error claros
- Códigos HTTP apropiados

### 5. Seguridad
- Guards por rol en cada endpoint
- Validación de permisos
- Tokens JWT específicos por rol

### 6. Testing
- Tests unitarios por servicio
- Tests de integración por endpoint
- Mocks para dependencias

## Consideraciones Adicionales

### Base de Datos
- Todos los campos de relaciones deben ser `nullable: true`
- Índices en campos de búsqueda frecuente
- Constraints apropiados

### Performance
- Lazy loading para relaciones grandes
- Paginación en listados
- Cache para consultas frecuentes

### Escalabilidad
- Estructura modular para agregar nuevos roles
- DTOs extensibles
- Servicios reutilizables

Este manual te proporciona una guía completa para implementar el sistema de vehículos con separación de roles, desde la estructura de datos hasta los ejemplos de uso en Postman.
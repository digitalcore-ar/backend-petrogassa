
Los Exception Filters son la **última línea de defensa** antes de que la respuesta llegue al cliente.

## Ventajas de usar Exception Filters

1. **Centralización**: Manejo de errores en un solo lugar
2. **Consistencia**: Respuestas uniformes para errores similares
3. **Separación de responsabilidades**: Los servicios se enfocan en lógica de negocio
4. **Reutilización**: Un filtro puede manejar múltiples tipos de errores
5. **Mantenibilidad**: Fácil modificación de mensajes de error

## Estructura Básica de un Exception Filter

```typescript
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch(TipoDeExcepcion)
export class MiExceptionFilter implements ExceptionFilter {
  catch(exception: TipoDeExcepcion, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    // Lógica de manejo del error
    response.status(statusCode).json({
      // Respuesta personalizada
    });
  }
}
```

## Análisis Línea por Línea del QueryFailedExceptionFilter

### Importaciones y Definición de Interfaz

```typescript
// Línea 1: Importa las clases necesarias de NestJS
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';

// Línea 2: Importa el tipo de error específico de TypeORM
import { QueryFailedError } from 'typeorm';

// Líneas 3-9: Define una interfaz para tipear el error de PostgreSQL
interface PostgresError extends Error {
  code?: string;      // Código de error de PostgreSQL (ej: '23505')
  detail?: string;    // Detalles del error (ej: "Key (patente)=(ABC123) already exists.")
  column?: string;    // Columna que causó el error
  constraint?: string; // Nombre del constraint violado
  table?: string;     // Tabla donde ocurrió el error
}
```

**¿Por qué esta interfaz?**
- TypeORM devuelve `driverError` como tipo `Error` genérico
- PostgreSQL incluye propiedades específicas que no están en `Error`
- La interfaz nos permite acceder a estas propiedades con type safety

### Decorador y Clase Principal

```typescript
// Línea 11: Especifica qué tipo de excepción captura este filtro
@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
```

**¿Qué hace `@Catch(QueryFailedError)`?**
- Le dice a NestJS que este filtro solo debe activarse para errores de tipo `QueryFailedError`
- Otros tipos de errores pasarán de largo
- Puedes especificar múltiples tipos: `@Catch(QueryFailedError, ValidationError)`

### Método Principal `catch`

```typescript
// Línea 13: Método obligatorio de la interfaz ExceptionFilter
catch(exception: QueryFailedError, host: ArgumentsHost) {
  // Línea 14: Obtiene el contexto HTTP de la request
  const ctx = host.switchToHttp();
  
  // Línea 15: Obtiene el objeto response para enviar la respuesta
  const response = ctx.getResponse();
  
  // Línea 17: Extrae el mensaje y código de estado procesando el error
  const { message, statusCode } = this.parseError(exception);

  // Líneas 19-24: Envía la respuesta HTTP con formato consistente
  response.status(statusCode).json({
    statusCode: statusCode,
    message: message,
    timestamp: new Date().toISOString(),
    path: ctx.getRequest().url,
  });
}
```

**Desglose del método `catch`:**
- `host.switchToHttp()`: Convierte el contexto genérico a contexto HTTP
- `ctx.getResponse()`: Obtiene el objeto response de Express/Fastify
- `this.parseError()`: Método privado que analiza el error y determina la respuesta
- `response.status().json()`: Envía la respuesta HTTP con el formato estándar

### Método `parseError` - El Cerebro del Filtro

```typescript
// Línea 27: Método privado que analiza el error y determina la respuesta
private parseError(exception: QueryFailedError): { message: string; statusCode: HttpStatus } {
  // Línea 29: Type casting para acceder a propiedades específicas de PostgreSQL
  const pgError = exception.driverError as PostgresError;
  
  // Línea 30: Extrae el código de error de PostgreSQL
  const errorCode = pgError?.code;
  
  // Líneas 32-58: Switch que mapea códigos de PostgreSQL a respuestas HTTP
  switch (errorCode) {
    case '23505': // unique_violation - Violación de constraint único
      return {
        statusCode: HttpStatus.CONFLICT, // 409
        message: this.extractUniqueViolationMessage(pgError),
      };
    
    case '23503': // foreign_key_violation - Referencia inexistente
      return {
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'La referencia especificada no existe',
      };
    
    case '23502': // not_null_violation - Campo obligatorio nulo
      return {
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: this.extractNotNullMessage(pgError),
      };
    
    case '23514': // check_violation - Violación de constraint de validación
      return {
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Los datos no cumplen con las restricciones',
      };
    
    default: // Cualquier otro error
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR, // 500
        message: 'Error interno del servidor',
      };
  }
}
```

**Códigos de Error PostgreSQL más comunes:**
- `23505`: Violación de constraint único (duplicados)
- `23503`: Violación de foreign key (referencia inexistente)
- `23502`: Violación de not null (campo obligatorio vacío)
- `23514`: Violación de check constraint (validación personalizada)

### Método `extractUniqueViolationMessage` - Extracción Inteligente

```typescript
// Línea 60: Extrae información específica de errores de duplicados
private extractUniqueViolationMessage(pgError: PostgresError): string {
  // Línea 61: Obtiene el detalle del error o string vacío como fallback
  const detail = pgError?.detail || '';
  
  // Líneas 62-64: Regex para extraer campo y valor del mensaje de PostgreSQL
  // Ejemplo de detail: "Key (patente)=(ABC123) already exists."
  const match = detail.match(/Key \\(([^)]+)\\)=\\(([^)]+)\\)/);
  
  // Líneas 66-70: Si encuentra el patrón, extrae campo y valor
  if (match) {
    const [, field, value] = match; // Destructuring: ignora el match completo
    return `Ya existe un registro con ${field}: ${value}`;
  }
  
  // Líneas 72-73: Mensaje genérico si no puede extraer información específica
  return 'Ya existe un registro con estos datos';
}
```

**¿Cómo funciona la regex?**
- `Key \\(([^)]+)\\)=\\(([^)]+)\\)`: Busca el patrón "Key (campo)=(valor)"
- `([^)]+)`: Captura todo lo que no sea un paréntesis de cierre
- Los grupos de captura extraen el campo y el valor por separado

### Método `extractNotNullMessage` - Campos Obligatorios

```typescript
// Línea 76: Maneja errores de campos obligatorios nulos
private extractNotNullMessage(pgError: PostgresError): string {
  // Línea 77: Obtiene el nombre de la columna que causó el error
  const column = pgError?.column;
  
  // Líneas 79-81: Si conoce la columna, crea mensaje específico
  if (column) {
    return `El campo ${column} es obligatorio`;
  }
  
  // Líneas 83-84: Mensaje genérico si no puede identificar la columna
  return 'Faltan campos obligatorios';
}
```

## Cómo Registrar el Exception Filter

### Opción 1: Globalmente (Recomendado)

```typescript
// En main.ts
import { QueryFailedExceptionFilter } from './common/exceptions/QueryFailedExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Registra el filtro para toda la aplicación
  app.useGlobalFilters(new QueryFailedExceptionFilter());
  
  await app.listen(3000);
}
```

### Opción 2: Por Controlador

```typescript
@Controller('vehicles')
@UseFilters(QueryFailedExceptionFilter)
export class VehiclesController {
  // ...
}
```

### Opción 3: Por Método

```typescript
@Post()
@UseFilters(QueryFailedExceptionFilter)
createVehicle(@Body() createVehicleDto: CreateVehicleDto) {
  // ...
}
```

## Ejemplos de Respuestas del Filtro

### Error de Duplicado (23505)
```json
{
  "statusCode": 409,
  "message": "Ya existe un registro con patente: ABC123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/vehicles"
}
```

### Error de Campo Obligatorio (23502)
```json
{
  "statusCode": 400,
  "message": "El campo email es obligatorio",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/users"
}
```

### Error de Referencia (23503)
```json
{
  "statusCode": 400,
  "message": "La referencia especificada no existe",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/vehicles"
}
```

## Ventajas de Esta Implementación

### 1. **Completamente Genérico**
- No necesitas agregar código para nuevos módulos
- Funciona automáticamente con cualquier tabla
- Los mensajes se generan dinámicamente

### 2. **Extracción Inteligente**
- Lee directamente los detalles del error de PostgreSQL
- Extrae campos y valores específicos
- Proporciona fallbacks genéricos

### 3. **Mantenimiento Cero**
- Una vez implementado, no requiere modificaciones
- Escala automáticamente con tu aplicación
- Maneja todos los tipos de errores de base de datos

### 4. **Respuestas Consistentes**
- Formato uniforme en toda la aplicación
- Códigos de estado HTTP apropiados
- Información útil para debugging

## Mejores Prácticas

### 1. **Siempre Usar Type Safety**
```typescript
// ✅ Bueno: Con interfaz tipada
const pgError = exception.driverError as PostgresError;

// ❌ Malo: Sin tipado
const pgError = exception.driverError as any;
```

### 2. **Proporcionar Fallbacks**
```typescript
// ✅ Bueno: Con fallback
const detail = pgError?.detail || '';

// ❌ Malo: Sin fallback
const detail = pgError.detail;
```

### 3. **Mensajes Específicos pero Seguros**
```typescript
// ✅ Bueno: Información útil sin exponer detalles internos
return `Ya existe un registro con ${field}: ${value}`;

// ❌ Malo: Expone información sensible
return exception.message; // Puede contener queries SQL
```

### 4. **Logging para Debugging**
```typescript
catch(exception: QueryFailedError, host: ArgumentsHost) {
  // Log para debugging en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('Database Error:', exception);
  }
  
  // ... resto del código
}
```

## Extensiones Futuras

### 1. **Soporte para Múltiples Bases de Datos**
```typescript
private parseError(exception: QueryFailedError) {
  const driver = exception.driver?.type;
  
  switch (driver) {
    case 'postgres':
      return this.parsePostgresError(exception);
    case 'mysql':
      return this.parseMysqlError(exception);
    default:
      return this.parseGenericError(exception);
  }
}
```

### 2. **Internacionalización**
```typescript
private getLocalizedMessage(key: string, params: any) {
  // Implementar i18n basado en headers de la request
  const language = this.getRequestLanguage();
  return this.i18nService.translate(key, params, language);
}
```

### 3. **Métricas y Monitoreo**
```typescript
catch(exception: QueryFailedError, host: ArgumentsHost) {
  // Incrementar métricas de errores
  this.metricsService.incrementErrorCount('database_error', {
    code: pgError?.code,
    table: pgError?.table
  });
  
  // ... resto del código
}
```

## Conclusión

Los Exception Filters son una herramienta poderosa para centralizar el manejo de errores en NestJS. Esta implementación específica para `QueryFailedError` proporciona:

- **Manejo automático** de errores de base de datos
- **Mensajes amigables** para el usuario final
- **Escalabilidad** sin mantenimiento adicional
- **Consistencia** en todas las respuestas de error

Al implementar este patrón, tu aplicación tendrá un manejo de errores robusto y profesional que mejora significativamente la experiencia del usuario y facilita el debugging para los desarrolladores.
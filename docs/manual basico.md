<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Manual de inicio

1 - crear el archivo `.env`
2 - crear el archivo `docker-compose.yaml`

```
version: '3.8'

services:
  db:
    image: postgres:15.3
    restart: always
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_DB: ${DB_NAME}
    container_name: petrogassa-backend-container
    ports:
      - 5432:5432
    volumes:
      - ./postgres:/var/lib/postgresql/data
```

3 - usar el comando
```
docker compose up -d
```
4 - Verificar que la base de datos este corriendo correctamente 


# Configurar variables de entorno dentro de la aplicacion de nestjs
1 - instalar dependencias
```
npm install --save @nestjs/config
```
2 - agregar el modulo ConfigModule en el archivo `app.module.ts`
```
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```
3 - agregar las variables de entorno en el archivo `.env`

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=p0stgr3sSQL
DB_NAME=petrogassa
```


# Conectar Postgres a la aplicación NestJS - TypeORM
1 - instalar dependencias.
```
npm install --save @nestjs/typeorm typeorm pg
```
2 - agregar el modulo TypeOrmModule en el archivo app.module.ts
```
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })],
})
export class AppModule {}
```

3 - agregar las variables de entorno en el archivo .env
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=p0stgr3sSQL
DB_NAME=petrogassa
```

4 - Empezar a crear entidades y luego DTOS - ejemplo una entity usuario

```
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;
}
```
5 - agregar el modulo TypeOrmModule en el archivo `{modulo correspondiente a la entidad}.module.ts` y tambien la entidad creada
5.1 - es opcional exportar si la necesito inyectar en otro modulo
```
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
})
export class UsersModule {}
```

6 - Crear un DTO - instalar dependencias
```
npm install class-validator class-transformer
```

7 - El archivo `main.ts` debe quedar asi: useGlobalPipes para validar los datos que vienen en el body de la peticion

```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```
1 - Crear el modulo auth.
```
nest g res auth --no-spec
```

2 - Renombrar la entidad a users y obtener algo similar a este codigo
```
@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, type: 'text' })
    email: string;

    // el select en false es para que no devuelva la columna en las relaciones
    @Column('text', { select: false })
    password: string;

    @Column('text')
    fullName: string;

    @Column({ default: true, type: 'bool' })
    isActive: boolean;

    @Column({ type: 'text', array: true, default: ['user'] })
    roles: string[];


    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert()
    }
}
```

3 - Definir los controladores y servicios
```
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }
}
```
4 - En los servicios no olvidar crear el metodo handleDBErrors
```
private handleDBErrors(error: any) {
    if (error.code === '23505') {
        throw new BadRequestException(error.detail);
    }
}
```

5 - Guardar Contraseñas hasheadas

Dependencias:
```
npm install bcryptjs
```
Tipado solo se instala en desarrollo
```
npm install @types/bcryptjs --save-dev
```

```
@BeforeInsert()
@BeforeUpdate()
async hashPassword() {
    if (!this.password) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
}
```
### Otra forma de encriptar la contraseña es en el service de usuarios.



# Podemos basicamente separar el modulo de auth del usuario

- Modulo Auth:
    - Controller: Endpoints para crear, login, revalidar token, etc.
    - Service: Para manejar la lógica de negocio, como el login, el registro, etc.
    - Strategy: Para manejar la autenticación, como el JWT.
    - DTO: Para manejar los datos que vienen de la petición. (email, password)
    - Module: Para agrupar todo lo anterior.
- Modulo Usuarios:
    - Controller: Endpoints para obtener, crear, actualizar, eliminar usuarios.
    - Service: Para manear la logica de negocio.
    - Entity: Para manejar la base de datos.
    - DTO: Para manejar los datos que vienen de la petición.
    - Module: Para agrupar todo lo anterior.


### Crear el modulo Auth
1 - Ejecutamos el comando
```
nest g res auth --no-spec
```

2 - El modulo Auth debe encargarse del login de usuario, de firmar tokens y de validar tokens.
    - El servicio de login deberia quedar algo asi:
```
Async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'password', 'email'],       // {email: true, password: true}
    });
    if (!user) {
        throw new UnauthorizedException('Credentials are not valid');
    }
    const isMatch = await bcrypt.compareSync(password, user.password);
    if (!isMatch) {
        throw new UnauthorizedException('Credentials are not valid');
    }
    // Retornar el Token de acceso - Ver Crear JWT
    return {
        id: user.id,
        email: user.email,
        roles: user.roles,
    }
}
```

3 - Crear JWT - Visitar `https://docs.nestjs.com/recipes/passport` por dudas.
Instalar las dependencias:

```
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
```

Instalar tipados:

```
npm install --save-dev @types/passport-jwt
```

4 - Configurar el modulo de Auth:

Esta configuracion es solo inicial.

```
@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        //configuracion del 'jwt' en modo asincrono
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            // funcion que se ejecuta cuando se intenta registrar de forma asincrona el modulo
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRED_TIME'),
                },
            }),
        }),
    ],
})
export class AuthModule { }
```
5 - Informacion que guardaremos en el JWT

En Auth creamos la carpeta `strategies` posteriormente el archivo `jwt.strategy.ts`.
Contenido de `jwt.strategy.ts`:

Todas las estrategias son injectable, por lo que podemos inyectar los repositorios y los servicios.

```
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        configService: ConfigService,
    ) {
        //esto se invoca por llamar al constructor
        super({
            //de donde va a extraer el token
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
    }

    // crear el interface para el payload funcion debe llamar asi ya que el decorador @UseGuards(JwtAuthGuard()) invoca al metodo 
    //validate
    async validate(payload: any): Promise<User> {
        const { id, email, roles } = payload;
        // buscar el usuario
        const user = await this.userRepository.findOne({
            where: { id },
        });
        if (!user) {
            throw new UnauthorizedException('Token is not valid');
        }

        if(!user.isActive){
            throw new UnauthorizedException('User is inactive');
        }
        // si pasa todas estas validaciones el usuario esta activo y existe y pasa a la request
        // donde se puede acceder a la informacion del usuario a traves de los decoradores
        return {
            id,
            email,
            roles,
        }
    }
}
```

6 - Actualiazamos el `AuthModule` implementando el `JwtStrategy`:
```
@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        //configuracion del 'jwt' en modo asincrono
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            // funcion que se ejecuta cuando se intenta registrar de forma asincrona el modulo
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRED_TIME'),
                },
            }),
        }),
    ],
    exports: [JwtStrategy, PassportModule,JwtModule],
})
export class AuthModule { }
```

6 - Generar JWT:

### Volviendo al punto 2:
```
Async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'password', 'email'],       // {email: true, password: true}
    });
    if (!user) {
        throw new UnauthorizedException('Credentials are not valid');
    }
    const isMatch = await bcrypt.compareSync(password, user.password);
    if (!isMatch) {
        throw new UnauthorizedException('Credentials are not valid');
    }
    // Retornar el Token de acceso - Ver Crear JWT
    return {
        id: user.id,
        email: user.email,
        roles: user.roles,
        token: this.getJWT({ id: user.id, email: user.email, roles: user.roles }),
    }
}
```

Funcion que genera los JWT:
jwtService se inyecta en el constructor del AuthService o donde se necesite ya viene de `@nestjs/jwt` y se alimenta
de la configuracion previa del jwtModule en el auth module.

```
private getJWT(payload: any) {
    return this.jwtService.sign(payload);
}
```
Para proteger las rutas basta con agregar los decoradores
```
@UseGuards(AuthGuard())
```

### Obtener un usuario mediante decoradores
- Nota: cuando pasa el guard el user ya queda en la request podemos obtenerlo de esta forma:

```
@Get('ruta')
@UseGuards(AuthGuard())
//una ruta cualquiera que recibe la request como parametro
getUser(@Req() req: any) {
    return req.user;
}
```
### Obtener un usuario mediante decoradores personalizados (decorador de parametro)
- Nota: cuando pasa el guard el user ya queda en la request podemos obtenerlo de esta forma:

en Auth crear la carpeta `decorators` y crear el archivo del decorador:

data contiene los parametros pasados al decorador, y ctx contiene el contexto de ejecucion.

```
export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        if(!user){
            throw new InternalServerErrorException('User not found');
        }
        return data ? user[data] : user;
    },
);
```


### Custom guards y custom decorators
- Nota: los guards personalizados son muy utiles para reutilizar la logica de proteccion de rutas en diferentes modulos.
- Nota: los decoradores personalizados son muy utiles para reutilizar la logica de obtencion de datos de la request en diferentes modulos.

Para generar un Guard implementando el cli de nest:
```
nest g gu auth/guards/{nombreArchivo} --no-spec
```

```
@Injectable()
export class UserRoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        //obtencion de la metadata
        //esto se obtiene con el decorador @SetMetadata('roles',['admin','user']) puesto en el controlador
        //aca cambiamos 'roles' por META_ROLES (ver mas abajo porque)
        const roles: string[] = this.reflector.get(META_ROLES, context.getHandler());

        //sacamos al usuario de la request
        const req = context.switchToHttp().getRequest();
        const user = req.user;

        if(!roles || roles.length === 0){
            return true;
        }

        if(!user){
            throw new BadRequestException('User not found');
        }

        for(const role of roles){
            if(user.roles.includes(role)){
                return true;
            }
        }
        throw new ForbiddenException('User does not have the required role');
    }
}
```

Crear un decorador para los roles:

```
nest g d auth/decorators/roleProtected --no-spec
```

```
import { SetMetadata } from '@nestjs/common';

//metakey para los roles
export const META_ROLES = 'roles';

//decorador para los roles
export const RoleProtected = (...args: ValidRoles[]) => SetMetadata(META_ROLES, args);
```

Los roles los guardamos en una interfaz:

```
export enum ValidRoles {
    admin = 'admin',
    user = 'user',
    superAdmin = 'superAdmin',
}
```
Para usar los decoradores implementados lo hacemos asi:

```
@Get('rutaprivada')
@RoleProtected(ValidRoles.superUser,ValidRoles.admin) // @RoleProtected(ValidRoles.superUser,ValidRoles.admin)
@UserGuards(AuthGuard(), UserRoleGuard)
```

### Composicion de decoradores
`https://docs.nestjs.com/custom-decorators#decorator-composition`

Creamos el decorador en auth
```
import { applyDecorators } from '@nestjs/common'
//ValidRoles es mi interfaz de roles
export function Auth(...roles: ValidRoles[]) {
    return applyDecorators(
        RoleProtected(...roles),
        UserGuards(AuthGuard(), UserRoleGuard),
    );
}
```
`Este decorador sirve para verificar roles y token`
solo basta con usar `@Auth(ValidRoles.superAdmin,ValidRoles.admin)` como ejemplo.
si no es necesario roles solo token usando `@Auth()` alcanza

Recordemos que pasar usar el `AuthModule` en otros modulos para proteger los endpoints debemos
exportar este modulo, exportar passport e importar solo el modulo `AuthModule` donde sea necesario.

### Relaciones - relacionar un usuario con muchos productos

En la entidad de usuarios usar el decorador: `@OneToMany`

```
la primer funcion dice a que tabla estoy apuntando,
la segunda funcion dice con que atributo de la otra tabla me estoy conectando / relacionando
@OneToMany(() => Product, (product) => product.user)
products: Product[];
```

En la entidad producto:
```
@ManyToOne(() => User, (user) => user.products, { eager: true })
user: User;
```
`{eager: true}` es para traer las relaciones, es decir si uso el endpoint de productos me va a traer el usuario al que pertenece el producto.

### Como introducir el ID de la persona que crea un producto.
Esto se hace en `products.controller` enviando el usuario en `BearerToken` en el header de la peticion.
usando los decorades correspondientes antes creados (para obtener el usuario)


## Check AuthStatus
basicamente es crear un endpoint para retonar todo el usuario con un token nuevo,
esto sirve para restaurar el vencimiento del token.

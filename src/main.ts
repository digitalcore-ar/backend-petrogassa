import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { QueryFailedExceptionFilter } from './common/exceptions/QueryFailedException.filter';
import { ValidationExceptionFilter } from './common/exceptions/ValidationException.filter';
import { GeneralExceptionFilter } from './common/exceptions/GeneralException.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    whitelist: true,
    forbidNonWhitelisted: true,
  }))
  app.useGlobalFilters(
    new QueryFailedExceptionFilter(),
    new ValidationExceptionFilter(),
    new GeneralExceptionFilter()
  );
  app.useGlobalInterceptors(
    new ResponseInterceptor()
  )
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

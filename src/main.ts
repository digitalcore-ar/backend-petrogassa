import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { QueryFailedExceptionFilter } from './common/filters/queryFailedException.filter';
import { ValidationExceptionFilter } from './common/filters/validationException.filter';
import { GeneralExceptionFilter } from './common/filters/generalException.filter';
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
    new ValidationExceptionFilter(),
    new QueryFailedExceptionFilter(),
    new GeneralExceptionFilter()
  );
  app.useGlobalInterceptors(
    new ResponseInterceptor()
  )
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

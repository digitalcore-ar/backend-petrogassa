import { Module } from '@nestjs/common';
import { ExceptionService } from './exceptions/exceptions.service';

@Module({
    providers: [ExceptionService],
    exports: [ExceptionService]
})
export class CommonModule { }

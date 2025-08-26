import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
import { FilesService } from '../services/files.service';
import { CreateFileDto } from '../dto/create-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter } from '../helpers/fileFilter.helper';
import { diskStorage } from 'multer';
import { dinamicDestination } from '../helpers/dinamicDestination.helper';
import { fileNamer } from '../helpers/fileNamer.helper';

@Controller('files/vehicles')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post(':vehicleId/:type')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    // storage: diskStorage({
    //   destination: dinamicDestination,
    //   filename: fileNamer
    // })
  }))
  create(@Param('vehicleId') vehicleId: string, @Param('type') type: string, @UploadedFile() file: Express.Multer.File) {
    return this.filesService.uploadVehicleFile(vehicleId, type, file);
  }
}

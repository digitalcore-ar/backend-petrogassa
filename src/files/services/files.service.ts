import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {

    uploadVehicleFile(vehicleId: string, type: string, file: Express.Multer.File){
        return {
            vehicleId,
            type,
            file
        }
    }
}

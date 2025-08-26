import { Logger } from '@nestjs/common';
import { Request } from 'express';

export const fileNamer = (req: Request, file: Express.Multer.File, callback: Function) => {

    const vehicleId = req.params.vehicleId;
    const type = req.params.type;
    const today = new Date();

    const logger = new Logger('fileNamer');
    if (!file) {
        return callback(new Error('File is empty - fileNamer'), false);
    }

    const fileExtension = file.mimetype.split('/')[1];
    const fileName = `${vehicleId}-${type}-${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}.${fileExtension}`;
    logger.debug(`File a subir: ${fileName}`);

    callback(null, fileName);

}
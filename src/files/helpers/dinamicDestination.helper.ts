import { Logger } from '@nestjs/common';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export const dinamicDestination = (req: Request, file: Express.Multer.File, callback: Function) => {

    const logger = new Logger('dinamicDestination');
    try {
        const vehicleId = req.params.vehicleId;
        const type = req.params.type;

        const uploadPath = path.join(process.cwd(), 'static', 'uploads', 'vehicles', vehicleId, type);
        fs.mkdirSync(uploadPath, { recursive: true });
        logger.debug(`Upload path: ${uploadPath}`);
        callback(null, uploadPath);
    } catch (error) {
        callback(error as Error, '');
    }
}
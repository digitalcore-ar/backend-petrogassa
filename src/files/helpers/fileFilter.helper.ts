import { Logger } from "@nestjs/common";


export const fileFilter = (req: Request, file: Express.Multer.File, callback: Function) => {

    const logger = new Logger('fileFilter');
    if (!file) {
        return callback(new Error('File is empty - fileInterceptor'), false);
    }
    logger.debug(`File a subir: ${file.originalname}`);
    const fileExtension = file.mimetype.split('/')[1];
    const validExtensions = ['pdf', 'jpeg', 'png', 'gif'];

    if (!validExtensions.includes(fileExtension)) {
        return callback(new Error('Invalid file extension - fileInterceptor'), false);
    }

    callback(null, true);

}
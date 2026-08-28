import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const signatureMulterOptions = {
  storage: diskStorage({
    destination: './uploads/firmas',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `firma-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req: any, file: any, callback: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      return callback(new BadRequestException('Solo se permiten imágenes (PNG, JPG, JPEG)'), false);
    }
    callback(null, true);
  },
};

export const profilePhotoMulterOptions = {
  storage: diskStorage({
    destination: './uploads/perfiles',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `foto-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req: any, file: any, callback: any) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return callback(new BadRequestException('Solo se permiten imágenes (PNG, JPG, JPEG, WEBP)'), false);
    }
    callback(null, true);
  },
};

import { Request } from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';

// 1. S3 클라이언트 설정
export const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
});

// 2. S3용 Multer 유틸리티
export const s3Util = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME as string,
        //acl: 'public-read', // 또는 'private'
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, key?: string) => void) {
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            const fileName = `images/${basename}-${Date.now()}${ext}`;
            cb(null, fileName);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            const error = new Error('이미지 파일만 업로드 가능합니다.');
            cb(error);
        }
    },
});

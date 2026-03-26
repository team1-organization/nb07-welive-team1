import multer, { FileFilterCallback } from 'multer';
import _path from 'path';
import fs from 'fs/promises';
import { Request } from 'express';

export const multerUtil = multer({
  storage: multer.diskStorage({
    // 사용자별 폴더 생성
    destination: async function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) {
      const imageType = (req.body.type as string) || 'others';
      console.log(`imageType : ${imageType}`);
      const uploadDir = _path.join('public', 'images', imageType);
      try {
        // 폴더가 없으면 생성
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (err) {
        cb(err as Error, uploadDir);
      }
    },
    filename: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) {
      // 프로필 사진은 하나만: image + 타임스탬프 + 확장자
      const ext = _path.extname(file.originalname);
      const type = (req.query.type as string) || 'file';
      cb(null, `${type}-${Date.now()}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    // 이미지 파일만 허용
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(_path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      const fileTypeError = new Error(
        '이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, gif, webp)',
      );
      fileTypeError.name = 'FileTypeValidationError';
      cb(fileTypeError);
    }
  },
});

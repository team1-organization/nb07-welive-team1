import type { User as UserType } from './auth.type';
import { MulterS3File } from 'multer-s3';

declare global {
    namespace Express {
        interface User extends UserType {}

        interface Request {
            user?: User;
            file?: Multer.File | MulterS3File;
            files?: Multer.File[] | { [fieldName: string]: Multer.File[] } | MulterS3File[];
        }
    }

    interface BigInt {
        toJSON(): string;
    }
}

export {};

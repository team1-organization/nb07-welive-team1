import type { User as UserType } from './auth.type';

declare global {
    namespace Express {
        interface User extends UserType {}

        interface MulterS3File extends Multer.File {
            location: string;
            bucket: string;
            key: string;
            acl: string;
        }

        interface Request {
            user?: User;
            file?: MulterS3File;
            files?: MulterS3File[] | { [fieldName: string]: MulterS3File[] } | MulterS3File[];
        }
    }

    interface BigInt {
        toJSON(): string;
    }
}

export {};

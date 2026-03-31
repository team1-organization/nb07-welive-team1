import type { User as UserType } from './auth.type';

declare global {
    namespace Express {
        interface User extends UserType {}

        interface Request {
            user?: User;
            file?: Multer.File;
            files?: Multer.File[] | { [fieldName: string]: Multer.File[] };
        }
    }

    interface BigInt {
        toJSON(): string;
    }
}

export { };

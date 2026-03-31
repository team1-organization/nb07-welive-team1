//import type { User as UserType } from './user.type';

declare global {
  namespace Express {
    interface User {
      id: bigint;
      apartmentId: bigint;
      role: string;
    }

    interface Request {
      //          user?: User;
      file?: Multer.File;
      files?: Multer.File[] | { [fieldName: string]: Multer.File[] };
    }
  }
  interface BigInt {
    toJSON(): string;
  }
}

export { };


import { CustomError } from './CustomError';

export class UnauthorizedError extends CustomError {
    constructor(message: string = '인증이 필요합니다.') {
        super(401, message);
    }
}

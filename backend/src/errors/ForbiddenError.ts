import { CustomError } from './CustomError';

export class ForbiddenError extends CustomError {
    constructor(message: string = '접근 권한이 없습니다.') {
        super(403, message);
    }
}

import { CustomError } from './CustomError';

export class ConflictError extends CustomError {
  constructor(message: string = '데이터 충돌이 발생했습니다.') {
    super(409, message);
  }
}

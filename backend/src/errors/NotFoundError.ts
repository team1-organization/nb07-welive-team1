import { CustomError } from './customError';

export class NotFoundError extends CustomError {
  constructor(message: string = '리소스를 찾을 수 없습니다.') {
    super(404, message);
  }
}

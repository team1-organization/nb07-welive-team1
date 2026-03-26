import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import cookieParser from 'cookie-parser';
import http from 'http';
import { errorHandler } from './errors/errorHandler';

BigInt.prototype.toJSON = function (): string {
  return this.toString();
};

const app = express();
app.use(morgan('dev'));

app.use(morgan(':method :url '));
const allowedOrigins = [
  'http://localhost:3001', // 로컬 개발용
  //배포된 주소(현재 없음)
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  }),
);

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(errorHandler);

const a = 'x';
console.log(a);

const server = http.createServer(app);

export default server;

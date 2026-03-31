import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import morgan from 'morgan';
import { errorHandler } from './errors/errorHandler';
import residentRouter from './routers/resident.router';

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

app.use('/api/residents', residentRouter);

app.use(errorHandler);

const server = http.createServer(app);
export default server;

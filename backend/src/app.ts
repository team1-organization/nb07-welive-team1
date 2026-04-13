import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import morgan from 'morgan';
import { errorHandler } from './errors/errorHandler';
import passport from './lib/passport';
import authRouter from './routers/auth.router';
import complaintRouter from './routers/complaint.router';
import noticeRouter from './routers/notice.router';
import optionRouter from './routers/option.router';
import pollRouter from './routers/poll.router';
import residentRouter from './routers/resident.router';
import notificationRouter from './routers/notification.router';
import socket from './lib/socket';

BigInt.prototype.toJSON = function (): string {
    return this.toString();
};

const app = express();
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
    app.use(morgan(':method :url '));
}
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
app.use(passport.initialize());

app.use('/api/auth', authRouter);
app.use('/api/residents', residentRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/polls', pollRouter);
app.use('/api/options', optionRouter);
app.use('/api/notifications', notificationRouter);
app.use(errorHandler);

const server = http.createServer(app);
socket.initialize(server);

export default server;

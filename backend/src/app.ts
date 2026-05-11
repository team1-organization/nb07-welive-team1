import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import morgan from 'morgan';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './errors/errorHandler';
import passport from './lib/passport';
import socket from './lib/socket';
import { PollRepository } from './repositories/poll.repository';
import apartmentRouter from './routers/apartment.router';
import authRouter from './routers/auth.router';
import commentRouter from './routers/comment.router';
import complaintRouter from './routers/complaint.router';
import eventRouter from './routers/event.router';
import imageRouter from './routers/image.router';
import noticeRouter from './routers/notice.router';
import notificationRouter from './routers/notification.router';
import optionRouter from './routers/option.router';
import pollRouter from './routers/poll.router';
import residentRouter from './routers/resident.router';
import userRouter from './routers/user.router';
import { PollService } from './services/poll.service';
import { initializeScheduler } from './utils/scheduler';

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
    'https://nb07-welive-team1-git-develop-codes-gys-projects.vercel.app', //배포된 주소
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

// Swagger 설정
const port = process.env.PORT || 3000;
const servers = [
    {
        url: `http://localhost:${port}`,
        description: '로컬 개발 서버',
    },
];

if (process.env.DEPLOY_URL) {
    servers.push({
        url: process.env.DEPLOY_URL,
        description: '배포 서버',
    });
}

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Welive API',
            version: '1.0.0',
            description: 'NB 7기 1팀 고급 프로젝트 API',
        },
        servers: servers,
    },
    apis: [path.join(process.cwd(), './src/docs/swagger.yaml'), path.join(process.cwd(), './src/docs/!(swagger).yaml')],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, undefined, {
        swaggerOptions: {
            tagsSorter: undefined,
            operationsSorter: undefined,
            defaultModelsExpandDepth: -1,
        },
    }),
);

app.use('/api/auth', authRouter);
app.use('/api/residents', residentRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/comments', commentRouter);
app.use('/api/polls', pollRouter);
app.use('/api/options', optionRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/users', userRouter);
app.use('/api/images', imageRouter);
app.use('/api/apartments', apartmentRouter);
app.use('/api/event', eventRouter);
app.use(errorHandler);

const server = http.createServer(app);
socket.initialize(server);

const pollRepository = new PollRepository();
const pollService = new PollService(pollRepository);

initializeScheduler(pollService);

export default server;

import http from 'http';
import { ExtendedError, Server, Socket } from 'socket.io';
import { BadRequestError } from '../errors/BadRequestError';
import * as authService from '../services/auth.service';
import { User } from '../types/auth.type';
import { Notification } from '../types/notification.type';
import { safeString } from '../utils/string.util';

class SocketService {
    private io: Server;

    constructor() {
        this.io = new Server({
            cors: {
                origin: ['http://localhost:3000', 'http://localhost:3001'],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            },
        });
        this.io.use(this.authenticate);
    }

    initialize(httpServer: http.Server) {
        this.io.attach(httpServer);
        this.io.on('connection', (socket) => {
            console.log('소켓 연결됨:', socket.id);

            socket.on('disconnect', (reason) => {
                console.log('소켓 연결종료:', socket.id, reason);
            });
        });
    }

    // 유저 ID
    sendNotification(userId: string, notification: Notification) {
        this.io.to(`USER_${userId}`).emit('notification', notification);
    }

    // 룸 네임으로 발송
    broadcastToRoom(roomName: string, notification: Partial<Notification>) {
        this.io.to(roomName).emit('notification', notification);
    }

    // 민원
    sendComplaintToAdmin(apartmentId: string, notification: Partial<Notification>) {
        this.io.to(`A:${apartmentId}:ADMIN`).emit('complaint', notification);
    }

    // 공지사항
    sendNoticeToApartment(apartmentId: string, notification: Partial<Notification>) {
        this.io.to(`A:${apartmentId}:ADMIN`).emit('notice', notification);
    }

    private async authenticate(socket: Socket, next: (err?: ExtendedError) => void) {
        let user: User;
        try {
            let accessToken = socket.handshake.auth.accessToken;
            if (!accessToken && socket.handshake.headers.authorization) {
                const authHeader = socket.handshake.headers.authorization;
                if (authHeader.startsWith('Bearer')) {
                    accessToken = authHeader.split(' ')[1];
                }
            }

            if (!accessToken) return next(new BadRequestError('인증 토큰이 없습니다'));

            user = await authService.authenticate(accessToken);
        } catch (error) {
            next(error as ExtendedError);
            return;
        }

        // 사용자 개인
        await socket.join(`USER_${safeString(user.id)}`);
        // 권한별
        await socket.join(`ROLE_${safeString(user.role)}`);
        // 읽지않은 알림
        await socket.join('unread_notifications');
        // 아파트 관련
        const isAdmin = user.role === 'ADMIN';
        const isUser = user.role === 'USER';
        const isApartment = user.apartmentId ? user.apartmentId : undefined;
        if (isApartment) {
            // 아파트 전체 입주민
            await socket.join(`APT_${safeString(user.apartmentId)}`);
            // 아파트의 모든 관리자
            if (isAdmin) {
                await socket.join(`A:${safeString(user.apartmentId)}:${user.role}`);
            }
            // 아파트의 일반 사용자(USER)
            if (isUser) {
                await socket.join(`A:${safeString(user.apartmentId)}:USER`);
            }
        }
        next();
    }
}

export default new SocketService();

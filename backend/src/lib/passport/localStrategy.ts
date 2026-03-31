import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';
import { NotFoundError } from '../../errors/NotFoundError';
import { loginUserBody, LoginUserDTO } from '../../dtos/auth.dto';
import { User } from '../../types/auth.type';

const localStrategy = new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
    },
    async (username: string, password: string, done) => {
        const data: LoginUserDTO = loginUserBody.parse({ username, password });
        if (!username || !password) {
            return done(new NotFoundError('잘못된 요청입니다'), false);
        }
        const user = await prisma.user.findUnique({
            where: {
                userId: data.username,
            },
        });
        if (!user || !user.password) {
            return done(null, false, { message: '존재하지 않거나 비밀번호가 일치하지 않습니다' });
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            return done(new NotFoundError('존재하지 않거나 비밀번호가 일치하지 않습니다'), false);
        }
        return done(null, User.fromEntity(user));
    },
);
export default localStrategy;

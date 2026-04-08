import { ExtractJwt, Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import { prisma } from '../prisma';
import { ACCESS_TOKEN_COOKIE_NAME, JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET, REFRESH_TOKEN_COOKIE_NAME } from '../constants';
import { Request } from 'express';
import { User } from '../../types/auth.type';

interface JwtPayload {
    id: string;
}
/*
쿠키 방식
const accessTokenOptions = {
  jwtFromRequest: (req: Request) => req.cookies[ACCESS_TOKEN_COOKIE_NAME],
  secretOrKey: JWT_ACCESS_TOKEN_SECRET,
};

const refreshTokenOptions = {
  jwtFromRequest: (req: Request) => req.cookies[REFRESH_TOKEN_COOKIE_NAME],
  secretOrKey: JWT_REFRESH_TOKEN_SECRET,
};
*/

// 헤더 방식
const accessTokenOptions = {
    // 헤더(Bearer)와 쿠키 모두 지원하도록 수정
    jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // 1. Authorization: Bearer <token> 확인
        (req: Request) => req.cookies?.[ACCESS_TOKEN_COOKIE_NAME], // 2. 쿠키 확인
    ]),
    secretOrKey: JWT_ACCESS_TOKEN_SECRET,
};
const refreshTokenOptions = {
    jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // 1. Authorization: Bearer <token> 확인
        (req: Request) => req.cookies?.[REFRESH_TOKEN_COOKIE_NAME], // 2. 쿠키 확인
    ]),
    secretOrKey: JWT_REFRESH_TOKEN_SECRET,
};

async function jwtVerify(payload: JwtPayload, done: VerifiedCallback) {
    try {
        if (!payload.id) return done(null, false);
        const user = await prisma.user.findUnique({
            where: { id: BigInt(payload.id) },
        });
        if (!user) return done(null, false);
        done(null, User.fromEntity(user));
    } catch (err) {
        done(err, false);
    }
}

export const accessTokenStrategy = new JwtStrategy(accessTokenOptions, jwtVerify);

export const refreshTokenStrategy = new JwtStrategy(refreshTokenOptions, jwtVerify);

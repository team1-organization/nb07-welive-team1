import passport from 'passport';
import localStrategy from './localStrategy';
import googleStrategy from './googleStrategy';
import { accessTokenStrategy, refreshTokenStrategy } from './jwtStrategy';

passport.use('local', localStrategy);
passport.use('accessToken', accessTokenStrategy);
passport.use('refreshToken', refreshTokenStrategy);
passport.use('google', googleStrategy);

export default passport;

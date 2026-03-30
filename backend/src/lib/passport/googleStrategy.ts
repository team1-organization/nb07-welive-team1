// import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
// import { prisma } from '../prisma';
// import { NotFoundError } from '../../errors/NotFoundError';
// import { GOOGLE_CALLBACK_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../constants';
//
// const googleStrategy = new GoogleStrategy(
//     {
//         clientID: GOOGLE_CLIENT_ID,
//         clientSecret: GOOGLE_CLIENT_SECRET,
//         callbackURL: GOOGLE_CALLBACK_URL,
//     },
//     async (_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
//         const email = profile.emails?.[0]?.value;
//
//         if (!email) {
//             return done(new NotFoundError('잘못된 요청입니다'), false);
//         }
//         let user = await prisma.user.findUnique({
//             where: {
//                 email,
//             },
//         });
//         if (!user) {
//             return done(new NotFoundError('회원가입을 진행해주세요.'), false);
//         }
//         if (!user.provider || !user.provider_id) {
//             user = await prisma.user.update({
//                 where: { id: BigInt(user.id) },
//                 data: {
//                     provider: 'GOOGLE',
//                     provider_id: profile.id,
//                 },
//             });
//         }
//
//         return done(null, user);
//     },
// );
// export default googleStrategy;

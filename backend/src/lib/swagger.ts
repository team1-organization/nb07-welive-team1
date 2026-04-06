// import swaggerUi from 'swagger-ui-express';
// import swaggerJsdoc from 'swagger-jsdoc';
// import path from 'path';
// import { fileURLToPath } from 'url';
//
// const _filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(_filename);
// const swaggerPath = path.resolve(__dirname, '../../src/lib/swagger/**/*.yaml');
//
// const options = {
//     swaggerDefinition: {
//         openapi: '3.0.0',
//         info: {
//             version: '1.0.0',
//             title: 'welive',
//             description: '스프린트 1팀 고급 프로젝트',
//         },
//         servers: [
//             /*
//             {
//                 url: 'https://sprint4-gqmg.onrender.com',
//                 description: '배포 환경',
//             },
//              */
//             {
//                 url: 'http://localhost:3000',
//                 description: '개발 환경',
//             },
//         ],
//         tags: [
//             { name: 'Auth', description: '인증 관리' },
//             { name: 'Users', description: '사용자 관리' },
//             { name: 'Apartments', description: '아파트 관리' },
//             { name: 'Residents', description: '입주민 관리' },
//             { name: 'Complaints', description: '민원 관리' },
//             { name: 'Polls', description: '투표 관리' },
//             { name: 'Notices', description: '공지사항 관리' },
//             { name: 'Comments', description: '댓글 관리' },
//             { name: 'Notifications', description: '알림 관리' },
//             { name: 'Events', description: '이벤트 관리' },
//         ],
//     },
//
//     apis: [swaggerPath],
// };
//
// export const specs = swaggerJsdoc(options);
//
// export { swaggerUi };

## 시작하기

### 1. 의존성 설치 및 환경 변수 설정

#### **패키지 설치**
```bash
npm install
```
.env 파일 생성

공유받은 설정값을 바탕으로 환경 변수 파일을 생성합니다.
```bash
touch .env
```

### 2. 로컬 개발용 DB 실행 (Docker)
도커를 사용하여 로컬 환경에 PostgreSQL 인스턴스를 실행합니다.
```bash
docker-compose up -d db
```

### 3. Prisma 설정 (DB 스키마 동기화)
설계된 DB 스키마를 로컬 DB에 적용하고 Prisma Client를 생성합니다.

DB 스키마 push
```bash
npx prisma db push
```
Prisma Client 생성
```bash
npx prisma generate
```

### 4. 명령 스크립트
| 명령어 | 설명 |
| :--- | :--- |
| `npm run dev` | 개발 모드로 서버 실행 (tsx/nodemon) |
| `npm run start` | 프로덕션 모드로 서버 실행 |
| `npm run build` | TypeScript 코드를 JavaScript로 컴파일 |
| `npm run test` | Jest를 이용한 테스트 코드 실행 |

### 협업 규칙 (Coding Convention)
### 5. ESLint & Prettier 설정 (필수)
일관된 코드 스타일 유지를 위해 VS Code에서 아래 확장 프로그램을 반드시 설치해 주세요.
- ESLint (dbaeumer.vscode-eslint)
- Prettier - Code formatter (esbenp.prettier-vscode)

저장 시 자동으로 포맷팅이 적용되도록 VS Code의 Editor: Format On Save 설정을 권장합니다.

### 6. 커밋 메시지 규칙
커밋 메시지는 아래와 같은 태그로 시작합니다.

- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 수정 (README 등)
- test: 테스트 코드 추가

### 7. 주요 API 및 기술 스택
- Framework: Express.js (TypeScript)
- Database: PostgreSQL
- ORM: Prisma
- Auth: Passport.js (Google OAuth 2.0)
- Real-time: Socket.io
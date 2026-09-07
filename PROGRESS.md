 # Heroku 배포 마이그레이션 진행상황

목표: **backend(EC2+PM2) → Heroku**로 이전. **frontend는 Vercel 유지** (Heroku 이전 대상 아님 — 2026-09-07 방향 전환, 최초 계획은 frontend도 Heroku였으나 변경됨).
방식: 백엔드 Docker 이미지를 Heroku Container Registry에 CLI로 push/release (heroku.yml·git subtree 방식은 채택하지 않음).
비용 근거: GitHub Student Developer Pack의 "Heroku for GitHub Students" 크레딧(월 $13, 24개월) 활용.
DB: Heroku Postgres 애드온 대신 **Neon DB 사용**.

## 완료된 작업

- [x] `backend/Dockerfile`: `npm install` → `npm ci`로 변경. `server.ts`가 이미 `process.env.PORT`를 읽으므로 코드 수정은 불필요했음.
- [x] `backend/heroku.yml` 작성 후 → CLI push 방식 채택으로 **삭제** (해당 방식에선 참조되지 않음).
- [x] `backend/Dockerfile.release` 신규 작성: `npx prisma migrate deploy`를 CMD로 실행. `heroku container:push web release`로 함께 push하면 release phase로 자동 실행됨.
- [x] `welive-backend` Heroku 앱 생성 (`https://welive-backend-fa4727d42ac4.herokuapp.com/`), `heroku stack:set container` 적용.
- [x] GitHub 저장소(`team1-organization/nb07-welive-team1`) Secrets 등록: `HEROKU_API_KEY`(⚠️ `heroku auth:token` 세션 토큰 — **2026-10-07 만료 예정**, 만료 전 `heroku authorizations:create`로 장기 토큰 발급 후 교체 필요), `HEROKU_BACKEND_APP_NAME`=`welive-backend`.
- [x] `welive-backend` Heroku Config Vars 설정 (backend `.env` 값 기반, 아래 두 가지는 조정):
  - `NODE_ENV`: `.env`엔 `"development"`였으나 **`"production"`으로 설정** (prisma/token/errorHandler의 프로덕션 분기에 영향)
  - `PORT`: **설정 안 함** — Heroku가 dyno별로 동적 할당하므로 고정하면 라우팅 깨짐
  - 설정된 값: `DATABASE_URL`(Neon), `ACCESS_TOKEN_COOKIE_NAME`, `REFRESH_TOKEN_COOKIE_NAME`, `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`, `FRONTEND_URL`(=`https://app-welive.haru-dev.me`, Vercel에 연결된 커스텀 도메인), `BACKEND_URL`(둘 다 현재 코드에서 CORS/Swagger 용도로만 사용, 아래 참고), `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
  - Google OAuth 관련 값(`GOOGLE_CLIENT_ID` 등)은 `backend/src/lib/constants.ts`, `googleStrategy.ts`에서 전부 주석 처리되어 미사용 상태라 설정 제외
- [x] `backend/src/app.ts` CORS 수정: 하드코딩된 `*.vercel.app` 목록 → `process.env.FRONTEND_URL` 기준으로 변경 (프론트는 계속 Vercel에 있고, 커스텀 도메인 `app-welive.haru-dev.me`로 접근한다는 전제). Swagger `배포 서버` URL도 `DEPLOY_URL`(미설정 상태였음) → `process.env.BACKEND_URL`로 변경. `tsc --noEmit` 통과 확인.
- [x] `.github/workflows/DEPLOY.yaml` → **`.github/workflows/BACKEND_DEPLOY.yaml`로 이름 변경** (내용은 동일: EC2 SSH+PM2 배포 → Heroku Container Registry CLI push/release로 교체된 상태).
- [x] **실제 배포 성공** (`develop` push 트리거, GitHub Actions run #49 성공). 과정에서 발견/수정한 이슈:
  - `heroku container:push web release`는 단일 process type만 허용 → `--recursive` 옵션 필요, 이 모드에선 `Dockerfile.<type>` 명명 규칙을 따라야 해서 `backend/Dockerfile`을 `backend/Dockerfile.web`로 이름 변경 (`backend/Dockerfile.release`와 대칭)
  - 최종 커맨드: `heroku container:push web release --recursive -a $HEROKU_BACKEND_APP_NAME`
- [x] 배포 검증: release phase에서 `prisma migrate deploy` 정상 실행("No pending migrations to apply" — Neon DB가 이미 최신 스키마), web dyno가 Heroku 할당 포트로 정상 기동, `GET /api-docs/` → 200, `GET /api/auth`(존재하지 않는 세부 경로) → 정상적인 Express 404 JSON 응답 확인. Socket.io/S3/OAuth 플로우까지의 end-to-end 검증은 아직 안 함(로그인 등 실사용 플로우 테스트 필요).

## 방향 전환 및 되돌린 작업 (2026-09-07)

프론트엔드는 Heroku로 옮기지 않고 **Vercel 유지**로 결정. 아래는 그 전에 진행했다가 되돌린 작업:

- [x] `welive-frontend` Heroku 앱 생성했었으나 → **삭제** (`heroku apps:destroy`)
- [x] `frontend/Dockerfile`, `frontend/.dockerignore` 삭제
- [x] `frontend/next.config.ts`의 `output: 'standalone'` 되돌림 (원본 상태로 복원)
- [x] GitHub Secret `HEROKU_FRONTEND_APP_NAME`, Variable `NEXT_PUBLIC_API_BASE_URL` 삭제
- [x] **구조적 버그 발견 및 수정**: `frontend/.github/workflows/`는 저장소 루트가 아니라서 GitHub Actions가 애초에 인식하지 못하는 위치였음 (GitHub는 레포 **루트**의 `.github/workflows/`만 실행). 즉 기존 `vercel-deploy.yml`도, 임시로 만들었던 `heroku-deploy.yml`도 **한 번도 실제로 실행된 적이 없었음**. 이번에 정리하며 루트 `.github/workflows/FRONTEND_DEPLOY.yaml`로 이전 `vercel-deploy.yml` 내용을 그대로 복원.
  - ⚠️ 이 워크플로우가 쓰는 `VERCEL_TEAM_ID`/`VERCEL_TOKEN`/`VERCEL_PROJECT_NAME` Secret은 저장소에 등록되어 있지 않았음.
- [x] **Vercel 배포 방식 확인**: GitHub API로 커밋 상태 확인한 결과, Vercel의 **GitHub 네이티브 앱 연동**(`apps/vercel`, "Vercel for GitHub")이 이 저장소에 설치되어 있고 push마다 자동으로 배포됨을 확인 (예: 최신 커밋 `9ea4603`도 `Vercel` status "Deployment has completed"로 자동 배포 완료). 워크플로우 파일과 무관하게 동작 — `FRONTEND_DEPLOY.yaml`은 죽은 코드였음이 확정되어 **삭제**.

- [x] **로그인 플로우 실사용 e2e 테스트** (2026-09-07, 배포된 `welive-backend`에 직접 curl로 검증):
  - `POST /api/auth/signup/super-admin` → 201 (테스트 계정 `e2etest_deploy` 생성)
  - `POST /api/auth/login` → 200, `accessToken`/`refreshToken` 쿠키가 `HttpOnly; Secure; SameSite=None`로 정상 발급 (NODE_ENV=production 분기 정상 동작 확인)
  - `POST /api/auth/refresh` → 200, 재발급 정상
  - `GET /api/users/me` (accessToken 쿠키 인증) → 200, 본인 정보 정상 조회 (JWT 서명/검증, passport accessToken 전략 정상)
  - `Origin: https://app-welive.haru-dev.me`로 요청 시 `Access-Control-Allow-Origin`이 해당 도메인으로 정상 반영 (CORS `FRONTEND_URL` 설정 검증됨)
  - 테스트 후 `prisma.user.delete`로 테스트 계정 정리, 삭제 후 재로그인 시 401 확인
  - Google OAuth는 코드상 비활성화 상태라 테스트 대상 아님 (로컬/비밀번호 로그인만 실사용 경로)

## 스토리지: AWS S3 → Cloudflare R2 전환 (2026-09-07)

버킷명 `welive-team-bucket`, S3 호환 엔드포인트 `https://2c8f09ca10b8869f3565b464a418edc5.r2.cloudflarestorage.com`, 공개 개발 URL `https://pub-d8f5da4ce1654e04b110b52c7f415975.r2.dev`로 전환.

- [x] 마이그레이션 전 확인: 운영 DB에 프로필 이미지가 저장된 유저가 0명이라 별도 데이터 이전(S3→R2 오브젝트 복사) 불필요함을 확인 후 진행.
- [x] `backend/src/utils/s3.util.ts`: `S3Client`를 R2 엔드포인트로 재설정 (`region: 'auto'`, `endpoint: CLOUD_FLARE_S3_ENDPOINT`, `forcePathStyle: true`), 자격증명을 `CLOUD_FLARE_ACCESS_KEY_ID`/`CLOUD_FLARE_SECRET_ACCESS_KEY`로 변경.
- [x] `backend/src/services/image.service.ts`: 업로드 응답 URL을 `multerS3`가 반환하는 `location`(R2 비공개 API 엔드포인트라 브라우저에서 못 여는 URL이 됐을 것) 대신 `${CLOUD_FLARE_PUBLIC_URL}/${key}`로 직접 구성하도록 수정. 삭제 시 참조하는 버킷명도 `CLOUD_FLARE_S3_BUCKET_NAME`으로 변경.
- [x] `backend/src/controllers/user.controller.ts`: 프로필 수정 시 DB에 `file.location`(엔드포인트에 종속된 전체 URL) 대신 `file.key`만 저장하도록 통일 — 기존에 `image.service.ts`(key만 저장)와 `user.controller.ts`(전체 URL 저장)가 서로 다르게 저장하던 기존 불일치도 함께 정리됨.
- [x] `backend/src/types/auth.type.ts`의 `generateFullUrl`: AWS S3 도메인 패턴 대신 `${CLOUD_FLARE_PUBLIC_URL}/${key}`로 재구성.
- [x] `frontend/next.config.ts`: Next Image `remotePatterns`의 `welive-team1-bucket.s3...` 항목을 `pub-d8f5da4ce1654e04b110b52c7f415975.r2.dev`로 교체.
- [x] Heroku Config Vars: `CLOUD_FLARE_ACCESS_KEY_ID`, `CLOUD_FLARE_SECRET_ACCESS_KEY`, `CLOUD_FLARE_S3_ENDPOINT`, `CLOUD_FLARE_S3_BUCKET_NAME`, `CLOUD_FLARE_PUBLIC_URL`, `CLOUD_FLARE_ACCOUNT_ID` 추가. 더 이상 쓰지 않는 `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_S3_BUCKET_NAME`/`AWS_REGION`은 제거.
- [x] 배포 후 실사용 e2e 테스트: 테스트 계정으로 로그인 → `PATCH /api/users/me`에 이미지 첨부 업로드 → 응답 `avatar` 필드가 `https://pub-d8f5da4ce1654e04b110b52c7f415975.r2.dev/images/...` 형태로 정상 생성 → 해당 URL 직접 GET 시 200 + `image/png`로 실제 공개 접근 확인. 테스트 후 R2 오브젝트와 테스트 계정 모두 정리.
- ⚠️ **로컬 `backend/.env`에는 `CLOUD_FLARE_S3_BUCKET_NAME`, `CLOUD_FLARE_PUBLIC_URL`이 아직 없음** (Heroku Config Var에만 설정함). 로컬에서 이미지 업로드를 테스트하려면 로컬 `.env`에도 두 값을 추가해야 함 — `CLOUD_FLARE_S3_BUCKET_NAME="welive-team-bucket"`, `CLOUD_FLARE_PUBLIC_URL="https://pub-d8f5da4ce1654e04b110b52c7f415975.r2.dev"`.
- 참고: `.env`의 `CLOUD_FLARE_ACCESS_TOKEN`(`cfat_...`)은 Cloudflare REST API용 토큰이라 S3 호환 인증에는 쓰이지 않음 — 이번 마이그레이션에선 미사용.

## 커스텀 도메인 연결 (2026-09-07)

- [x] `api-welive.haru-dev.me`를 `welive-backend` Heroku 앱에 연결. `heroku domains:add`는 이미 예전에 등록되어 있었음(`heroku domains -a welive-backend`로 확인) — DNS 타겟은 `rigid-muttaburrasaurus-hdiar9epw1mbbmo7vmgrgrlv.herokudns.com` (CNAME).
- [x] `heroku certs:auto:enable`로 Heroku 자동 SSL 인증서(ACM) 활성화. Basic dyno 이상에서만 가능(Eco/Free는 불가 — 이 앱은 Basic이라 문제없음).
- [x] Cloudflare DNS에서 `api-welive` CNAME을 `rigid-muttaburrasaurus-hdiar9epw1mbbmo7vmgrgrlv.herokudns.com`으로 수정 (사용자가 직접 설정, Cloudflare 토큰이 R2 전용이라 DNS 편집 권한 없어서 API로는 처리 못함).
  - 기존엔 이 도메인이 Cloudflare 프록시(주황 구름) 상태로 예전 서버(EC2 추정)를 가리키고 있어서 **525(SSL handshake 실패)로 이미 죽어있던 상태**였음 — 이번에 고치면서 정상화됨.
  - Cloudflare 프록시(주황 구름)를 켠 상태 그대로 둬도 Heroku 인증서 발급 후 정상 동작 확인됨 (DNS only로 바꿀 필요 없었음).
- [x] 검증: `GET https://api-welive.haru-dev.me/api-docs/` → 200, `heroku certs:auto` → "Cert issued", `via: heroku-router` 헤더로 Cloudflare 프록시 통과 후 실제 Heroku까지 도달 확인, `Origin: https://app-welive.haru-dev.me`로 로그인 요청 시 CORS 헤더 정상 반영.

## 다음 단계 (승인 필요 — 아래 항목은 아직 진행 안 함)

1. Socket.io 연결 등 나머지 백엔드 실사용 e2e 검증
2. `HEROKU_API_KEY`를 장기 토큰(`heroku authorizations:create`)으로 교체 (2026-10-07 이전)
3. 기존 EC2 인스턴스 정리 여부 결정 (바로 중단 vs 일정 기간 병행), 안 쓰는 GitHub Secrets(`EC2_HOST`, `EC2_SSH_KEY`, `EC2_USERNAME`) 정리 여부 포함
4. 기존 AWS S3 버킷(`welive-team1-bucket`)을 계속 유지할지, 정리(삭제/보관)할지 결정
5. 프론트 `app-welive.haru-dev.me` 커스텀 도메인도 Vercel에 정상 연결되어 있는지 확인 (백엔드처럼 예전 서버를 가리키고 있진 않은지)

## 협업 규칙

**다음 단계로 진행하기 전에 이 파일을 읽고, 사용자 승인을 받은 뒤 진행할 것.** (사용자 지시, 2026-09-01)

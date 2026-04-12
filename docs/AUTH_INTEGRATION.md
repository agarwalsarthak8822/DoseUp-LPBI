# Customer authentication integration

This app uses **MongoDB** (Mongoose), **bcryptjs** for password hashing, **JWT** (HS256) stored in an **httpOnly cookie**, and **Next.js App Router** API routes. Pharmacy partner login (`/pharmacy/login`) remains a separate demo using `localStorage` and `authenticatePharmacy`.

## Folder structure

```
orchids-medicine-delivery-app/
├── .env.example
├── docs/
│   └── AUTH_INTEGRATION.md          ← this file
├── src/
│   ├── middleware.ts                ← protects /order, /track, /account
│   ├── app/
│   │   ├── api/auth/
│   │   │   ├── signup/route.ts      ← POST: create user, set cookie
│   │   │   ├── login/route.ts       ← POST: verify password, set cookie
│   │   │   ├── logout/route.ts      ← POST: clear cookie
│   │   │   └── me/route.ts          ← GET: current user from JWT
│   │   ├── signup/page.tsx          ← Sign up UI
│   │   ├── login/page.tsx           ← Log in UI
│   │   └── account/page.tsx         ← Protected profile + links
│   ├── components/auth/
│   │   └── CustomerAuthNav.tsx      ← Home nav: login/signup or account/logout
│   └── lib/
│       ├── auth/
│       │   ├── constants.ts         ← cookie name, JWT lifetime
│       │   ├── cookie.ts            ← cookie options
│       │   ├── jwt.ts               ← sign + verify (Node / API routes)
│       │   ├── jwt-edge.ts          ← verify only (Edge middleware, Web Crypto)
│       │   └── password.ts          ← bcrypt hash/compare
│       ├── db/mongodb.ts            ← cached Mongoose connection
│       ├── models/User.ts           ← User schema (passwordHash select: false)
│       └── validations/auth.ts      ← Zod schemas (shared FE + BE shape)
```

## Step-by-step integration (what was added)

1. **Environment**  
   Copy `.env.example` to `.env.local`. Set `MONGODB_URI` and `JWT_SECRET` (≥ 32 characters). Example: `openssl rand -base64 32`.

2. **Database**  
   Start MongoDB locally or create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster. The `User` collection is created automatically on first signup.

3. **Dependencies**  
   `mongoose`, `bcryptjs`, `jose` (signing + API verify), `@types/bcryptjs`.

4. **Validation**  
   - **Frontend**: `react-hook-form` + `zodResolver` + same Zod schemas as the API expects.  
   - **Backend**: `signupBodySchema` / `loginBodySchema` in each route via `safeParse`.

5. **Security**  
   - Passwords: never stored plain; field `passwordHash` with `select: false`.  
   - JWT: httpOnly, `sameSite: lax`, `secure` in production.  
   - Middleware verifies JWT with **Web Crypto** (`jwt-edge.ts`) so the Edge bundle does not pull problematic `jose` deflate code.

6. **Routes**  
   - Public: `/`, `/login`, `/signup`, `/pharmacy/*`, etc.  
   - Protected by `middleware.ts`: `/order`, `/track`, `/account` → redirect to `/login?from=…` if missing/invalid cookie.

7. **UI**  
   - `CustomerAuthNav` on the home page.  
   - `Toaster` from `sonner` in root layout for success/error toasts.  
   - Alerts on forms for API errors (e.g. duplicate email, invalid login).

## How to run

```bash
cd orchids-medicine-delivery-app
cp .env.example .env.local
# Edit .env.local: MONGODB_URI, JWT_SECRET

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign up** → then visit **Order** or **Track** (requires login).

Production:

```bash
npm run build
npm start
```

## API reference

| Method | Path | Body (JSON) | Response |
|--------|------|-------------|----------|
| POST | `/api/auth/signup` | `{ name, email, password, confirmPassword }` | 201/200 + `user`; sets cookie |
| POST | `/api/auth/login` | `{ email, password }` | 200 + `user`; sets cookie |
| POST | `/api/auth/logout` | — | 200; clears cookie |
| GET | `/api/auth/me` | — | `{ user: null \| { id, email, name } }` |

Errors: `400` validation (`fieldErrors`), `401` bad credentials, `409` email exists, `500` server/DB.

## Adjusting protected routes

Edit `src/middleware.ts`: change `protectedPrefixes` and `config.matcher` together so they stay aligned.

## Optional next steps

- **Social login (Google, GitHub)**  
  Add [Auth.js (NextAuth)](https://authjs.dev/) providers alongside this flow, or replace cookie JWT with Auth.js session cookies. Map OAuth email to `User` records.

- **Password reset**  
  Add `PasswordResetToken` collection (expiring token), `POST /api/auth/forgot-password` (send email via Resend/SendGrid), `POST /api/auth/reset-password` with token + new password. Do not log reset links.

- **MySQL instead of MongoDB**  
  Swap Mongoose for [Prisma](https://www.prisma.io/) + MySQL; keep the same API response shapes and Zod validation.

- **Firebase**  
  Use Firebase Auth on the client and verify ID tokens in API routes with the Firebase Admin SDK; drop local JWT cookie or use it only for your own BFF pattern.

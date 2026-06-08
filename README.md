# Santu API

API backend NestJS + Prisma pour l'application Santu (authentification OTP, gestion profil, uploads, événements et annuaire).

## État actuel du projet

Modules en place :

- `auth` : OTP téléphone (Twilio Verify) + JWT
- `users` : profil utilisateur
- `uploads` : génération d'URL pré-signées S3
- `events` : publication/listing/détail d'événements (admin pour création)
- `members` : annuaire public des membres

Base de données :

- PostgreSQL via Prisma
- modèles principaux : `User`, `Event`

## Prérequis

- Node.js 20+
- pnpm (ou npm)
- Une base PostgreSQL accessible
- Un service Twilio Verify (pour OTP)
- Un bucket S3 compatible (AWS S3 + IAM)

## Variables d'environnement (.env)

Créer un fichier `.env` à la racine de `Santu-api` avec les variables suivantes :

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"

# Auth JWT
JWT_SECRET="change-me"

# Twilio Verify (OTP SMS)
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_VERIFY_SERVICE_SID="..."

# URL API consommée par le client mobile (si nécessaire)
EXPO_PUBLIC_API_URL="http://localhost:3000"

# AWS S3 (uploads pré-signés)
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="your-bucket-name"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_PUBLIC_BASE_URL="https://your-cdn-or-bucket-public-base-url"
```

Important :

- Ne jamais versionner `.env` (déjà ignoré par `.gitignore`).
- Si des secrets ont été commités auparavant, les régénérer immédiatement.

## Installation

```bash
pnpm install
```

## Lancer le projet

```bash
# mode dev (watch)
pnpm run start:dev

# mode normal
pnpm run start

# build production
pnpm run build
pnpm run start:prod
```

## Prisma

```bash
# valider le schéma
npx prisma validate

# générer le client Prisma
npx prisma generate

# appliquer les migrations en dev
npx prisma migrate dev
```

## Documentation API

Swagger disponible après démarrage :

- [http://localhost:3000/api](http://localhost:3000/api)

## Déploiement Vercel

Le build Vercel échoue si le client Prisma n'est pas généré (`src/generated/prisma` est ignoré par Git).
Les scripts `postinstall`, `build` et `vercel-build` exécutent `prisma generate` automatiquement.

### Configuration Vercel (zero-config)

Suivre la [doc officielle NestJS sur Vercel](https://vercel.com/docs/frameworks/backend/nestjs) :

- Point d'entrée : `src/main.ts` avec `await app.listen(process.env.PORT ?? 3000)`
- Imports **relatifs** (`./app.module`) — les alias TypeScript `@/` ne sont pas résolus au runtime Vercel
- Pas de `vercel.json` requis ; le framework NestJS est détecté automatiquement
- `vercel-build` dans `package.json` pour générer Prisma Client avant le build

### Variables d'environnement (dashboard Vercel)

Configurer au minimum :

- `DATABASE_URL` — préférer une URL avec **connection pooling** (Neon, Supabase pooler, Prisma Postgres, PgBouncer `?pgbouncer=true`)
- `JWT_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
- `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_PUBLIC_BASE_URL`

### Migrations en production

Appliquer les migrations une fois (CLI locale ou CI), pas à chaque build :

```bash
DATABASE_URL="..." npx prisma migrate deploy
```

### Alternatives recommandées

Vercel fonctionne pour NestJS (serverless), mais pour une API NestJS + Prisma + PostgreSQL avec connexions longues, ces hébergeurs sont souvent plus simples :

- **Railway** / **Render** / **Fly.io** — process Node continu, moins de cold starts
- **Neon** + **Railway** — Postgres serverless + API classique

## Endpoints principaux (v0)

- `POST /auth/phone/request-otp`
- `POST /auth/phone/verify-otp`
- `GET /users/me`
- `PATCH /users/me`
- `POST /uploads/presign`
- `POST /events` (JWT + admin)
- `GET /events`
- `GET /events/:id`
- `GET /members`
- `GET /members/:id`

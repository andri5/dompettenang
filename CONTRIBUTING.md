# Contributing

## Alur singkat

1. Branch `feature/...` atau `fix/...` dari `main` / `develop`
2. Test lokal (`npm run api` / `npm run web`)
3. PR → **`develop`** (staging auto, tanpa Approve)
4. Setelah QA staging OK → **Promote to Production**, lalu **Approve** di Deploy Production

Detail: [docs/DEPLOY.md](./docs/DEPLOY.md)

## Commit

Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

## PR

- Jelaskan perubahan singkat
- Pastikan CI hijau
- Jangan commit secret / `.env`

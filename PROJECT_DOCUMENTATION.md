# MoneyFlow Project Documentation

See PRD v1.1 (user-provided). Implementation maps 1:1:
- §5 Modules → controllers + pages implemented
- §6 DB → Sequelize models with DECIMAL(15,2), indexes, FKs
- §7 Ledger → financeService with locking + idempotency
- §8 APIs → all routes mounted under /api/v1
- §11 UI → Tailwind purple SaaS theme, responsive, dark mode, collapsible sidebar
- §12 Security → bcrypt, JWT HTTP-only cookie, Helmet, CORS allowlist, rate-limit, validator

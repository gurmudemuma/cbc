# Quick Reference Card

## START HERE

```bash
cd /home/gu-da/cbc
docker-compose -f docker-compose.postgres.yml up -d
```

## PORTS

| Service | Port |
|---------|------|
| Commercial Bank | 3001 |
| National Bank | 3002 |
| ECTA | 3003 |
| Shipping Line | 3004 |
| Custom Authorities | 3005 |
| ECX | 3006 |
| Exporter Portal | 3007 |
| Frontend (dev) | 5173 |
| Frontend (prod) | 80 |
| PostgreSQL | 5432 |

## DOCKER

```bash
docker-compose -f docker-compose.postgres.yml up -d      # Start
docker-compose -f docker-compose.postgres.yml down       # Stop
docker-compose -f docker-compose.postgres.yml logs -f    # Logs
docker-compose -f docker-compose.postgres.yml ps         # Status
```

## NPM

```bash
npm install      # Install
npm run dev      # Development
npm run build    # Build
npm test         # Test
npm run lint     # Lint
```

## DATABASE

```bash
psql -U postgres -d coffee_export_db    # Connect
\dt                                      # List tables
SELECT * FROM exports LIMIT 10;         # Query
\q                                       # Exit
```

## SETUP

```bash
cp .env.template .env
cp api/commercial-bank/.env.template api/commercial-bank/.env
cp api/national-bank/.env.template api/national-bank/.env
cp api/ecta/.env.template api/ecta/.env
cp api/shipping-line/.env.template api/shipping-line/.env
cp api/custom-authorities/.env.template api/custom-authorities/.env
cp api/ecx/.env.template api/ecx/.env
cp api/exporter-portal/.env.template api/exporter-portal/.env
cp frontend/.env.template frontend/.env
```

## VERIFY

```bash
curl http://localhost:3001/health
docker-compose -f docker-compose.postgres.yml ps
```

## DOCS

- SETUP_GUIDE.md - Detailed setup
- REQUIREMENTS_CHECKLIST_POSTGRES_ONLY.md - Requirements
- READY_TO_START.md - Full overview

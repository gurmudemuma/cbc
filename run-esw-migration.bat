@echo off
echo Running ESW Integration Migration...
echo.

REM Copy migration file to container
docker cp "api/shared/database/migrations/007_add_esw_integration.sql" postgres:/tmp/007_add_esw_integration.sql

REM Run migration
docker exec postgres psql -U postgres -d coffee_export_db -f /tmp/007_add_esw_integration.sql

echo.
echo Verifying migration...
echo.

REM Check tables created
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'esw%%' OR table_name = 'export_certificates') ORDER BY table_name;"

echo.
echo Checking ESW agencies seeded...
docker exec postgres psql -U postgres -d coffee_export_db -c "SELECT COUNT(*) as agency_count FROM esw_agencies;"

echo.
echo Migration complete!
pause

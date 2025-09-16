@echo off
echo Applying database migrations...

set PGPASSWORD=prompot123^^
set PGUSER=postgres
set PGHOST=db.tlytjitkokavfhwzedml.supabase.co
set PGDATABASE=postgres

echo Applying admin_notifications table...
psql -f supabase/migrations/013_admin_notifications_table.sql

echo Applying inquiries table...
psql -f supabase/migrations/014_inquiries_table.sql

echo Migrations completed!
pause

-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function: generate monthly rent invoices for active tenants whose payment_day == today
CREATE OR REPLACE FUNCTION public.generate_monthly_rent_invoices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
  rec record;
  cycle date := date_trunc('month', current_date)::date;
  due date;
BEGIN
  FOR rec IN
    SELECT t.id, t.owner_id, t.branch_id, t.monthly_rent, t.payment_day, t.name
    FROM public.tenants t
    WHERE t.status = 'active'
      AND t.monthly_rent IS NOT NULL
      AND t.monthly_rent > 0
      AND COALESCE(t.payment_day, 1) = EXTRACT(day FROM current_date)::int
  LOOP
    -- skip if already issued for this cycle
    IF EXISTS (
      SELECT 1 FROM public.invoices
      WHERE tenant_id = rec.id
        AND cycle_month = cycle
        AND kind IN ('monthly', 'first_rent')
    ) THEN
      CONTINUE;
    END IF;

    due := date_trunc('month', current_date)::date
           + (LEAST(GREATEST(COALESCE(rec.payment_day, 1), 1), 28) - 1) * INTERVAL '1 day';

    INSERT INTO public.invoices (
      owner_id, branch_id, tenant_id, amount, due_date,
      kind, status, memo, cycle_month
    ) VALUES (
      rec.owner_id, rec.branch_id, rec.id, rec.monthly_rent, due,
      'monthly', 'unpaid',
      to_char(current_date, 'YYYY-MM') || ' 월 이용료', cycle
    );

    INSERT INTO public.notifications (
      recipient_id, branch_id, audience, category, title, body, link
    ) VALUES (
      rec.owner_id, rec.branch_id, 'owner', 'invoice',
      rec.name || ' 월 이용료 청구서 발행',
      to_char(due, 'YYYY-MM-DD') || ' 납부 예정 · ' || rec.monthly_rent || '원',
      '/tenants/' || rec.id::text
    );

    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- Schedule: every day at 00:05 UTC, run the generator
DO $$
BEGIN
  PERFORM cron.unschedule('generate-monthly-rent-invoices');
EXCEPTION WHEN OTHERS THEN
  -- ignore if not scheduled yet
  NULL;
END $$;

SELECT cron.schedule(
  'generate-monthly-rent-invoices',
  '5 0 * * *',
  $$ SELECT public.generate_monthly_rent_invoices(); $$
);

-- 1. applications 보강
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS deposit_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_rent_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

-- 2. tenants 보강
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS movein_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS moveout_week_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS moveout_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS extension_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS moveout_approved_at timestamptz;

-- 3. 트리거: 청구서가 paid로 바뀌면 신청서/입실자 단계 자동 진행
CREATE OR REPLACE FUNCTION public.handle_invoice_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_rec record;
  tenant_rec record;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    NEW.paid_at := COALESCE(NEW.paid_at, now());

    -- 보증금 입금 확인 → tenant.deposit_paid_at 자동 기록
    IF NEW.kind = 'deposit' AND NEW.tenant_id IS NOT NULL THEN
      UPDATE public.tenants
        SET deposit_paid_at = COALESCE(deposit_paid_at, now())
      WHERE id = NEW.tenant_id;

      INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
      VALUES (NEW.owner_id, NEW.branch_id, 'owner', 'deposit_paid',
              '보증금 입금 확인', '보증금이 입금 확인되었습니다.',
              '/tenants/' || NEW.tenant_id::text);
    END IF;

    -- 보증금 + 첫월세 모두 paid이면 입실 확정
    IF NEW.kind IN ('deposit', 'first_rent') AND NEW.tenant_id IS NOT NULL THEN
      SELECT t.* INTO tenant_rec FROM public.tenants t WHERE t.id = NEW.tenant_id;

      IF tenant_rec.id IS NOT NULL AND tenant_rec.movein_confirmed_at IS NULL THEN
        -- 보증금 paid 여부
        IF (
          SELECT COUNT(*) = 0 FROM public.invoices
          WHERE tenant_id = NEW.tenant_id
            AND kind IN ('deposit', 'first_rent')
            AND status <> 'paid'
            AND id <> NEW.id
        ) THEN
          UPDATE public.tenants
            SET movein_confirmed_at = now(), status = 'active'
          WHERE id = NEW.tenant_id;

          IF tenant_rec.room_id IS NOT NULL THEN
            UPDATE public.rooms SET status = 'occupied' WHERE id = tenant_rec.room_id;
          END IF;

          INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
          VALUES (tenant_rec.owner_id, tenant_rec.branch_id, 'owner', 'movein_confirmed',
                  tenant_rec.name || ' 입실 확정', '보증금·첫월세 입금이 모두 확인되었습니다.',
                  '/tenants/' || tenant_rec.id::text);

          IF tenant_rec.user_id IS NOT NULL THEN
            INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
            VALUES (tenant_rec.user_id, tenant_rec.branch_id, 'tenant', 'movein_confirmed',
                    '입실 확정 안내', '입실이 확정되었습니다. 환영합니다!', null);
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_paid ON public.invoices;
CREATE TRIGGER trg_invoice_paid
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_invoice_paid();

-- 4. 트리거: 검수 완료 → 호실 cleaning, 청소 완료 → 호실 vacant
CREATE OR REPLACE FUNCTION public.handle_inspection_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
    UPDATE public.rooms SET status = 'cleaning' WHERE id = NEW.room_id AND status <> 'occupied';

    INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
    VALUES (NEW.owner_id, NEW.branch_id, 'owner', 'inspection_completed',
            '퇴실 검수 완료', '검수가 완료되었습니다. 보증금 정산을 진행해 주세요.',
            CASE WHEN NEW.tenant_id IS NOT NULL THEN '/tenants/' || NEW.tenant_id::text ELSE null END);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inspection_completed ON public.inspections;
CREATE TRIGGER trg_inspection_completed
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.handle_inspection_completed();

CREATE OR REPLACE FUNCTION public.handle_cleaning_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
    UPDATE public.rooms SET status = 'vacant' WHERE id = NEW.room_id;

    INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
    VALUES (NEW.owner_id, NEW.branch_id, 'owner', 'cleaning_completed',
            '청소 완료', '청소가 완료되어 호실이 공실로 전환되었습니다.', '/rooms');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleaning_completed ON public.cleanings;
CREATE TRIGGER trg_cleaning_completed
  BEFORE UPDATE ON public.cleanings
  FOR EACH ROW EXECUTE FUNCTION public.handle_cleaning_completed();

-- 5. 퇴실 1주전 자동 알림 함수 (cron으로 호출)
CREATE OR REPLACE FUNCTION public.notify_moveout_week()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer := 0;
  rec record;
BEGIN
  FOR rec IN
    SELECT t.id, t.owner_id, t.branch_id, t.user_id, t.name, t.move_out_date
    FROM public.tenants t
    WHERE t.status = 'active'
      AND t.move_out_date IS NOT NULL
      AND t.move_out_date - current_date BETWEEN 0 AND 7
      AND t.moveout_week_notified_at IS NULL
  LOOP
    INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
    VALUES (rec.owner_id, rec.branch_id, 'owner', 'moveout_week',
            rec.name || ' 퇴실 1주일 전', '담당 배정 및 퇴실 검수 일정을 잡아주세요.',
            '/tenants/' || rec.id::text);

    IF rec.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
      VALUES (rec.user_id, rec.branch_id, 'tenant', 'moveout_week',
              '퇴실 1주일 전 안내', '퇴실 예정일이 일주일 앞으로 다가왔습니다.', null);
    END IF;

    UPDATE public.tenants SET moveout_week_notified_at = now() WHERE id = rec.id;
    cnt := cnt + 1;
  END LOOP;
  RETURN cnt;
END;
$$;

-- 6. 미납 안내 (납부 기한 다음날 자동 overdue 전환 + 알림)
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer := 0;
  rec record;
BEGIN
  FOR rec IN
    SELECT i.id, i.owner_id, i.branch_id, i.tenant_id, i.amount, t.name, t.user_id
    FROM public.invoices i
    LEFT JOIN public.tenants t ON t.id = i.tenant_id
    WHERE i.status = 'unpaid' AND i.due_date < current_date
  LOOP
    UPDATE public.invoices SET status = 'overdue' WHERE id = rec.id;

    INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
    VALUES (rec.owner_id, rec.branch_id, 'owner', 'invoice_overdue',
            COALESCE(rec.name, '입실자') || ' 미납 발생', rec.amount || '원 미납입니다.',
            CASE WHEN rec.tenant_id IS NOT NULL THEN '/tenants/' || rec.tenant_id::text ELSE '/invoices' END);

    IF rec.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (recipient_id, branch_id, audience, category, title, body, link)
      VALUES (rec.user_id, rec.branch_id, 'tenant', 'invoice_overdue',
              '미납 안내', rec.amount || '원이 미납 상태입니다. 빠른 입금 부탁드립니다.', null);
    END IF;

    cnt := cnt + 1;
  END LOOP;
  RETURN cnt;
END;
$$;

-- 7. 매일 실행할 통합 cron job (일별)
DO $$
BEGIN
  PERFORM cron.unschedule('daily-process-tasks');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'daily-process-tasks',
  '0 1 * * *',
  $$
    SELECT public.notify_moveout_week();
    SELECT public.mark_overdue_invoices();
  $$
);
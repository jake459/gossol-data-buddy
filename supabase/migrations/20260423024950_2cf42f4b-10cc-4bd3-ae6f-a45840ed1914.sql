
-- ============ ENUM 확장 ============
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tenant';

-- 새 enum들
DO $$ BEGIN
  CREATE TYPE room_category AS ENUM ('mini', 'shower', 'studio');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE window_type AS ENUM ('external', 'internal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE room_size_type AS ENUM ('standard', 'wide', 'duplex');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE inspection_status AS ENUM ('assigned', 'requested', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE cleaning_status AS ENUM ('assigned', 'requested', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE notification_audience AS ENUM ('owner', 'staff', 'tenant');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_kind AS ENUM ('deposit', 'first_rent', 'monthly', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ rooms 확장 ============
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS room_category room_category,
  ADD COLUMN IF NOT EXISTS window_type window_type,
  ADD COLUMN IF NOT EXISTS size_type room_size_type DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS extra_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_name text;

-- ============ tenants 확장 ============
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS contract_start date,
  ADD COLUMN IF NOT EXISTS contract_end date,
  ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS deposit_returned_at timestamptz,
  ADD COLUMN IF NOT EXISTS extension_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS moveout_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- ============ applications 확장 ============
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS room_id uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS agreed_at timestamptz;

-- ============ invoices 확장 ============
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS kind invoice_kind NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS cycle_month date;

-- ============ branch_members ============
CREATE TABLE IF NOT EXISTS public.branch_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(branch_id, user_id)
);
ALTER TABLE public.branch_members ENABLE ROW LEVEL SECURITY;

-- helper: 지점 소속 여부
CREATE OR REPLACE FUNCTION public.is_branch_member(_branch_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.branches WHERE id = _branch_id AND owner_id = _user_id
    UNION ALL
    SELECT 1 FROM public.branch_members WHERE branch_id = _branch_id AND user_id = _user_id
  )
$$;

CREATE POLICY "branch_members_owner_manage" ON public.branch_members
  FOR ALL USING (
    EXISTS(SELECT 1 FROM public.branches b WHERE b.id = branch_id AND b.owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS(SELECT 1 FROM public.branches b WHERE b.id = branch_id AND b.owner_id = auth.uid())
  );

CREATE POLICY "branch_members_self_read" ON public.branch_members
  FOR SELECT USING (user_id = auth.uid());

-- ============ staff_invites ============
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_invites_owner_all" ON public.staff_invites
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ tenant_invites ============
CREATE TABLE IF NOT EXISTS public.tenant_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_invites_owner_all" ON public.tenant_invites
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ inspections (퇴실검수) ============
CREATE TABLE IF NOT EXISTS public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  room_id uuid NOT NULL,
  tenant_id uuid,
  assignee_id uuid,
  status inspection_status NOT NULL DEFAULT 'assigned',
  scheduled_date date,
  requested_at timestamptz,
  completed_at timestamptz,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspections_branch_access" ON public.inspections
  FOR ALL USING (public.is_branch_member(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_member(branch_id, auth.uid()));

-- ============ cleanings (청소) ============
CREATE TABLE IF NOT EXISTS public.cleanings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  room_id uuid NOT NULL,
  assignee_id uuid,
  status cleaning_status NOT NULL DEFAULT 'assigned',
  scheduled_date date,
  requested_at timestamptz,
  completed_at timestamptz,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cleanings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cleanings_branch_access" ON public.cleanings
  FOR ALL USING (public.is_branch_member(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_member(branch_id, auth.uid()));

-- ============ notifications ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid,
  recipient_id uuid NOT NULL,
  audience notification_audience NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_recipient_read" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "notifications_recipient_update" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "notifications_branch_owner_insert" ON public.notifications
  FOR INSERT WITH CHECK (
    branch_id IS NULL OR public.is_branch_member(branch_id, auth.uid())
  );

-- ============ updated_at 트리거 ============
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['branch_members','staff_invites','tenant_invites','inspections','cleanings'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

-- ============ 기존 RLS 보강: 스탭도 자기 지점 데이터 접근 ============
-- branches: 스탭도 select 가능
DROP POLICY IF EXISTS "branches_member_read" ON public.branches;
CREATE POLICY "branches_member_read" ON public.branches
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS(SELECT 1 FROM public.branch_members m WHERE m.branch_id = branches.id AND m.user_id = auth.uid())
  );

-- rooms / tenants / invoices / events / applications / room_types: 스탭 접근
DROP POLICY IF EXISTS "rooms_member_access" ON public.rooms;
CREATE POLICY "rooms_member_access" ON public.rooms
  FOR ALL USING (public.is_branch_member(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_member(branch_id, auth.uid()));

DROP POLICY IF EXISTS "tenants_member_access" ON public.tenants;
CREATE POLICY "tenants_member_access" ON public.tenants
  FOR ALL USING (
    public.is_branch_member(branch_id, auth.uid()) OR user_id = auth.uid()
  ) WITH CHECK (public.is_branch_member(branch_id, auth.uid()));

DROP POLICY IF EXISTS "invoices_member_access" ON public.invoices;
CREATE POLICY "invoices_member_access" ON public.invoices
  FOR ALL USING (public.is_branch_member(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_member(branch_id, auth.uid()));

DROP POLICY IF EXISTS "events_member_access" ON public.events;
CREATE POLICY "events_member_access" ON public.events
  FOR ALL USING (public.is_branch_member(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_member(branch_id, auth.uid()));

DROP POLICY IF EXISTS "applications_member_access" ON public.applications;
CREATE POLICY "applications_member_access" ON public.applications
  FOR ALL USING (public.is_branch_member(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_member(branch_id, auth.uid()));

DROP POLICY IF EXISTS "room_types_member_access" ON public.room_types;
CREATE POLICY "room_types_member_access" ON public.room_types
  FOR ALL USING (public.is_branch_member(branch_id, auth.uid()))
  WITH CHECK (public.is_branch_member(branch_id, auth.uid()));

-- 입실자가 자기 청구서/일정 보기
DROP POLICY IF EXISTS "invoices_tenant_self_read" ON public.invoices;
CREATE POLICY "invoices_tenant_self_read" ON public.invoices
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.tenants t WHERE t.id = invoices.tenant_id AND t.user_id = auth.uid())
  );

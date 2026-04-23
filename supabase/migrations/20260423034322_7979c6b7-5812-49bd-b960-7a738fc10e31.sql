-- Fix infinite recursion between branches <-> branch_members policies
-- Root cause: branches_member_read references branch_members,
-- and branch_members_owner_manage references branches → recursive RLS evaluation.

-- 1) SECURITY DEFINER helper: is current user the owner of a given branch?
CREATE OR REPLACE FUNCTION public.is_branch_owner(_branch_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.branches WHERE id = _branch_id AND owner_id = _user_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_branch_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_branch_owner(uuid, uuid) TO authenticated;

-- 2) SECURITY DEFINER helper: is current user a direct member row for a branch?
CREATE OR REPLACE FUNCTION public.is_branch_member_direct(_branch_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.branch_members
    WHERE branch_id = _branch_id AND user_id = _user_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_branch_member_direct(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_branch_member_direct(uuid, uuid) TO authenticated;

-- 3) Rebuild branches policies WITHOUT cross-table sub-selects
DROP POLICY IF EXISTS branches_member_read ON public.branches;
DROP POLICY IF EXISTS branches_owner_all ON public.branches;

CREATE POLICY branches_owner_all ON public.branches
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY branches_member_read ON public.branches
FOR SELECT
USING (
  auth.uid() = owner_id
  OR public.is_branch_member_direct(id, auth.uid())
);

-- 4) Rebuild branch_members policies using the security-definer owner check
DROP POLICY IF EXISTS branch_members_owner_manage ON public.branch_members;
DROP POLICY IF EXISTS branch_members_self_read ON public.branch_members;

CREATE POLICY branch_members_owner_manage ON public.branch_members
FOR ALL
USING (public.is_branch_owner(branch_id, auth.uid()))
WITH CHECK (public.is_branch_owner(branch_id, auth.uid()));

CREATE POLICY branch_members_self_read ON public.branch_members
FOR SELECT
USING (user_id = auth.uid());
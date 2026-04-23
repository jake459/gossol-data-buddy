DO $$
DECLARE
  old_owner uuid := '5d68b78b-5865-4ece-b5ff-b409218a6bc1';
  new_owner uuid := 'c23a8325-210c-4b9f-8e32-bce44b591e34';
BEGIN
  UPDATE public.branches SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.rooms SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.room_types SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.tenants SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.invoices SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.applications SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.events SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.cleanings SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.inspections SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.branch_settings SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.staff_invites SET owner_id = new_owner WHERE owner_id = old_owner;
  UPDATE public.tenant_invites SET owner_id = new_owner WHERE owner_id = old_owner;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_owner, 'owner')
  ON CONFLICT DO NOTHING;
END $$;
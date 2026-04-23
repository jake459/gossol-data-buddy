
-- Reassign all ownership to the most recent auth user (the one currently logged in)
-- and ensure branch membership exists
DO $$
DECLARE
  current_uid uuid;
  current_email text;
  current_name text;
  branch_uuid uuid;
BEGIN
  -- Get the most recently active auth user
  SELECT id, email INTO current_uid, current_email
  FROM auth.users
  ORDER BY COALESCE(last_sign_in_at, created_at) DESC
  LIMIT 1;

  IF current_uid IS NULL THEN
    RAISE NOTICE 'No auth users found';
    RETURN;
  END IF;

  current_name := COALESCE(split_part(current_email, '@', 1), '유재석');

  -- Reassign all data ownership
  UPDATE branches SET owner_id = current_uid;
  UPDATE branch_settings SET owner_id = current_uid;
  UPDATE rooms SET owner_id = current_uid;
  UPDATE room_types SET owner_id = current_uid;
  UPDATE tenants SET owner_id = current_uid;
  UPDATE invoices SET owner_id = current_uid;
  UPDATE applications SET owner_id = current_uid;
  UPDATE events SET owner_id = current_uid;
  UPDATE cleanings SET owner_id = current_uid;
  UPDATE inspections SET owner_id = current_uid;
  UPDATE staff_invites SET owner_id = current_uid;
  UPDATE tenant_invites SET owner_id = current_uid;

  -- Ensure profile exists
  INSERT INTO profiles (user_id, display_name)
  VALUES (current_uid, '유재석')
  ON CONFLICT DO NOTHING;
  
  UPDATE profiles SET display_name = '유재석' WHERE user_id = current_uid;

  -- Ensure user_role as owner
  INSERT INTO user_roles (user_id, role)
  VALUES (current_uid, 'owner')
  ON CONFLICT DO NOTHING;

  -- Ensure branch_members entries exist for all branches
  FOR branch_uuid IN SELECT id FROM branches LOOP
    INSERT INTO branch_members (branch_id, user_id, role)
    VALUES (branch_uuid, current_uid, 'owner')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

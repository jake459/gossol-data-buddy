
-- Replace existing room_types with 3 standardized templates: 미니룸/샤워룸/원룸형
DELETE FROM public.rooms WHERE room_type_id IN (SELECT id FROM public.room_types WHERE branch_id='e743e24c-7f3f-4b0f-9f8d-0ba50348ff1d') AND false;
UPDATE public.rooms SET room_type_id=NULL WHERE branch_id='e743e24c-7f3f-4b0f-9f8d-0ba50348ff1d';
DELETE FROM public.room_types WHERE branch_id='e743e24c-7f3f-4b0f-9f8d-0ba50348ff1d';

INSERT INTO public.room_types (branch_id, owner_id, name, monthly_rent, deposit, options) VALUES
('e743e24c-7f3f-4b0f-9f8d-0ba50348ff1d','c23a8325-210c-4b9f-8e32-bce44b591e34','미니룸',380000,100000,'{"cleaning_fee":30000,"maintenance_fee":40000,"description":"공용 화장실/샤워실, 컴팩트한 1인실","amenities":["bed","desk","wardrobe","aircon","wifi"]}'::jsonb),
('e743e24c-7f3f-4b0f-9f8d-0ba50348ff1d','c23a8325-210c-4b9f-8e32-bce44b591e34','샤워룸',460000,100000,'{"cleaning_fee":30000,"maintenance_fee":50000,"description":"개인 샤워부스 포함","amenities":["bed","desk","wardrobe","shower","aircon","wifi","fridge"]}'::jsonb),
('e743e24c-7f3f-4b0f-9f8d-0ba50348ff1d','c23a8325-210c-4b9f-8e32-bce44b591e34','원룸형',590000,200000,'{"cleaning_fee":40000,"maintenance_fee":60000,"description":"개인 화장실/샤워실 포함, 넓은 1인실","amenities":["bed","desk","wardrobe","bathroom","shower","aircon","wifi","fridge","tv"]}'::jsonb);

-- 기존 호실에 다양한 대분류/창문/크기 예시값 채우기 (필터 시 집계가 보이도록)
UPDATE public.rooms SET
  room_category = 'mini'::room_category,
  window_type   = 'internal'::window_type,
  size_type     = 'standard'::room_size_type,
  auto_name     = '미니룸 · 내창'
WHERE room_number IN ('202','301','401') AND room_category IS NULL;

UPDATE public.rooms SET
  room_category = 'shower'::room_category,
  window_type   = 'external'::window_type,
  size_type     = 'standard'::room_size_type,
  auto_name     = '샤워룸 · 외창'
WHERE room_number IN ('203','302','402') AND room_category IS NULL;

UPDATE public.rooms SET
  room_category = 'studio'::room_category,
  window_type   = 'external'::window_type,
  size_type     = 'wide'::room_size_type,
  auto_name     = '원룸형 · 외창 · 넓은방'
WHERE room_number IN ('204','303') AND room_category IS NULL;

UPDATE public.rooms SET
  room_category = 'studio'::room_category,
  window_type   = 'external'::window_type,
  size_type     = 'duplex'::room_size_type,
  auto_name     = '원룸형 · 외창 · 복층형'
WHERE room_number IN ('205','304','305') AND room_category IS NULL;

-- 기타 잔여 호실은 기본 미니룸으로
UPDATE public.rooms SET
  room_category = 'mini'::room_category,
  window_type   = 'internal'::window_type,
  size_type     = 'standard'::room_size_type,
  auto_name     = '미니룸 · 내창'
WHERE room_category IS NULL;
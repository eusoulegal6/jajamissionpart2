UPDATE public.group_classes SET sort_priority = CASE id
  WHEN 'ce434518-1d26-4b55-b29f-1e4c6a5097f7' THEN 1  -- Manhã norte-americana (first)
  WHEN '30e12de1-ea0e-418e-a94d-579d365acc97' THEN 2  -- Manhã iniciante (second)
  ELSE sort_priority
END
WHERE id IN ('ce434518-1d26-4b55-b29f-1e4c6a5097f7', '30e12de1-ea0e-418e-a94d-579d365acc97');
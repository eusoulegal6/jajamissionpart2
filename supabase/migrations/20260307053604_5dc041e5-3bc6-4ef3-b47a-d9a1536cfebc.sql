UPDATE public.group_classes SET sort_priority = CASE id
  WHEN '30e12de1-ea0e-418e-a94d-579d365acc97' THEN 1  -- Manhã iniciante
  WHEN 'ce434518-1d26-4b55-b29f-1e4c6a5097f7' THEN 2  -- Manhã norte-americana
  WHEN 'd9c50079-ce69-48fb-a50d-be89668047ca' THEN 3  -- Tardes americanas
  WHEN '445c2930-77ee-41a7-b5d8-e1f4a24ab6bc' THEN 4  -- Tarde iniciante
  WHEN 'b257da15-08ac-4f44-8bd2-9d7313c526eb' THEN 5  -- Conversação Avançada
  WHEN '7a3250de-129d-4433-bad2-a66ba3548223' THEN 6  -- Conversação Intermediária
  WHEN 'a632b047-a867-4c9e-91e9-73f830b0ecee' THEN 7  -- Iniciando sua jornada
  ELSE sort_priority
END;
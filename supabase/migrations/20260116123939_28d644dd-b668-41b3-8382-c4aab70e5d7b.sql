-- Create image optimizations tracking table
create table if not exists public.image_optimizations (
  id uuid primary key default gen_random_uuid(),
  original_url text not null unique,
  optimized_url text,
  status text not null default 'pending', -- pending, processing, done, error, skipped
  source_type text not null, -- database, supabase_storage, external, static
  source_table text,
  source_record_id text,
  file_size_before integer,
  file_size_after integer,
  compression_ratio numeric,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for efficient querying
create index if not exists idx_image_optimizations_status on public.image_optimizations(status);
create index if not exists idx_image_optimizations_source on public.image_optimizations(source_type, source_table);

-- Create trigger to update updated_at
create or replace function public.update_image_optimizations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_image_optimizations_updated_at on public.image_optimizations;
create trigger update_image_optimizations_updated_at
  before update on public.image_optimizations
  for each row
  execute function public.update_image_optimizations_updated_at();
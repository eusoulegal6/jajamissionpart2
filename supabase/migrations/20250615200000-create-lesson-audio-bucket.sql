
-- Create lesson_audio bucket if it doesn't exist
insert into storage.buckets
  (id, name, public)
values
  ('lesson_audio', 'lesson_audio', true)
on conflict (id) do nothing;

-- Create policies for lesson_audio bucket to allow public read and authenticated modifications

-- Policy for public read access
create policy "Public read access for lesson_audio"
on storage.objects for select
to public
using ( bucket_id = 'lesson_audio' );

-- Policy for authenticated uploads
create policy "Authenticated uploads for lesson_audio"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'lesson_audio' );

-- Policy for authenticated updates
create policy "Authenticated updates for lesson_audio"
on storage.objects for update
to authenticated
with check ( bucket_id = 'lesson_audio' );

-- Policy for authenticated deletes
create policy "Authenticated deletes from lesson_audio"
on storage.objects for delete
to authenticated
using ( bucket_id = 'lesson_audio' );


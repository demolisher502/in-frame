-- In Frame portfolio: complete database setup for a NEW, EMPTY Supabase project.
-- Paste the whole file into the SQL editor and run it once. See supabase/README.md for the steps around it.
-- It creates the tables, security rules and image bucket, then loads the starting content.

-- =====================================================================
-- 1. Tables and security
-- =====================================================================

-- Who may edit. Rows are added by the project owner only (no client-side write policy).
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "admins can see their own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  meta text not null default '' check (char_length(meta) <= 200),
  year int check (year between 1990 and 2100),
  type text not null default 'video' check (type in ('video','foto','retrato')),
  link text check (link is null or link ~ '^https://'),
  cover_url text not null,
  thumb_url text not null,
  featured boolean not null default false,
  in_hero boolean not null default false,
  published boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  -- optional English texts; the site falls back to title/meta when they are empty
  title_en text check (title_en is null or char_length(title_en) between 1 and 120),
  meta_en text check (meta_en is null or char_length(meta_en) <= 200)
);
create index projects_position_idx on public.projects (position);
alter table public.projects enable row level security;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  position int not null default 0,
  created_at timestamptz not null default now(),
  -- optional logo shown in the marquee instead of the name (uploaded to media/logos/)
  logo_url text check (logo_url is null or logo_url ~ '^https://')
);
create index clients_position_idx on public.clients (position);
alter table public.clients enable row level security;

-- Gallery items (extra photos and video links) for each project.
create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('photo','video')),
  url text not null check (url ~ '^https://'),
  thumb_url text check (thumb_url is null or thumb_url ~ '^https://'),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index project_media_project_idx on public.project_media (project_id, position);
alter table public.project_media enable row level security;

-- Public site: read published projects, their galleries, and all clients.
create policy "public reads published projects" on public.projects
  for select to anon, authenticated
  using (published or (select auth.uid()) in (select user_id from public.admins));
create policy "public reads clients" on public.clients
  for select to anon, authenticated using (true);
-- visible exactly when its project is visible (projects' own rules apply inside the subquery)
create policy "public reads media of visible projects" on public.project_media
  for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id));

-- Writes: admins only.
create policy "admins insert projects" on public.projects for insert to authenticated
  with check ((select auth.uid()) in (select user_id from public.admins));
create policy "admins update projects" on public.projects for update to authenticated
  using ((select auth.uid()) in (select user_id from public.admins))
  with check ((select auth.uid()) in (select user_id from public.admins));
create policy "admins delete projects" on public.projects for delete to authenticated
  using ((select auth.uid()) in (select user_id from public.admins));

create policy "admins insert clients" on public.clients for insert to authenticated
  with check ((select auth.uid()) in (select user_id from public.admins));
create policy "admins update clients" on public.clients for update to authenticated
  using ((select auth.uid()) in (select user_id from public.admins))
  with check ((select auth.uid()) in (select user_id from public.admins));
create policy "admins delete clients" on public.clients for delete to authenticated
  using ((select auth.uid()) in (select user_id from public.admins));

create policy "admins insert media" on public.project_media for insert to authenticated
  with check ((select auth.uid()) in (select user_id from public.admins));
create policy "admins update media" on public.project_media for update to authenticated
  using ((select auth.uid()) in (select user_id from public.admins))
  with check ((select auth.uid()) in (select user_id from public.admins));
create policy "admins delete media" on public.project_media for delete to authenticated
  using ((select auth.uid()) in (select user_id from public.admins));

grant select on public.projects, public.clients, public.project_media to anon, authenticated;
grant insert, update, delete on public.projects, public.clients, public.project_media to authenticated;
grant select on public.admins to authenticated;

-- =====================================================================
-- 2. Image storage: public bucket, images only, 8 MB max; only admins can write.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/webp','image/jpeg','image/png']);

create policy "admins upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select auth.uid()) in (select user_id from public.admins));
create policy "admins update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select auth.uid()) in (select user_id from public.admins));
create policy "admins delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select auth.uid()) in (select user_id from public.admins));
create policy "admins list media" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select auth.uid()) in (select user_id from public.admins));

-- =====================================================================
-- 3. Starting content (covers point at the images shipped in /assets/work)
-- =====================================================================

insert into public.projects (title, meta, year, type, link, cover_url, thumb_url, featured, in_hero, published, position) values
  ('Wendy’s — Lanzamiento Tenders', 'Cobertura de evento · con Hoenn', 2026, 'video', 'https://www.instagram.com/reel/DZqhDx_pwn-/', 'assets/work/DZqhDx_pwn-.jpg', 'assets/work/thumb/DZqhDx_pwn-.webp', true, true, true, 10),
  ('Pizza Hut', 'Sesión de fotos · con Hoenn', 2025, 'foto', 'https://www.instagram.com/p/DPrdmBtgVTj/', 'assets/work/DPrdmBtgVTj.webp', 'assets/work/thumb/DPrdmBtgVTj.webp', false, true, true, 20),
  ('By Oriana Lucas', 'Fashion film · Colección nupcial', 2025, 'video', 'https://www.instagram.com/reel/DN6wpaIkVMU/', 'assets/work/DN6wpaIkVMU.jpg', 'assets/work/thumb/DN6wpaIkVMU.webp', false, true, true, 30),
  ('Häagen-Dazs', 'Cobertura Día de los Padres · con Hoenn', 2025, 'video', 'https://www.instagram.com/reel/DM-ivGzpY6K/', 'assets/work/DM-ivGzpY6K.jpg', 'assets/work/thumb/DM-ivGzpY6K.webp', false, true, true, 40),
  ('Banco LAFISE × Viamar', 'Feria de Vehículos · con Hoenn', 2025, 'video', 'https://www.instagram.com/reel/DNTwqHEvI5Z/', 'assets/work/DNTwqHEvI5Z.jpg', 'assets/work/thumb/DNTwqHEvI5Z.webp', false, false, true, 50),
  ('Bodas A La Moda — Portada no. 13', 'Video y fotos · Oriana Lucas · Cayo Levantado', 2024, 'video', 'https://www.instagram.com/reel/C8iAuPMP0PC/', 'assets/work/C8iAuPMP0PC.jpg', 'assets/work/thumb/C8iAuPMP0PC.webp', true, true, true, 60),
  ('Manzanas Washington × Julio Rodríguez', 'Documental · Loma de Cabrera · con Hoenn', 2026, 'video', 'https://www.instagram.com/reel/DY-rGuBJqco/', 'assets/work/DY-rGuBJqco.jpg', 'assets/work/thumb/DY-rGuBJqco.webp', false, true, true, 70),
  ('Tradiciones Reinventadas', 'Intro de serie · Chef Giancarlo Bonarelli', 2025, 'video', 'https://www.instagram.com/reel/DNZZu9HMVtt/', 'assets/work/DNZZu9HMVtt.jpg', 'assets/work/thumb/DNZZu9HMVtt.webp', false, true, true, 80),
  ('¡Qué Chévere es Saber!', 'Sesión de fotos', 2025, 'foto', 'https://www.instagram.com/p/DPUr9v3Cprw/', 'assets/work/DPUr9v3Cprw.jpg', 'assets/work/thumb/DPUr9v3Cprw.webp', false, false, true, 90),
  ('Fotografía gastronómica', 'In Frame', 2026, 'foto', 'https://www.instagram.com/p/DZ749TVFhTV/', 'assets/work/DZ749TVFhTV.webp', 'assets/work/thumb/DZ749TVFhTV.webp', false, true, true, 100),
  ('Food film', 'In Frame', 2025, 'video', 'https://www.instagram.com/reel/DSS7t2liWs1/', 'assets/work/DSS7t2liWs1.jpg', 'assets/work/thumb/DSS7t2liWs1.webp', false, false, true, 110),
  ('Spot de producto', 'Con Miguel R. Corniel y Hoenn', 2025, 'video', 'https://www.instagram.com/reel/DE5sq4mPWbB/', 'assets/work/DE5sq4mPWbB.jpg', 'assets/work/thumb/DE5sq4mPWbB.webp', false, false, true, 120),
  ('Retrato editorial', 'Modelo @kakeiyang', 2026, 'retrato', 'https://www.instagram.com/p/DcPAuYWiaV_/', 'assets/work/DcPAuYWiaV_.webp', 'assets/work/thumb/DcPAuYWiaV_.webp', false, true, true, 130),
  ('Retrato editorial', 'Modelo @evivilla24', 2026, 'retrato', 'https://www.instagram.com/p/DaMSg-DjEdr/', 'assets/work/DaMSg-DjEdr.webp', 'assets/work/thumb/DaMSg-DjEdr.webp', false, true, true, 140),
  ('Retrato en estudio', 'Modelo @nicolecueli', 2026, 'retrato', 'https://www.instagram.com/p/DUb9KJmCTru/', 'assets/work/DUb9KJmCTru.webp', 'assets/work/thumb/DUb9KJmCTru.webp', false, true, true, 150),
  ('Retrato en estudio', 'Modelo @nataliasanchezlegal', 2026, 'retrato', 'https://www.instagram.com/p/DVMCMUpkVqD/', 'assets/work/DVMCMUpkVqD.webp', 'assets/work/thumb/DVMCMUpkVqD.webp', false, false, true, 160),
  ('Retrato editorial', 'Modelo @ricicorniel', 2026, 'retrato', 'https://www.instagram.com/p/DUtVNPqCXqB/', 'assets/work/DUtVNPqCXqB.webp', 'assets/work/thumb/DUtVNPqCXqB.webp', false, false, true, 170),
  ('Retrato editorial', 'Modelo @jenvargas_', 2026, 'retrato', 'https://www.instagram.com/p/DUoHASsiTr6/', 'assets/work/DUoHASsiTr6.webp', 'assets/work/thumb/DUoHASsiTr6.webp', false, false, true, 180),
  ('Retrato en estudio', 'Modelo @rdriguez_arias', 2026, 'retrato', 'https://www.instagram.com/p/DUgnbtbCfd5/', 'assets/work/DUgnbtbCfd5.webp', 'assets/work/thumb/DUgnbtbCfd5.webp', false, true, true, 190),
  ('Retrato en estudio', 'Modelo @bessyrodz', 2026, 'retrato', 'https://www.instagram.com/p/DT_W-IUkV3Z/', 'assets/work/DT_W-IUkV3Z.webp', 'assets/work/thumb/DT_W-IUkV3Z.webp', false, false, true, 200);

insert into public.clients (name, position) values
  ('Wendy’s', 10),
  ('Pizza Hut', 20),
  ('Häagen-Dazs', 30),
  ('Banco LAFISE', 40),
  ('Viamar', 50),
  ('Manzanas Washington', 60),
  ('Bodas A La Moda', 70),
  ('By Oriana Lucas', 80),
  ('Hoenn', 90);

-- English texts for the starting projects (names that are brands or titles stay as they are)
update public.projects p set title_en = v.en from (values
  ('Wendy’s — Lanzamiento Tenders', 'Wendy’s — Tenders Launch'),
  ('Bodas A La Moda — Portada no. 13', 'Bodas A La Moda — Cover no. 13'),
  ('Fotografía gastronómica', 'Food photography'),
  ('Spot de producto', 'Product spot'),
  ('Retrato editorial', 'Editorial portrait'),
  ('Retrato en estudio', 'Studio portrait')
) as v(es, en) where p.title = v.es;
update public.projects p set meta_en = v.en from (values
  ('Cobertura de evento · con Hoenn', 'Event coverage · with Hoenn'),
  ('Sesión de fotos · con Hoenn', 'Photo shoot · with Hoenn'),
  ('Fashion film · Colección nupcial', 'Fashion film · Bridal collection'),
  ('Cobertura Día de los Padres · con Hoenn', 'Father’s Day coverage · with Hoenn'),
  ('Feria de Vehículos · con Hoenn', 'Car fair · with Hoenn'),
  ('Video y fotos · Oriana Lucas · Cayo Levantado', 'Video and photos · Oriana Lucas · Cayo Levantado'),
  ('Documental · Loma de Cabrera · con Hoenn', 'Documentary · Loma de Cabrera · with Hoenn'),
  ('Intro de serie · Chef Giancarlo Bonarelli', 'Series intro · Chef Giancarlo Bonarelli'),
  ('Sesión de fotos', 'Photo shoot'),
  ('Con Miguel R. Corniel y Hoenn', 'With Miguel R. Corniel and Hoenn')
) as v(es, en) where p.meta = v.es;
update public.projects set meta_en = 'Model ' || substring(meta from 8) where meta like 'Modelo @%';

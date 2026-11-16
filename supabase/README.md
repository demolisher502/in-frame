# Standing up your own copy

The website code is all in this repo, but the content database is not: it lives in a Supabase project. To run an independent copy you need your own Supabase project and your own hosting. About ten minutes.

## 1. Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com). Any region; the original is `us-east-1`.
2. Open **SQL Editor**, paste the whole of [`setup.sql`](setup.sql), and run it once. It creates the tables, the security rules and the image bucket, and loads the 20 starting projects and 9 clients.
3. Open **Project Settings → API** (or **Data API** / **API Keys**) and copy the **Project URL** and the **publishable** key (starts with `sb_publishable_`; the older `anon` key also works). Never use the secret / service-role key in this site.
4. Put those two values in [`../config.js`](../config.js).

## 2. Your admin login

1. **Authentication → Users → Add user**: your email and a password, "Auto Confirm User" on.
2. **SQL Editor**:

   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
   ```

3. Recommended: **Authentication → Sign In / Providers → Email** → turn on leaked password protection.

## 3. Hosting (Vercel)

1. In Vercel: **Add New → Project**, import this repo. No framework, no build command, no environment variables.
2. Once you know the address, update the three absolute URLs in the `<head>` of `index.html` (canonical, `og:url`, `og:image`).

## 4. Check it

- The public page shows 20 projects and the client strip. In the browser's network tab, the calls to `…supabase.co/rest/v1/projects` and `/clients` should return 200 from **your** project URL.
- `/admin` lets you sign in and shows the project list. Edit a title and confirm the public page changes.
- Add a project with a cover image to confirm uploads work.

## Notes

- `setup.sql` is for an empty project; running it twice fails on "already exists" rather than duplicating anything.
- It is a snapshot. Structure changes made later should be added here (or kept as migrations) so the file stays a true description of the database.
- The starting content has no uploaded images; every cover points at files in `assets/work/`. Images uploaded later through `/admin` live in the Supabase `media` bucket and are not in this repo.
- A copy is independent: content edited in one project's admin page does not appear in another's.

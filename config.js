/* Supabase connection, shared by the public site and /admin.
   This key is the publishable (public) one — it is meant to ship in the browser.
   What it can do is limited by the row-level security rules in the database:
   anyone can read published projects and clients; only users listed in `admins` can write. */
window.IF_CONFIG = {
  supabaseUrl: "https://unzalqzksrfzwymaqrbr.supabase.co",
  supabaseKey: "sb_publishable_g3dOB0ypBRl8anIXd_9DCg_T7cHrxdJ",
};

/* Supabase connection, shared by the public site and /admin.
   This key is the publishable (public) one — it is meant to ship in the browser.
   What it can do is limited by the row-level security rules in the database:
   anyone can read published projects and clients; only users listed in `admins` can write. */
window.IF_CONFIG = {
  supabaseUrl: "https://tlbkpdnaxqlmtmyumiki.supabase.co",
  supabaseKey: "sb_publishable_2_nl8FIAgSFy1cX5Ml1OrQ_AKb-C70D",
};

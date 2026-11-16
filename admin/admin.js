/* In Frame admin: sign in, then edit projects and clients.
   All permissions are enforced by the database (row-level security); this page is only the interface. */
const { supabaseUrl, supabaseKey } = window.IF_CONFIG;
const sb = supabase.createClient(supabaseUrl, supabaseKey);
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LABEL = { video: "Video", foto: "Foto", retrato: "Retrato" };
const BUCKET = "media";
const src = (u) => (/^https:\/\//.test(u || "") ? u : "/" + (u || "")); // seeded covers live in the site's own /assets

let projects = [];
let clients = [];
let editing = null; // project being edited, or null for a new one
let media = {};     // saved gallery items, by project id
let items = [];     // gallery as shown in the open form (saved rows plus not-yet-saved additions)
let removed = [];   // saved gallery rows to delete when the form is saved
const videoHost = (u) =>
  /^https:\/\/((www|m)\.)?(youtube\.com\/(watch\?|shorts\/|embed\/)|youtu\.be\/)/.test(u) ? "YouTube"
  : /^https:\/\/(www\.|player\.)?vimeo\.com\/(video\/)?\d+/.test(u) ? "Vimeo"
  : /^https:\/\/(www\.)?instagram\.com\/(reels?|p)\/[\w-]+/.test(u) ? "Instagram" : "";

/* ---------- small helpers ---------- */
let toastTimer;
function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.toggle("is-error", isError);
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), isError ? 6000 : 2600);
}
function fail(error, what) {
  console.error(error);
  toast(`No se pudo ${what}. ${error?.message || ""}`.trim(), true);
}
function showOnly(id) {
  ["boot", "loginView", "deniedView", "editorView"].forEach((v) => ($("#" + v).hidden = v !== id));
}

/* ---------- auth ---------- */
async function route(session) {
  $("#barRight").hidden = !session;
  if (!session) { showOnly("loginView"); $("#email").focus(); return; }
  $("#who").textContent = session.user.email;
  const { data, error } = await sb.from("admins").select("user_id").maybeSingle();
  if (error) { fail(error, "comprobar el permiso"); showOnly("deniedView"); return; }
  if (!data) { showOnly("deniedView"); return; }
  showOnly("editorView");
  await Promise.all([loadProjects(), loadClients()]);
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#loginError");
  const btn = $("#loginBtn");
  err.hidden = true;
  const email = $("#email").value.trim();
  const password = $("#password").value;
  if (!email || !password) { err.textContent = "Escribe tu correo y tu contraseña."; err.hidden = false; return; }
  btn.disabled = true;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  if (error) {
    err.textContent = /invalid login/i.test(error.message) ? "Correo o contraseña incorrectos." : `No se pudo entrar: ${error.message}`;
    err.hidden = false;
  }
});
$("#logout").addEventListener("click", () => sb.auth.signOut());

let lastUser;
sb.auth.onAuthStateChange((event, session) => {
  const user = session?.user?.id || null;
  if (event !== "INITIAL_SESSION" && user === lastUser) return; // token refreshes: nothing to redo
  lastUser = user;
  setTimeout(() => route(session), 0); // never call Supabase from inside this callback
});

/* ---------- projects ---------- */
async function loadProjects() {
  const [{ data, error }, m] = await Promise.all([
    sb.from("projects").select("*").order("position"),
    sb.from("project_media").select("*").order("position"),
  ]);
  if (error || m.error) return fail(error || m.error, "cargar los proyectos");
  projects = data;
  media = {};
  m.data.forEach((row) => (media[row.project_id] ||= []).push(row));
  renderProjects();
}

function renderProjects() {
  $("#noProjects").hidden = projects.length > 0;
  $("#projectRows").innerHTML = projects.map((p, i) => `
    <li class="row${p.published ? "" : " is-draft"}" data-id="${p.id}">
      <img class="row__thumb" src="${esc(src(p.thumb_url))}" alt="" loading="lazy">
      <div class="row__text">
        <p class="row__title">${esc(p.title)}</p>
        <p class="row__meta">${esc([LABEL[p.type], p.meta, p.year, media[p.id]?.length ? `Galería: ${media[p.id].length}` : ""].filter(Boolean).join(" · "))}</p>
      </div>
      <div class="row__flags">
        <label><input type="checkbox" data-flag="published" ${p.published ? "checked" : ""}> Publicado</label>
        <label><input type="checkbox" data-flag="featured" ${p.featured ? "checked" : ""}> Destacado</label>
        <label><input type="checkbox" data-flag="in_hero" ${p.in_hero ? "checked" : ""}> Portada</label>
      </div>
      <div class="row__actions">
        <button class="icon" type="button" data-act="up" aria-label="Subir ${esc(p.title)}" ${i === 0 ? "disabled" : ""}>↑</button>
        <button class="icon" type="button" data-act="down" aria-label="Bajar ${esc(p.title)}" ${i === projects.length - 1 ? "disabled" : ""}>↓</button>
        <button class="btn btn--ghost" type="button" data-act="edit">Editar</button>
        <button class="icon icon--danger" type="button" data-act="delete" aria-label="Eliminar ${esc(p.title)}">✕</button>
      </div>
    </li>`).join("");
}

$("#projectRows").addEventListener("change", async (e) => {
  const flag = e.target.dataset.flag;
  if (!flag) return;
  const p = projects.find((x) => x.id === e.target.closest(".row").dataset.id);
  const { error } = await sb.from("projects").update({ [flag]: e.target.checked }).eq("id", p.id);
  if (error) { e.target.checked = !e.target.checked; return fail(error, "guardar el cambio"); }
  p[flag] = e.target.checked;
  renderProjects();
  toast("Guardado");
});

$("#projectRows").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const i = projects.findIndex((x) => x.id === btn.closest(".row").dataset.id);
  const p = projects[i];
  const act = btn.dataset.act;
  if (act === "edit") return openSheet(p);
  if (act === "up" || act === "down") return move("projects", projects, i, act === "up" ? -1 : 1, renderProjects);
  if (act === "delete") {
    if (!confirm(`¿Eliminar “${p.title}”? Esto no se puede deshacer.`)) return;
    const { error } = await sb.from("projects").delete().eq("id", p.id);
    if (error) return fail(error, "eliminar el proyecto");
    removeUploads([p.cover_url, p.thumb_url, ...(media[p.id] || []).flatMap((x) => [x.url, x.thumb_url])]);
    delete media[p.id];
    projects.splice(i, 1);
    renderProjects();
    toast("Proyecto eliminado");
  }
});

/* swap positions with the neighbour */
async function move(table, list, i, d, render) {
  const j = i + d;
  if (j < 0 || j >= list.length) return;
  const a = list[i], b = list[j];
  const [ra, rb] = await Promise.all([
    sb.from(table).update({ position: b.position }).eq("id", a.id),
    sb.from(table).update({ position: a.position }).eq("id", b.id),
  ]);
  if (ra.error || rb.error) return fail(ra.error || rb.error, "cambiar el orden");
  [a.position, b.position] = [b.position, a.position];
  [list[i], list[j]] = [list[j], list[i]];
  render();
}

/* ---------- project form ---------- */
const sheet = $("#sheet");
function openSheet(p) {
  editing = p || null;
  $("#sheetTitle").textContent = p ? "Editar proyecto" : "Nuevo proyecto";
  $("#fTitle").value = p?.title || "";
  $("#fMeta").value = p?.meta || "";
  $("#fType").value = p?.type || "video";
  $("#fYear").value = p?.year || new Date().getFullYear();
  $("#fLink").value = p?.link || "";
  $("#fPublished").checked = p ? p.published : true;
  $("#fFeatured").checked = p ? p.featured : false;
  $("#fHero").checked = p ? p.in_hero : false;
  $("#cover").value = "";
  const prev = $("#coverPreview");
  prev.hidden = !p;
  if (p) prev.src = src(p.thumb_url);
  $("#formError").hidden = true;
  items.forEach((x) => x.preview && URL.revokeObjectURL(x.preview));
  items = (p ? media[p.id] || [] : []).map((x) => ({ ...x }));
  removed = [];
  $("#mediaVideo").value = "";
  renderMedia();
  sheet.showModal();
}
const formError = (msg) => { const err = $("#formError"); err.textContent = msg; err.hidden = !msg; };

/* ---------- gallery inside the project form (applied when the form is saved) ---------- */
function renderMedia() {
  $("#mediaList").innerHTML = items.map((x, i) => `
    <li class="tile">
      <div class="tile__view">
        ${x.kind === "photo" ? `<img src="${esc(x.preview || x.thumb_url || x.url)}" alt="Foto ${i + 1}">` : `<span>Video<br>${esc(videoHost(x.url))}</span>`}
        ${x.id ? "" : "<em>Nuevo</em>"}
      </div>
      <div class="tile__actions">
        <button class="icon" type="button" data-m="-1" data-i="${i}" aria-label="Mover antes (elemento ${i + 1})" ${i === 0 ? "disabled" : ""}>←</button>
        <button class="icon" type="button" data-m="1" data-i="${i}" aria-label="Mover después (elemento ${i + 1})" ${i === items.length - 1 ? "disabled" : ""}>→</button>
        <button class="icon icon--danger" type="button" data-m="x" data-i="${i}" aria-label="Quitar elemento ${i + 1}">✕</button>
      </div>
    </li>`).join("");
}
$("#mediaList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-m]");
  if (!btn) return;
  const i = +btn.dataset.i;
  if (btn.dataset.m === "x") {
    const [gone] = items.splice(i, 1);
    if (gone.id) removed.push(gone);
    if (gone.preview) URL.revokeObjectURL(gone.preview);
  } else {
    const j = i + +btn.dataset.m;
    [items[i], items[j]] = [items[j], items[i]];
  }
  renderMedia();
});
$("#addPhotos").addEventListener("click", () => $("#mediaFiles").click());
$("#mediaFiles").addEventListener("change", (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  const tooBig = files.filter((f) => f.size > 25 * 1024 * 1024);
  formError(tooBig.length ? `No se agregaron ${tooBig.length} foto(s) que pesan más de 25 MB.` : "");
  files.filter((f) => !tooBig.includes(f)).forEach((file) => items.push({ kind: "photo", file, preview: URL.createObjectURL(file) }));
  renderMedia();
});
function addVideo() {
  const input = $("#mediaVideo");
  const url = input.value.trim();
  if (!url) return input.focus();
  if (!videoHost(url)) return formError("Usa un enlace de YouTube, Vimeo o Instagram (reel o post) que empiece con https://");
  formError("");
  items.push({ kind: "video", url });
  input.value = "";
  renderMedia();
}
$("#addVideo").addEventListener("click", addVideo);
$("#mediaVideo").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addVideo(); } });

async function saveMedia(projectId, btn) {
  if (removed.length) {
    const { error } = await sb.from("project_media").delete().in("id", removed.map((x) => x.id));
    if (error) throw error;
    removeUploads(removed.flatMap((x) => [x.url, x.thumb_url]));
    removed = [];
  }
  const total = items.filter((x) => x.file).length;
  let n = 0;
  const fresh = [];
  const moves = [];
  for (const [i, x] of items.entries()) {
    const position = (i + 1) * 10;
    if (x.file) {
      btn.textContent = `Subiendo foto ${++n} de ${total}…`;
      const up = await uploadImage(x.file, "gallery", "gallery-thumbs");
      x.url = up.full; x.thumb_url = up.thumb;
      delete x.file;
    }
    if (!x.id) fresh.push({ project_id: projectId, kind: x.kind, url: x.url, thumb_url: x.thumb_url || null, position });
    else if (x.position !== position) moves.push(sb.from("project_media").update({ position }).eq("id", x.id));
  }
  if (!fresh.length && !moves.length) { media[projectId] = items.map((x) => ({ ...x })); return; }
  const results = await Promise.all([...moves, ...(fresh.length ? [sb.from("project_media").insert(fresh)] : [])]);
  const bad = results.find((r) => r.error);
  const { data, error } = await sb.from("project_media").select("*").eq("project_id", projectId).order("position");
  if (!error) { media[projectId] = data; items = data.map((x) => ({ ...x })); renderMedia(); }
  if (bad || error) throw bad?.error || error;
}
$("#newProject").addEventListener("click", () => openSheet(null));
$("#cancelProject").addEventListener("click", () => sheet.close());
$("#cover").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const prev = $("#coverPreview");
  prev.src = URL.createObjectURL(file);
  prev.hidden = false;
});

/* resize in the browser so uploads are small no matter what the camera produced */
async function toWebp(file, maxWidth, quality) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxWidth / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen"))), "image/webp", quality));
}
async function uploadImage(file, fullDir, thumbDir) {
  const name = crypto.randomUUID();
  const [full, thumb] = await Promise.all([toWebp(file, 1600, 0.85), toWebp(file, 540, 0.72)]);
  const opts = { contentType: "image/webp", cacheControl: "31536000" };
  const up1 = await sb.storage.from(BUCKET).upload(`${fullDir}/${name}.webp`, full, opts);
  if (up1.error) throw up1.error;
  const up2 = await sb.storage.from(BUCKET).upload(`${thumbDir}/${name}.webp`, thumb, opts);
  if (up2.error) throw up2.error;
  const url = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return { full: url(`${fullDir}/${name}.webp`), thumb: url(`${thumbDir}/${name}.webp`) };
}
async function uploadCover(file) {
  const up = await uploadImage(file, "covers", "thumbs");
  return { cover_url: up.full, thumb_url: up.thumb };
}
/* delete uploaded files by their public URL (seeded covers in /assets and video links are left alone) */
function removeUploads(urls) {
  const prefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
  const paths = urls.filter((u) => u?.startsWith(prefix)).map((u) => u.slice(prefix.length));
  if (paths.length) sb.storage.from(BUCKET).remove(paths);
}

$("#projectForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#formError");
  const btn = $("#saveProject");
  const show = (msg) => { err.textContent = msg; err.hidden = false; };
  err.hidden = true;

  const title = $("#fTitle").value.trim();
  const link = $("#fLink").value.trim();
  const year = parseInt($("#fYear").value, 10);
  const file = $("#cover").files[0];
  if (!title) return show("Ponle un título al proyecto.");
  if (link && !/^https:\/\//.test(link)) return show("El enlace debe empezar con https://");
  if (!editing && !file) return show("Elige una imagen de portada.");
  if (file && file.size > 25 * 1024 * 1024) return show("La imagen pesa más de 25 MB. Exporta una versión más liviana.");

  btn.disabled = true;
  btn.textContent = file ? "Subiendo portada…" : "Guardando…";
  try {
    const row = {
      title,
      meta: $("#fMeta").value.trim(),
      type: $("#fType").value,
      year: Number.isFinite(year) ? year : null,
      link: link || null,
      published: $("#fPublished").checked,
      featured: $("#fFeatured").checked,
      in_hero: $("#fHero").checked,
    };
    if (file) Object.assign(row, await uploadCover(file));
    if (editing) {
      const { data, error } = await sb.from("projects").update(row).eq("id", editing.id).select().single();
      if (error) throw error;
      if (file) { removeUploads([editing.cover_url, editing.thumb_url]); $("#cover").value = ""; }
      projects[projects.findIndex((x) => x.id === editing.id)] = data;
      editing = data;
    } else {
      row.position = (projects.at(-1)?.position || 0) + 10;
      const { data, error } = await sb.from("projects").insert(row).select().single();
      if (error) throw error;
      projects.push(data);
      editing = data; // if the gallery step fails, saving again updates this project instead of creating a second one
      $("#cover").value = "";
    }
    await saveMedia(editing.id, btn);
    renderProjects();
    sheet.close();
    toast("Guardado. Ya está en el sitio.");
  } catch (error) {
    console.error(error);
    renderProjects();
    show(`No se pudo guardar: ${error.message || error}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar";
  }
});

/* ---------- clients ---------- */
async function loadClients() {
  const { data, error } = await sb.from("clients").select("*").order("position");
  if (error) return fail(error, "cargar los clientes");
  clients = data;
  renderClients();
}
function renderClients() {
  $("#clientRows").innerHTML = clients.map((c, i) => `
    <li class="row" data-id="${c.id}">
      <div><label class="sr" for="c-${c.id}">Nombre</label><input id="c-${c.id}" value="${esc(c.name)}" maxlength="80"></div>
      <div class="row__actions">
        <button class="icon" type="button" data-act="up" aria-label="Subir ${esc(c.name)}" ${i === 0 ? "disabled" : ""}>↑</button>
        <button class="icon" type="button" data-act="down" aria-label="Bajar ${esc(c.name)}" ${i === clients.length - 1 ? "disabled" : ""}>↓</button>
        <button class="icon icon--danger" type="button" data-act="delete" aria-label="Eliminar ${esc(c.name)}">✕</button>
      </div>
    </li>`).join("");
}
$("#clientRows").addEventListener("change", async (e) => {
  if (e.target.tagName !== "INPUT") return;
  const c = clients.find((x) => x.id === e.target.closest(".row").dataset.id);
  const name = e.target.value.trim();
  if (!name) { e.target.value = c.name; return; }
  const { error } = await sb.from("clients").update({ name }).eq("id", c.id);
  if (error) { e.target.value = c.name; return fail(error, "guardar el nombre"); }
  c.name = name;
  toast("Guardado");
});
$("#clientRows").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const i = clients.findIndex((x) => x.id === btn.closest(".row").dataset.id);
  const c = clients[i];
  const act = btn.dataset.act;
  if (act === "up" || act === "down") return move("clients", clients, i, act === "up" ? -1 : 1, renderClients);
  if (!confirm(`¿Quitar “${c.name}” de la lista de clientes?`)) return;
  const { error } = await sb.from("clients").delete().eq("id", c.id);
  if (error) return fail(error, "quitar el cliente");
  clients.splice(i, 1);
  renderClients();
  toast("Cliente quitado");
});
$("#clientForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("#clientName");
  const name = input.value.trim();
  if (!name) return;
  const { data, error } = await sb.from("clients").insert({ name, position: (clients.at(-1)?.position || 0) + 10 }).select().single();
  if (error) return fail(error, "agregar el cliente");
  clients.push(data);
  input.value = "";
  renderClients();
  toast("Cliente agregado");
});

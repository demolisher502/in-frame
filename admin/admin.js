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
  const { data, error } = await sb.from("projects").select("*").order("position");
  if (error) return fail(error, "cargar los proyectos");
  projects = data;
  renderProjects();
}

function renderProjects() {
  $("#noProjects").hidden = projects.length > 0;
  $("#projectRows").innerHTML = projects.map((p, i) => `
    <li class="row${p.published ? "" : " is-draft"}" data-id="${p.id}">
      <img class="row__thumb" src="${esc(src(p.thumb_url))}" alt="" loading="lazy">
      <div class="row__text">
        <p class="row__title">${esc(p.title)}</p>
        <p class="row__meta">${esc([LABEL[p.type], p.meta, p.year].filter(Boolean).join(" · "))}</p>
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
    removeUploads(p);
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
  sheet.showModal();
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
async function uploadCover(file) {
  const name = crypto.randomUUID();
  const [full, thumb] = await Promise.all([toWebp(file, 1600, 0.85), toWebp(file, 540, 0.72)]);
  const opts = { contentType: "image/webp", cacheControl: "31536000" };
  const up1 = await sb.storage.from(BUCKET).upload(`covers/${name}.webp`, full, opts);
  if (up1.error) throw up1.error;
  const up2 = await sb.storage.from(BUCKET).upload(`thumbs/${name}.webp`, thumb, opts);
  if (up2.error) throw up2.error;
  const url = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return { cover_url: url(`covers/${name}.webp`), thumb_url: url(`thumbs/${name}.webp`) };
}
/* delete a project's uploaded files (seeded covers in /assets are left alone) */
function removeUploads(p) {
  const prefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
  const paths = [p.cover_url, p.thumb_url].filter((u) => u?.startsWith(prefix)).map((u) => u.slice(prefix.length));
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
  btn.textContent = file ? "Subiendo…" : "Guardando…";
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
      if (file) removeUploads(editing);
      projects[projects.findIndex((x) => x.id === editing.id)] = data;
    } else {
      row.position = (projects.at(-1)?.position || 0) + 10;
      const { data, error } = await sb.from("projects").insert(row).select().single();
      if (error) throw error;
      projects.push(data);
    }
    renderProjects();
    sheet.close();
    toast("Guardado. Ya está en el sitio.");
  } catch (error) {
    console.error(error);
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

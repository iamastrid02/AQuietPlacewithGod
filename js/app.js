// A Quiet Place with God - scripts
const $ = id => document.getElementById(id);
function showPage(page, button) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  $(page).classList.add('active');
  button.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

// Daily verses (KJV, public domain)
const VERSES = [
  ["Draw nigh to God, and he will draw nigh to you.", "James 4:8 (KJV)"],
  ["Be still, and know that I am God.", "Psalm 46:10 (KJV)"],
  ["The Lord is my shepherd; I shall not want.", "Psalm 23:1 (KJV)"],
  ["Casting all your care upon him; for he careth for you.", "1 Peter 5:7 (KJV)"],
  ["Trust in the Lord with all thine heart.", "Proverbs 3:5 (KJV)"],
  ["Come unto me, all ye that labour and are heavy laden, and I will give you rest.", "Matthew 11:28 (KJV)"]
];
let vi = 0;
function nextVerse() {
  vi = (vi + 1) % VERSES.length;
  $('verse').textContent = '"' + VERSES[vi][0] + '"';
  $('vref').textContent = VERSES[vi][1];
}

// Saved entries (stored in this browser only)
const FIELDS = {bible:2, calendar:3, prayers:1, worship:2, notes:2};
const load = k => { try { return JSON.parse(localStorage.getItem('qp_' + k)) || []; } catch (e) { return []; } };
const save = (k, v) => { try { localStorage.setItem('qp_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } };

function add(k) {
  const v = [];
  for (let i = 1; i <= FIELDS[k]; i++) v.push($(k + i).value.trim());
  const msg = $('msg-' + k);
  if (k === 'worship' && !/^https?:\/\//i.test(v[1])) { msg.textContent = 'Please paste a link that starts with https://'; return; }
  if (!v.some(Boolean)) { msg.textContent = 'Write something first ♡'; return; }
  const items = load(k);
  items.unshift({v, done:false, id:Date.now()});
  if (!save(k, items)) { msg.textContent = "Couldn't save in this browser."; return; }
  for (let i = 1; i <= FIELDS[k]; i++) $(k + i).value = '';
  msg.textContent = 'Saved ♡';
  render(k);
}
function toggle(k, id) { const a = load(k); const it = a.find(x => x.id === id); if (it) it.done = !it.done; save(k, a); render(k); }
function remove(k, id) { if (confirm('Delete this entry?')) { save(k, load(k).filter(x => x.id !== id)); render(k); } }

function card(k, it) {
  const [a, b, c] = it.v;
  const d = document.createElement('div');
  d.className = 'item' + (it.done ? ' done' : '');
  const h = document.createElement('h4'), p = document.createElement('p');
  if (k === 'bible') { h.textContent = a || 'Untitled'; p.textContent = b; }
  else if (k === 'calendar') { h.textContent = (b || 'Reading') + (a ? ' · ' + a : ''); p.textContent = c; }
  else if (k === 'prayers') { h.textContent = '🙏'; p.textContent = a; }
  else if (k === 'notes') { h.textContent = a || 'Untitled'; p.textContent = b; }
  else {
    const l = document.createElement('a');
    l.href = b; l.target = '_blank'; l.rel = 'noopener noreferrer'; l.textContent = '♪ ' + (a || b);
    h.appendChild(l);
  }
  d.appendChild(h);
  if (p.textContent) d.appendChild(p);
  const r = document.createElement('div'); r.className = 'row';
  if (k === 'calendar' || k === 'prayers') {
    const t = document.createElement('button'); t.className = 'mini';
    t.textContent = k === 'prayers' ? (it.done ? 'Back to requests' : '✓ Answered') : (it.done ? 'Undo' : '✓ Done');
    t.onclick = () => toggle(k, it.id); r.appendChild(t);
  }
  const x = document.createElement('button'); x.className = 'mini'; x.textContent = 'Delete';
  x.onclick = () => remove(k, it.id); r.appendChild(x);
  d.appendChild(r);
  return d;
}
function fill(el, items, k, empty) {
  el.textContent = '';
  if (!items.length) { const e = document.createElement('p'); e.className = 'empty'; e.textContent = empty; el.appendChild(e); }
  items.forEach(it => el.appendChild(card(k, it)));
}
function render(k) {
  let items = load(k);
  if (k === 'calendar') items.sort((a, b) => (a.v[0] || '9999').localeCompare(b.v[0] || '9999'));
  if (k === 'prayers') {
    fill($('list-prayers'), items.filter(i => !i.done), k, 'No prayer requests yet ♡');
    fill($('list-prayers-done'), items.filter(i => i.done), k, 'Answered prayers will appear here ♡');
  } else fill($('list-' + k), items, k, 'Nothing saved yet ♡');
}
Object.keys(FIELDS).forEach(render);

// ---- Backup and restore ----
function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith('qp_') && k !== 'qp_pass') data[k] = localStorage.getItem(k);
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'}));
  a.download = 'quiet-place-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $('msg-data').textContent = 'Backup downloaded ♡';
}
function importData(input) {
  const f = input.files[0];
  if (!f) return;
  if (!confirm('Restoring replaces the entries saved in this browser. Continue?')) { input.value = ''; return; }
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      Object.keys(d).forEach(k => {
        if (/^qp_(bible|calendar|prayers|worship|notes)$/.test(k) && Array.isArray(JSON.parse(d[k]))) localStorage.setItem(k, d[k]);
      });
      Object.keys(FIELDS).forEach(render);
      $('msg-data').textContent = 'Backup restored ♡';
    } catch (e) { $('msg-data').textContent = "That file doesn't look like a backup."; }
    input.value = '';
  };
  r.readAsText(f);
}

// ---- Passcode (a light privacy layer, stored as a hash in this browser) ----
const hash = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .map(b => b.toString(16).padStart(2, '0')).join('');
function passStatus() {
  const on = !!localStorage.getItem('qp_pass');
  $('lock-status').textContent = on ? 'A passcode is on for this browser.' : 'Optional: ask for a passcode when this site opens.';
  $('rm-pass').hidden = !on;
}
async function setPass() {
  const v = $('pass1').value, m = $('msg-pass');
  if (v.length < 4) { m.textContent = 'Use at least 4 characters.'; return; }
  try { localStorage.setItem('qp_pass', await hash(v)); } catch (e) { m.textContent = "Couldn't set a passcode here."; return; }
  $('pass1').value = '';
  m.textContent = 'Passcode saved ♡';
  passStatus();
}
function removePass() {
  localStorage.removeItem('qp_pass');
  $('msg-pass').textContent = 'Passcode removed.';
  passStatus();
}
async function unlock() {
  try {
    if (await hash($('lockpass').value) === localStorage.getItem('qp_pass')) {
      document.documentElement.classList.remove('locked');
      $('lockpass').value = '';
      $('msg-lock').textContent = '';
    } else $('msg-lock').textContent = 'That passcode is not right.';
  } catch (e) { $('msg-lock').textContent = "Couldn't check the passcode."; }
}
passStatus();

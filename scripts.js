(() => {
'use strict';
// ===== 共通設定 =====
const $ = id => document.getElementById(id);
const RAD = Math.PI / 180, W = 960, H = 480;
const BLUE = '#1f5fbf', ORANGE = '#c2410c', GREEN = '#15803d', GRAY = '#6b7280';
const SPECIAL = [0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330,360];

// アプリの状態（ここだけで管理）
const S = { tab: 1, th1: 50 * RAD, len1: 260, th2: 45 * RAD, snap: true, mode: 'sin',
            rec: [], prev: null, A: 1, T: 4, phi: 0, t: 0, play: false };

const canv = { 1: $('c1'), 2: $('c2'), 3: $('c3') };
Object.values(canv).forEach(c => { c.width = W; c.height = H; });

// ===== 描画ヘルパー =====
function line(g, x1, y1, x2, y2, col = '#333', w = 2, dash = []) {
  g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
}
function txt(g, s, x, y, col = '#111', size = 18, align = 'center') {
  g.fillStyle = col; g.font = `bold ${size}px sans-serif`; g.textAlign = align; g.fillText(s, x, y);
}
function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function pointer(e, c) { // 画面座標 → キャンバス座標
  const r = c.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}

// ===== 三角比の表示（代表値は分数・根号でも表示）=====
const EX_SC = [[.5, '1/2'], [Math.SQRT1_2, '√2/2'], [Math.sqrt(3) / 2, '√3/2']];
const EX_T = [[1, '1'], [1 / Math.sqrt(3), '√3/3'], [Math.sqrt(3), '√3']];
function show(v, table) {
  if (Math.abs(v) < 1e-9) return '0';
  if (Math.abs(Math.abs(v) - 1) < 1e-9) return v < 0 ? '−1' : '1';
  const d = v.toFixed(3).replace('-', '−');
  const hit = table.find(([e]) => Math.abs(Math.abs(v) - e) < 1e-9);
  return hit ? `${d}（${v < 0 ? '−' : ''}${hit[1]}）` : d;
}
const showTan = (s, c) => Math.abs(c) < 1e-9 ? '定義されない' : show(s / c, EX_T);

// ===== TAB1：三角比を動かす =====
const O1 = { x: 110, y: 420 }, U1 = 50; // 50px = 1 の長さ
function tri(g, len, th, col, dash, w) {
  const hx = O1.x + len * Math.cos(th), hy = O1.y - len * Math.sin(th);
  g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash);
  g.beginPath(); g.moveTo(O1.x, O1.y); g.lineTo(hx, hy); g.lineTo(hx, O1.y); g.closePath(); g.stroke();
  g.setLineDash([]); return { hx, hy };
}
function draw1() {
  const g = canv[1].getContext('2d'); g.clearRect(0, 0, W, H);
  const th = S.th1, L = S.len1;
  tri(g, 100, th, GRAY, [6, 5], 2);                 // 基準の小さい三角形
  const { hx, hy } = tri(g, L, th, '#111', [], 3);  // 操作する三角形
  g.fillStyle = 'rgba(31,95,191,.08)'; g.beginPath();
  g.moveTo(O1.x, O1.y); g.lineTo(hx, hy); g.lineTo(hx, O1.y); g.fill();
  line(g, hx - 14, O1.y, hx - 14, O1.y - 14, '#111', 1.5); line(g, hx - 14, O1.y - 14, hx, O1.y - 14, '#111', 1.5);
  g.strokeStyle = GREEN; g.lineWidth = 3; g.beginPath(); g.arc(O1.x, O1.y, 45, 0, -th, true); g.stroke();
  txt(g, 'θ', O1.x + 62, O1.y - 12, GREEN, 22);
  txt(g, `斜辺 ${(L / U1).toFixed(2)}`, (O1.x + hx) / 2 - 40, (O1.y + hy) / 2 - 12, '#111');
  txt(g, `対辺 ${(L * Math.sin(th) / U1).toFixed(2)}`, hx + 12, (O1.y + hy) / 2, ORANGE, 18, 'left');
  txt(g, `隣辺 ${(L * Math.cos(th) / U1).toFixed(2)}`, (O1.x + hx) / 2, O1.y + 30, BLUE);
  dot(g, hx, hy, 11, '#dc2626'); dot(g, O1.x, O1.y, 5, '#111');

  const o = L * Math.sin(th) / U1, a = L * Math.cos(th) / U1, h = L / U1;
  const o2 = 100 * Math.sin(th) / U1, a2 = 100 * Math.cos(th) / U1, h2 = 2;
  const s = Math.sin(th), c = Math.cos(th);
  $('r1').innerHTML = `<b>θ = ${(th / RAD).toFixed(1)}°</b><br>
    <span class="sinc">sinθ = 対辺/斜辺 = ${o.toFixed(2)}/${h.toFixed(2)} = <b>${show(s, EX_SC)}</b></span><br>
    <span class="cosc">cosθ = 隣辺/斜辺 = ${a.toFixed(2)}/${h.toFixed(2)} = <b>${show(c, EX_SC)}</b></span><br>
    tanθ = 対辺/隣辺 = ${o.toFixed(2)}/${a.toFixed(2)} = <b>${show(s / c, EX_T)}</b><hr>
    基準（破線）: sinθ = ${o2.toFixed(2)}/${h2.toFixed(2)} = ${(o2 / h2).toFixed(3)}、cosθ = ${a2.toFixed(2)}/${h2.toFixed(2)} = ${(a2 / h2).toFixed(3)}<br>
    <span class="eq">大きさが違っても比は同じ</span>`;
  $('size1').value = L;
}
function drag1(c) {
  let on = false;
  const move = e => {
    const p = pointer(e, c), dx = p.x - O1.x, dy = O1.y - p.y;
    S.th1 = Math.min(89, Math.max(1, Math.atan2(dy, dx) / RAD)) * RAD;
    S.len1 = Math.min(380, Math.max(80, Math.hypot(dx, dy))); draw();
  };
  c.addEventListener('pointerdown', e => { on = true; c.setPointerCapture(e.pointerId); c.focus(); move(e); });
  c.addEventListener('pointermove', e => on && move(e));
  c.addEventListener('pointerup', () => on = false);
  c.addEventListener('keydown', e => key(e, d => { S.th1 = Math.min(89, Math.max(1, S.th1 / RAD + d)) * RAD; draw(); }));
}
function key(e, fn) { // 左右キーで角度変更（Shiftで5°）
  const d = (e.shiftKey ? 5 : 1);
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { fn(d); e.preventDefault(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { fn(-d); e.preventDefault(); }
}

// ===== TAB2：単位円 =====
const C2 = { x: 240, y: 240, R: 170, gx: 520, gw: 400 };
function snapDeg(d) {
  if (!S.snap) return d;
  const s = SPECIAL.reduce((b, v) => Math.abs(v - d) < Math.abs(b - d) ? v : b, 0);
  return Math.abs(s - d) < 4 ? s % 360 : d;
}
function setDeg(d) { // 角度(度)を設定。0〜360に正規化し、グラフ用に記録
  d = snapDeg(((d % 360) + 360) % 360);
  S.th2 = d * RAD; record(d); draw();
}
function record(d) { // 通った角度ごとに値を記録（飛んだ分は補間して埋める）
  if (S.mode === 'none') return;
  const i = Math.round(d) % 360, v = i * RAD;
  const put = k => { const r = k * RAD; S.rec[k] = S.mode === 'sin' ? Math.sin(r) : Math.cos(r); };
  if (S.prev !== null && S.prev !== i) {
    let diff = ((i - S.prev + 540) % 360) - 180, step = Math.sign(diff);
    for (let k = S.prev, n = 0; n < Math.abs(diff); n++) { k = (k + step + 360) % 360; put(k); }
  }
  put(i); S.rec[360] = S.rec[0]; S.prev = i;
}
function clearRec() { S.rec = []; S.prev = null; record(S.th2 / RAD); }
function draw2() {
  const g = canv[2].getContext('2d'); g.clearRect(0, 0, W, H);
  const { x: cx, y: cy, R, gx, gw } = C2, th = S.th2, x = Math.cos(th), y = Math.sin(th);
  const px = cx + R * x, py = cy - R * y, deg = th / RAD;
  line(g, cx - R - 30, cy, cx + R + 30, cy, GRAY, 1.5); line(g, cx, cy - R - 30, cx, cy + R + 30, GRAY, 1.5);
  g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  txt(g, '1', cx + R + 8, cy + 20, GRAY, 15); txt(g, '−1', cx - R - 12, cy + 20, GRAY, 15);
  g.strokeStyle = GREEN; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 34, 0, -th, true); g.stroke();
  txt(g, 'θ', cx + 52, cy - 10, GREEN, 20);
  line(g, cx, cy, cx, cy, '#111');
  line(g, cx, cy, px, py, '#111', 3);                    // OP
  line(g, cx, cy, px, cy, BLUE, 6);                      // x成分（実線）
  line(g, px, cy, px, py, ORANGE, 6, [9, 5]);            // y成分（破線）
  dot(g, px, py, 10, '#dc2626');
  txt(g, 'P', px + (x >= 0 ? 16 : -16), py + (y >= 0 ? -10 : 20), '#dc2626', 20);
  txt(g, 'x = cosθ', (cx + px) / 2, cy + (y >= 0 ? 24 : -12), BLUE, 16);
  txt(g, 'y = sinθ', px + (x >= 0 ? 12 : -12), (cy + py) / 2, ORANGE, 16, x >= 0 ? 'left' : 'right');
  // --- グラフ ---
  const gX = d => gx + d * gw / 360, gY = v => cy - R * v;
  line(g, gx, cy, gx + gw + 14, cy, GRAY, 1.5); line(g, gx, cy - R - 20, gx, cy + R + 20, GRAY, 1.5);
  [1, -1].forEach(v => { line(g, gx, gY(v), gx + gw, gY(v), '#e5e7eb', 1); txt(g, v > 0 ? '1' : '−1', gx - 14, gY(v) + 5, GRAY, 15); });
  [90, 180, 270, 360].forEach(d => { line(g, gX(d), cy - 5, gX(d), cy + 5, GRAY, 1.5); txt(g, d + '°', gX(d), cy + 24, GRAY, 14); });
  const name = S.mode === 'cos' ? 'cos' : 'sin';
  txt(g, S.mode === 'none' ? 'グラフを描くモードを選んでください' : `θ（横軸）→ ${S.mode === 'cos' ? 'x' : 'y'}座標 = ${name}θ（縦軸）`, gx + gw / 2, 36, '#111', 17);
  if (S.mode !== 'none') {
    const col = S.mode === 'cos' ? BLUE : ORANGE; let last = null;
    for (let d = 0; d <= 360; d++) {
      const v = S.rec[d]; if (v === undefined) { last = null; continue; }
      if (last !== null) line(g, gX(d - 1), gY(S.rec[d - 1]), gX(d), gY(v), col, 3);
      dot(g, gX(d), gY(v), 1.6, col); last = d;
    }
    const gv = S.mode === 'cos' ? x : y, mx = gX(deg), my = gY(gv);
    line(g, px, py, mx, my, '#9ca3af', 1.5, [4, 4]);     // 円上の点 → グラフ上の点
    line(g, mx, cy, mx, my, col, 1.5, [3, 3]);
    dot(g, mx, my, 9, '#dc2626');
  }
  $('r2').innerHTML = `<b>θ = ${deg.toFixed(1)}°</b><br>P = (${x.toFixed(2)}, ${y.toFixed(2)})<br>
    <span class="cosc">x座標 = ${x.toFixed(2)}</span><br><span class="cosc">cosθ = ${show(x, EX_SC)}</span> <span class="eq">x座標 ＝ cosθ</span><br>
    <span class="sinc">y座標 = ${y.toFixed(2)}</span><br><span class="sinc">sinθ = ${show(y, EX_SC)}</span> <span class="eq">y座標 ＝ sinθ</span><br>
    tanθ = ${showTan(y, x)}<br>x²+y² = ${(x * x + y * y).toFixed(2)}`;
}
function drag2(c) {
  let on = false;
  const move = e => { const p = pointer(e, c); setDeg(Math.atan2(C2.y - p.y, p.x - C2.x) / RAD); };
  c.addEventListener('pointerdown', e => { if (pointer(e, c).x > 500) return; on = true; c.setPointerCapture(e.pointerId); c.focus(); S.play = false; move(e); });
  c.addEventListener('pointermove', e => on && move(e));
  c.addEventListener('pointerup', () => on = false);
  c.addEventListener('keydown', e => key(e, d => setDeg(Math.round(S.th2 / RAD) + d)));
}

// ===== TAB3：円の動きから波をつくる =====
const XMAX = 8, C3 = { x: 190, y: 240, k: 70, gx: 400, ux: 60 };
function draw3() {
  const g = canv[3].getContext('2d'); g.clearRect(0, 0, W, H);
  const { x: cx, y: cy, k, gx, ux } = C3, { A, T, phi } = S, w = 2 * Math.PI / T, p = phi * RAD;
  const R = A * k, ang = w * S.t + p, px = cx + R * Math.cos(ang), py = cy - R * Math.sin(ang);
  line(g, cx - 190, cy, cx + 190, cy, GRAY, 1); line(g, cx, cy - 190, cx, cy + 190, GRAY, 1);
  g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  line(g, cx, cy, px, py, '#111', 3); dot(g, px, py, 9, '#dc2626');
  line(g, px, cy, px, py, ORANGE, 4, [8, 4]);
  line(g, gx, cy, gx + XMAX * ux + 10, cy, GRAY, 1.5); line(g, gx, cy - 190, gx, cy + 190, GRAY, 1.5);
  for (let i = 1; i <= XMAX; i++) { line(g, gx + i * ux, cy - 4, gx + i * ux, cy + 4, GRAY, 1); txt(g, i, gx + i * ux, cy + 20, GRAY, 13); }
  txt(g, '時間 x', gx + XMAX * ux - 10, cy - 12, GRAY, 14);
  g.strokeStyle = ORANGE; g.lineWidth = 3; g.beginPath();
  for (let i = 0; i <= 480; i++) { const x = i / 480 * XMAX, Y = cy - k * A * Math.sin(w * x + p); i ? g.lineTo(gx + x * ux, Y) : g.moveTo(gx, Y); }
  g.stroke();
  const m = S.t % XMAX;
  line(g, px, py, gx + m * ux, py, '#9ca3af', 1.5, [4, 4]); dot(g, gx + m * ux, py, 9, '#dc2626');
  const sg = p < 0 ? '−' : '+';
  $('r3').innerHTML = `<b>y = ${A.toFixed(1)} sin(${w.toFixed(2)}x ${sg} ${Math.abs(p).toFixed(2)})</b><br>
    y = A sin(ωx + φ)　ω = 2π/T = ${w.toFixed(2)}<br>A = ${A.toFixed(1)}、T = ${T}、φ = ${p.toFixed(2)} rad`;
  $('Av').textContent = A.toFixed(1); $('Tv').textContent = T; $('phiv').textContent = phi + '°';
}

// ===== 全体の描画・アニメーション・タブ =====
function draw() { [null, draw1, draw2, draw3][S.tab](); }
let last = 0;
function loop(now) { // 一定速度で回転（TAB2: 60°/秒、TAB3: 時間を進める）
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S.play && S.tab === 2) setDeg(S.th2 / RAD + 60 * dt);
  if (S.play && S.tab === 3) { S.t += dt; draw(); }
  requestAnimationFrame(loop);
}
function switchTab(n) {
  S.tab = n; S.play = false;
  document.querySelectorAll('[role=tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab == n));
  [1, 2, 3].forEach(i => $('tab' + i).hidden = i !== n);
  draw();
}

// ===== 初期化 =====
function init() {
  document.querySelectorAll('[role=tab]').forEach(b => b.onclick = () => switchTab(+b.dataset.tab));
  drag1(canv[1]); drag2(canv[2]);
  $('size1').oninput = e => { S.len1 = +e.target.value; draw(); };
  $('reset1').onclick = () => { S.th1 = 50 * RAD; S.len1 = 260; draw(); };
  document.querySelectorAll('[name=mode]').forEach(r => r.onchange = () => { S.mode = r.value; clearRec(); draw(); });
  $('snap').onchange = e => S.snap = e.target.checked;
  $('play2').onclick = () => S.play = true; $('pause2').onclick = () => S.play = false;
  $('reset2').onclick = () => { S.play = false; S.mode = 'sin'; document.querySelector('[name=mode][value=sin]').checked = true; S.th2 = 45 * RAD; clearRec(); draw(); };
  $('go').onclick = () => { const v = parseFloat($('ang').value); if (!isNaN(v)) setDeg(v); };
  $('ang').onkeydown = e => e.key === 'Enter' && $('go').click();
  ['A', 'T', 'phi'].forEach(id => $(id).oninput = e => { S[id] = +e.target.value; draw(); });
  $('play3').onclick = () => S.play = true; $('pause3').onclick = () => S.play = false;
  $('reset3').onclick = () => { S.play = false; S.t = 0; S.A = 1; S.T = 4; S.phi = 0; $('A').value = 1; $('T').value = 4; $('phi').value = 0; draw(); };
  record(S.th2 / RAD); draw(); requestAnimationFrame(loop);
}
init();
})();

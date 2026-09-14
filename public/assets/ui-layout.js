// Shared layout for all three entry points. Existing controls retain their IDs/events.
export function setupDrivingLayout() {
  const copy = {
    zh: { setup: '驾驶准备', lead: '选好车辆和地图，就可以出发。', start: '开始驾驶', tuning: '驾驶手感与声音', map: '地图编辑与起点', help: '操作指南', about: '关于与常见问题', data: '详细驾驶数据', reset: '重置车辆', hint: '点击小地图可展开，拖动和滚轮可调整视野。' },
    en: { setup: 'Ready to drive', lead: 'Choose your vehicle and map, then head out.', start: 'Start driving', tuning: 'Handling & sound', map: 'Map editor & spawn', help: 'How to drive', about: 'About & FAQ', data: 'Driving details', reset: 'Reset vehicle', hint: 'Click the mini map to expand. Drag and scroll to explore.' },
    ja: { setup: 'ドライブの準備', lead: '車両とマップを選んで、出発しましょう。', start: '運転を始める', tuning: '操作感とサウンド', map: 'マップ編集・開始位置', help: '操作ガイド', about: '概要・よくある質問', data: '走行データ', reset: '車両をリセット', hint: 'ミニマップをクリックで拡大。ドラッグとホイールで表示を調整できます。' },
  }[document.documentElement.lang.slice(0, 2)] || null;
  if (!copy) return;
  const panel = document.querySelector('.panel');
  const section = panel.querySelector('.controlsSection');
  const grids = [...section.querySelectorAll(':scope > .controlGrid')];
  const fold = (title, nodes) => {
    const details = document.createElement('details'); details.className = 'settingsFold';
    const summary = document.createElement('summary'); summary.textContent = title;
    const body = document.createElement('div'); body.className = 'settingsFoldBody';
    details.append(summary, body); nodes.filter(Boolean).forEach(n => body.append(n)); return details;
  };
  const title = document.createElement('h2'); title.className = 'setupTitle'; title.textContent = copy.setup;
  const lead = document.createElement('p'); lead.className = 'setupLead'; lead.textContent = copy.lead;
  const hero = panel.querySelector('h1'); hero.classList.add('appBrand');
  panel.querySelector(':scope > p').hidden = true;
  hero.after(title, lead);
  const tips = panel.querySelector('.tips');
  const actions = document.createElement('div'); actions.className = 'driveActions';
  const start = document.createElement('button'); start.type = 'button'; start.className = 'startDriving'; start.textContent = copy.start;
  start.addEventListener('click', () => {
    document.getElementById('uiToggle').click();
    document.getElementById('app').focus({ preventScroll: true });
  });
  document.getElementById('app').tabIndex = -1;
  actions.append(start, document.getElementById('resetBtn'));
  const viewButton = document.getElementById('viewBtn');
  const mapActions = grids[1];
  const tuning = fold(copy.tuning, grids.slice(3));
  tuning.lastChild.append(panel.querySelector('.curveCard'));
  const map = fold(copy.map, [mapActions, grids[2], panel.querySelector('.panelUtility')]);
  const help = fold(copy.help, [tips]);
  const hint = document.createElement('p'); hint.textContent = copy.hint; help.lastChild.append(hint);
  const telemetry = [...document.querySelector('#hud .status').children].slice(2, 6);
  const data = fold(copy.data, telemetry);
  const about = fold(copy.about, [panel.querySelector('.aboutSection')]);
  section.after(tuning, map, help, data, about);
  // Everything scrolls except the start bar, so "Start driving" stays reachable
  // on short phone screens no matter how far the settings folds are opened.
  const scroll = document.createElement('div'); scroll.className = 'panelScroll';
  scroll.append(...panel.childNodes);
  panel.append(scroll, actions);
  const quick = document.getElementById('collapsedQuickActions');
  // Keep the original cycle button available alongside direct view selection.
  viewButton.className = 'quickViewBtn cycleView'; quick.append(viewButton);
  const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'quickViewBtn'; reset.textContent = copy.reset;
  reset.addEventListener('click', () => document.getElementById('resetBtn').click()); quick.append(reset);
  const status = document.querySelector('#hud .status');
  status.children[0].classList.add('speedCard'); status.children[1].classList.add('gearCard');
  document.getElementById('miniMap').removeAttribute('aria-hidden');
  document.getElementById('miniMap').tabIndex = 0;
  document.getElementById('miniMap').setAttribute('role', 'button');
  document.getElementById('miniMap').setAttribute('aria-label', copy.hint);
  document.getElementById('miniMap').addEventListener('keydown', e => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.currentTarget.classList.contains('expanded')) e.currentTarget.click(); }
    if (e.key === 'Escape') document.getElementById('miniMapClose').click();
  });
}

// Copy each auxiliary view into a canvas INSIDE its clipping element. The shared
// WebGL renderer is reused; CSS now clips the actual image, including during resize.
export function createInsetRenderer(renderer) {
  const surfaces = new WeakMap();
  return function renderInset(container, scene, camera) {
    const width = container.clientWidth, height = container.clientHeight;
    if (width < 2 || height < 2) return;
    let surface = surfaces.get(container);
    if (!surface) {
      const canvas = document.createElement('canvas'); canvas.className = 'insetCanvas'; canvas.setAttribute('aria-hidden', 'true');
      container.prepend(canvas); surface = { canvas, ctx: canvas.getContext('2d', { alpha: false }) }; surfaces.set(container, surface);
    }
    const ratio = renderer.getPixelRatio();
    const w = Math.min(Math.floor(width * ratio), renderer.domElement.width);
    const h = Math.min(Math.floor(height * ratio), renderer.domElement.height);
    if (surface.canvas.width !== w || surface.canvas.height !== h) { surface.canvas.width = w; surface.canvas.height = h; }
    renderer.setScissorTest(true); renderer.setViewport(0, 0, w / ratio, h / ratio); renderer.setScissor(0, 0, w / ratio, h / ratio);
    renderer.render(scene, camera);
    surface.ctx.drawImage(renderer.domElement, 0, renderer.domElement.height - h, w, h, 0, 0, w, h);
    renderer.setScissorTest(false);
  };
}

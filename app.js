/* ════════════════════════════════════════════════════════════
   Fitness Tracker v4.5 — app.js
   Smart fields per exercise type + single-line row layout
   ════════════════════════════════════════════════════════════ */

'use strict';

const STATE = {
  program: window.PROGRAM_DATA || null,
  userEdits: {},
  healthData: [],
  weeklyMetrics: (window.PROGRAM_DATA && window.PROGRAM_DATA.weekly_metrics) || [],
  settings: { gistId: '', gistToken: '' }
};

const STORAGE_KEY = 'fitness_v4_state';
const TODAY = new Date();
const TODAY_DAY_NUM = 1; // (Math.floor((TODAY - new Date(2026, 5, 21)) / 86400000) % 5) + 1;

document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  if (!STATE.program) {
    showToast('⚠️ تعذّر تحميل البيانات', 'error', 4000);
  }
});

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      STATE.userEdits = s.userEdits || {};
      STATE.healthData = s.healthData || [];
      STATE.weeklyMetrics = s.weeklyMetrics || STATE.weeklyMetrics;
      STATE.settings = s.settings || { gistId: '', gistToken: '' };
    }
  } catch (e) { console.error('loadFromStorage failed', e); }
}

let saveTimer = null;
function saveToStorage() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      userEdits: STATE.userEdits,
      healthData: STATE.healthData,
      weeklyMetrics: STATE.weeklyMetrics,
      settings: STATE.settings,
      updated_at: new Date().toISOString()
    }));
    if (STATE.settings.gistToken && STATE.settings.gistId) debouncedGistSync();
  }, 300);
}

let gistTimer = null;
function debouncedGistSync() {
  clearTimeout(gistTimer);
  gistTimer = setTimeout(syncToGist, 1500);
}

async function syncToGist() {
  const { gistId, gistToken } = STATE.settings;
  if (!gistId || !gistToken) return;
  try {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${gistToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: { 'fitness-data.json': { content: JSON.stringify({
        userEdits: STATE.userEdits,
        healthData: STATE.healthData,
        weeklyMetrics: STATE.weeklyMetrics,
        updated_at: new Date().toISOString()
      }, null, 2) } } })
    });
  } catch (e) { console.warn('Gist sync failed', e); }
}

async function testGist() {
  const { gistId, gistToken } = STATE.settings;
  if (!gistId || !gistToken) {
    showToast('أدخل Gist ID و Token أولاً', 'error');
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { 'Authorization': `Bearer ${gistToken}` }
    });
    document.getElementById('gist-status').innerHTML = res.ok
      ? '<span style="color:var(--t-green)">✅ Gist متصل بنجاح</span>'
      : `<span style="color:var(--t-red)">❌ فشل: ${res.status}</span>`;
  } catch (e) {
    document.getElementById('gist-status').innerHTML = `<span style="color:var(--t-red)">❌ ${e.message}</span>`;
  }
}

// ════════════════════════════════════════════════════════════
//  SMART FIELD RENDERER
//  Returns inputs group based on exercise.type and exercise.fields
// ════════════════════════════════════════════════════════════
function renderSmartFields(day, phase, ex, idx) {
  const base = `d${day.day_num}.${phase.name}.${idx}`;
  const fields = ex.fields || ['time'];

  // Resistance: 3 sessions × (weight + reps) — VERTICAL mini-table
  if (ex.type === 'resistance' && fields.includes('weight')) {
    return renderResistanceFields(base, ex);
  }
  // HIIT: rounds + hr_max — 2 cells
  if (ex.type === 'hiit') {
    return renderHIITFields(base, ex);
  }
  // Cardio: time + hr
  if (ex.type === 'cardio' || ex.type === 'cardio_long') {
    return renderCardioFields(base, ex);
  }
  // Default: time only
  return renderTimeField(base, ex);
}

function renderResistanceFields(base, ex) {
  const sets = ['S1', 'S2', 'S3'];
  return `
    <div class="ex-sets-inline" role="group" aria-label="3 جلسات في صف واحد">
      ${sets.map((s, i) => {
        const w = STATE.userEdits[`${base}.${s}.w`] || '';
        const r = STATE.userEdits[`${base}.${s}.r`] || '';
        return `
          <div class="ex-set-pair">
            <input type="number" inputmode="decimal" class="cell-mini ${w ? '' : 'empty'}" placeholder="kg"
                   value="${w}" aria-label="الجلسة ${i+1} الوزن"
                   data-set="${s}" data-field="w"
                   oninput="onCellEdit('${base}.${s}.w', this.value)" />
            <span class="cell-x">×</span>
            <input type="number" inputmode="numeric" class="cell-mini ${r ? '' : 'empty'}" placeholder="rep"
                   value="${r}" aria-label="الجلسة ${i+1} العدّات"
                   data-set="${s}" data-field="r"
                   oninput="onCellEdit('${base}.${s}.r', this.value)" />
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderHIITFields(base, ex) {
  const r = STATE.userEdits[`${base}.rounds`] || '';
  const hr = STATE.userEdits[`${base}.hr_max`] || '';
  return `
    <div class="ex-inputs">
      <input type="number" inputmode="numeric" class="cell ${r ? '' : 'empty'}" placeholder="جولات"
             value="${r}" aria-label="عدد الجولات"
             oninput="onCellEdit('${base}.rounds', this.value)" />
      <input type="number" inputmode="numeric" class="cell ${hr ? '' : 'empty'}" placeholder="HR max"
             value="${hr}" aria-label="أعلى نبضة"
             oninput="onCellEdit('${base}.hr_max', this.value)" />
    </div>
  `;
}

function renderCardioFields(base, ex) {
  const t = STATE.userEdits[`${base}.time`] || '';
  const hr = STATE.userEdits[`${base}.hr`] || '';
  const cal = STATE.userEdits[`${base}.cal`] || '';
  return `
    <div class="ex-inputs">
      <input type="number" inputmode="decimal" class="cell ${t ? '' : 'empty'}" placeholder="دقيقة"
             value="${t}" aria-label="الوقت بالدقيقة"
             oninput="onCellEdit('${base}.time', this.value)" />
      <input type="number" inputmode="numeric" class="cell ${hr ? '' : 'empty'}" placeholder="HR"
             value="${hr}" aria-label="متوسط النبض"
             oninput="onCellEdit('${base}.hr', this.value)" />
      ${ex.type === 'cardio_long' ? `
      <input type="number" inputmode="numeric" class="cell ${cal ? '' : 'empty'}" placeholder="سعرة"
             value="${cal}" aria-label="السعرات"
             oninput="onCellEdit('${base}.cal', this.value)" />` : ''}
    </div>
  `;
}

function renderTimeField(base, ex) {
  const t = STATE.userEdits[`${base}.time`] || '';
  return `
    <div class="ex-inputs">
      <input type="number" inputmode="decimal" class="cell ${t ? '' : 'empty'}" placeholder="دقيقة"
             value="${t}" aria-label="الوقت بالدقيقة"
             oninput="onCellEdit('${base}.time', this.value)" />
    </div>
  `;
}

function onCellEdit(key, value) {
  if (value === '' || value === null) delete STATE.userEdits[key];
  else STATE.userEdits[key] = value;
  saveToStorage();
}

function phaseColor(name) {
  if (name.includes('warmup')) return 'mint';
  if (name.includes('resistance_a')) return 'blue';
  if (name.includes('resistance_b')) return 'amber';
  if (name.includes('hiit') || name.includes('cardio_main')) return 'red';
  if (name.includes('cardio')) return 'purple';
  if (name.includes('mobility') || name.includes('core')) return 'green';
  if (name.includes('cooldown')) return 'mint';
  return 'mint';
}

// ════════════════════════════════════════════════════════════
//  PAGE 1: PROGRAM (read-only)
// ════════════════════════════════════════════════════════════
function initProgramPage() {
  const c = document.getElementById('program-days');
  if (!c || !STATE.program) {
    if (c) c.innerHTML = '<div class="empty-state"><div class="icon">📖</div><div class="msg">لا توجد بيانات</div></div>';
    return;
  }
  c.innerHTML = STATE.program.days.map(d => renderProgramDay(d)).join('');
  c.querySelector('.day-card')?.classList.add('open');
}

function renderProgramDay(day) {
  // Calculate total exercises
  const totalEx = day.phases.reduce((sum, p) => sum + p.exercises.length, 0);
  // Get first non-empty phase for "focus" label
  const focusPhase = day.phases.find(p => p.exercises.length > 0);
  const focusLabel = focusPhase ? focusPhase.label.split(' ').slice(0, 2).join(' ') : '';
  return `
    <div class="day-card d-${day.color}">
      <button class="day-toggle" onclick="this.parentElement.classList.toggle('open')" aria-expanded="false">
        <span class="num">${day.day_num}</span>
        <span class="label">
          <span class="title">${day.title}</span>
          <span class="desc">${day.description}</span>
          <span class="stats">${totalEx} تمارين · ${day.duration} · ${focusLabel}</span>
        </span>
        <span class="chevron">▼</span>
      </button>
      <div class="day-body"><div class="day-body-inner">
        ${day.phases.map(phase => renderProgramPhase(phase)).join('')}
      </div></div>
    </div>
  `;
}

function renderProgramPhase(phase) {
  return `
    <h3 class="section-h section-${phase.name}"><span class="bar"></span>${phase.label} <span class="count">${phase.exercises.length} عنصر</span></h3>
    ${phase.exercises.map(ex => `
      <div class="ex-row">
        <div class="ex-info">
          <span class="ex-name">${ex.name}</span>
          <span class="ex-en">${ex.en}</span>
        </div>
        <div class="ex-actions">
          <span class="ex-default">${ex.default || ex.sets || ''}</span>
          ${ex.video ? `<a class="ex-video-link" href="${ex.video}" target="_blank" rel="noopener" aria-label="شاهد فيديو ${ex.name}">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>فيديو
          </a>` : ''}
        </div>
      </div>
    `).join('')}
  `;
}

// ════════════════════════════════════════════════════════════
//  PAGE 2: TRACKER
// ════════════════════════════════════════════════════════════
function initTrackerPage() {
  renderDaySelector();
  renderTrackerDay(TODAY_DAY_NUM);
  updateProgress();
  document.getElementById('btn-export-md')?.addEventListener('click', exportMarkdown);
  document.getElementById('btn-save-now')?.addEventListener('click', () => {
    saveToStorage();
    syncToGist();
    showToast('💾 تم الحفظ');
  });
}

function renderDaySelector() {
  const sel = document.getElementById('day-selector');
  if (!sel || !STATE.program) return;
  sel.innerHTML = STATE.program.days.map(d => `
    <button class="day-pill d-${d.color}" data-day="${d.day_num}" aria-label="يوم ${d.day_num}">
      <span class="num">${d.day_num}</span>
      <span class="name">يوم ${d.day_num}</span>
    </button>
  `).join('');
  sel.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      sel.querySelectorAll('button').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      renderTrackerDay(parseInt(btn.dataset.day));
      updateProgress();
    });
  });
  const todayBtn = sel.querySelector(`[data-day="${TODAY_DAY_NUM}"]`);
  if (todayBtn) {
    sel.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    todayBtn.classList.add('active');
  }
}

function renderTrackerDay(dayNum) {
  const day = STATE.program.days.find(d => d.day_num === dayNum);
  const c = document.getElementById('tracker-content');
  if (!day || !c) return;
  c.innerHTML = `
    <div class="day-card d-${day.color} open">
      <button class="day-toggle" onclick="this.parentElement.classList.toggle('open')" aria-expanded="true">
        <span class="num">${day.day_num}</span>
        <span class="label">
          <span class="title">${day.title}</span>
          <span class="desc">${day.description} · ${day.duration}</span>
        </span>
        <span class="chevron">▼</span>
      </button>
      <div class="day-body"><div class="day-body-inner">
        ${day.phases.map(phase => renderTrackerPhase(day, phase)).join('')}
      </div></div>
    </div>
  `;
}

function renderTrackerPhase(day, phase) {
  return `
    <h3 class="section-h section-${phase.name}"><span class="bar"></span>${phase.label} <span class="count">${phase.exercises.length}</span></h3>
    ${phase.exercises.map((ex, idx) => renderTrackerExercise(day, phase, ex, idx)).join('')}
  `;
}

function renderTrackerExercise(day, phase, ex, idx) {
  const base = `d${day.day_num}.${phase.name}.${idx}`;
  const done = STATE.userEdits[`${base}.done`] === '1';
  const isResistance = ex.type === 'resistance';

  return `
    <div class="ex-row ${done ? 'is-done' : ''}" data-base="${base}">
      <label class="ex-check" aria-label="تم إنهاء ${ex.name}">
        <input type="checkbox" ${done ? 'checked' : ''}
               onchange="onExerciseToggle('${base}', this.checked)" />
        <span class="check-circle" aria-hidden="true">${done ? '✓' : ''}</span>
      </label>
      <span class="ex-num">${idx + 1}</span>
      <div class="ex-info">
        <span class="ex-name">${ex.name}</span>
        <span class="ex-default">${ex.default || ''}</span>
      </div>
      ${isResistance ? renderResistanceFields(base, ex) : ''}
    </div>
  `;
}

function onExerciseToggle(base, checked) {
  if (checked) STATE.userEdits[`${base}.done`] = '1';
  else delete STATE.userEdits[`${base}.done`];
  // Toggle visual class
  const row = document.querySelector(`[data-base="${base}"]`);
  if (row) row.classList.toggle('is-done', checked);
  saveToStorage();
  updateProgress();
}

function updateProgress() {
  const activeDay = parseInt(document.querySelector('.day-pill.active')?.dataset.day || TODAY_DAY_NUM);
  const day = STATE.program?.days?.find(d => d.day_num === activeDay);
  if (!day) return;
  let total = 0, done = 0;
  day.phases.forEach(phase => {
    phase.exercises.forEach((_, idx) => {
      const base = `d${day.day_num}.${phase.name}.${idx}`;
      total++;
      if (STATE.userEdits[`${base}.done`] === '1') done++;
    });
  });
  const pct = total ? Math.round((done / total) * 100) : 0;
  const counter = document.getElementById('progress-counter');
  if (counter) counter.textContent = `${done} / ${total}  (${pct}%)`;
  // Highlight next exercise
  document.querySelectorAll('.ex-row.is-next').forEach(r => r.classList.remove('is-next'));
  const nextRow = Array.from(document.querySelectorAll('.ex-row')).find(r => !r.classList.contains('is-done'));
  if (nextRow) nextRow.classList.add('is-next');
}

function exportMarkdown() {
  const activeDay = parseInt(document.querySelector('.day-pill.active')?.dataset.day || TODAY_DAY_NUM);
  const day = STATE.program.days.find(d => d.day_num === activeDay);
  let md = `# 🏋️ ${day.title} — ${new Date().toISOString().slice(0, 10)}\n\n`;
  day.phases.forEach(phase => {
    md += `## ${phase.label}\n\n`;
    phase.exercises.forEach((ex, i) => {
      const base = `d${day.day_num}.${phase.name}.${i}`;
      if (ex.type === 'resistance') {
        const sessions = ['S1', 'S2', 'S3'].map(s => {
          const w = STATE.userEdits[`${base}.${s}.w`] || '—';
          const r = STATE.userEdits[`${base}.${s}.r`] || '—';
          return `${w}كجم×${r}`;
        }).join(' / ');
        md += `- **${ex.name}**: ${sessions}\n`;
      } else if (ex.type === 'hiit') {
        const r = STATE.userEdits[`${base}.rounds`] || '—';
        const hr = STATE.userEdits[`${base}.hr_max`] || '—';
        md += `- **${ex.name}**: ${r} جولات · ${hr} نبضة\n`;
      } else if (ex.type === 'cardio' || ex.type === 'cardio_long') {
        const t = STATE.userEdits[`${base}.time`] || '—';
        const hr = STATE.userEdits[`${base}.hr`] || '—';
        const cal = STATE.userEdits[`${base}.cal`] || '';
        md += `- **${ex.name}**: ${t} د · ${hr} نبضة${cal ? ' · ' + cal + ' سعرة' : ''}\n`;
      } else {
        const t = STATE.userEdits[`${base}.time`] || '—';
        md += `- **${ex.name}**: ${t} د\n`;
      }
    });
    md += '\n';
  });
  navigator.clipboard.writeText(md).then(() => showToast('📋 تم نسخ Markdown'));
}

// ════════════════════════════════════════════════════════════
//  PAGE 3: HEALTH
// ════════════════════════════════════════════════════════════
function initHealthPage() {
  renderHealthCards();
  renderInBodyTable();
  renderCharts();
}

function renderHealthCards() {
  const grid = document.getElementById('stats-grid');
  if (!grid || !STATE.program) return;
  const metrics = STATE.program.health_metrics;
  const dataMap = {};
  STATE.healthData.forEach(h => { dataMap[h.key] = h.value; });
  const baseline = {
    weight: 84.2, muscle_mass: 33.1, fat_pct: 30.0,
    bmi: 30.2, vo2max: 28.4, resting_hr: 72
  };

  grid.innerHTML = metrics.map(m => {
    const v = dataMap[m.key] ?? baseline[m.key] ?? '—';
    const colorClass = 'c-' + (m.color || 'teal');
    return `
      <div class="stat-card ${colorClass}">
        <div>
          <div class="v">${v}</div>
          <div class="l">${m.label}</div>
        </div>
        <div class="u">${m.unit}</div>
      </div>
    `;
  }).join('');
}

function renderInBodyTable() {
  const tbl = document.getElementById('inbody-table');
  if (!tbl || !STATE.program) return;
  const w = STATE.weeklyMetrics;

  tbl.innerHTML = `
    <thead>
      <tr>
        <th>المؤشر</th>
        ${w.map(m => `<th>أ${m.week}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${renderInBodyRow('الوزن (كجم)', 'weight', w)}
      ${renderInBodyRow('الكتلة العضلية (كجم)', 'muscle_mass', w)}
      ${renderInBodyRow('نسبة الدهون %', 'fat_pct', w)}
      ${renderInBodyRow('BMI', 'bmi', w)}
      ${renderInBodyRow('VO₂max', 'vo2max', w)}
      ${renderInBodyRow('نبض الراحة', 'resting_hr', w)}
    </tbody>
  `;
}

function renderInBodyRow(label, key, w) {
  return `
    <tr class="${w[0][key] ? 'baseline' : ''}">
      <td>${label}</td>
      ${w.map((m, i) => `
        <td>
          <input type="number" step="0.1" inputmode="decimal" class="in-cell ${m[key] ? '' : 'empty'}" placeholder="—"
                 value="${m[key] ?? ''}" aria-label="${label} أسبوع ${m.week}"
                 oninput="onInBodyEdit('${key}', ${i}, this.value)" />
        </td>
      `).join('')}
    </tr>
  `;
}

function onInBodyEdit(key, weekIdx, value) {
  if (!STATE.weeklyMetrics[weekIdx]) return;
  STATE.weeklyMetrics[weekIdx][key] = value === '' ? null : parseFloat(value);
  saveToStorage();
  renderCharts();
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;
  const w = STATE.weeklyMetrics || [];
  const labels = w.map(m => `أ${m.week}`);

  const c1 = document.getElementById('chart-weight-muscle');
  if (c1 && !c1._chart) {
    c1._chart = new Chart(c1, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'الوزن', data: w.map(m => m.weight), borderColor: '#0D6B6E', backgroundColor: 'rgba(13,107,110,0.12)', tension: 0.3, spanGaps: true, pointRadius: 4 },
          { label: 'الكتلة العضلية', data: w.map(m => m.muscle_mass), borderColor: '#C8952C', backgroundColor: 'rgba(200,149,44,0.12)', tension: 0.3, spanGaps: true, pointRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
  const c2 = document.getElementById('chart-fat-bmi');
  if (c2 && !c2._chart) {
    c2._chart = new Chart(c2, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'دهون %', data: w.map(m => m.fat_pct), borderColor: '#bf0013', backgroundColor: 'rgba(191,0,19,0.12)', tension: 0.3, spanGaps: true, pointRadius: 4, yAxisID: 'y' },
          { label: 'BMI', data: w.map(m => m.bmi), borderColor: '#6a3eb1', backgroundColor: 'rgba(106,62,177,0.12)', tension: 0.3, spanGaps: true, pointRadius: 4, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { type: 'linear', position: 'right', title: { display: true, text: 'دهون %' } },
          y1: { type: 'linear', position: 'left', title: { display: true, text: 'BMI' }, grid: { drawOnChartArea: false } }
        }
      }
    });
  }
  const c3 = document.getElementById('chart-vo2');
  if (c3 && !c3._chart) {
    c3._chart = new Chart(c3, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'VO₂max', data: w.map(m => m.vo2max),
          borderColor: '#00873a', backgroundColor: 'rgba(0,135,58,0.18)',
          tension: 0.3, fill: true, spanGaps: true, pointRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { title: { display: true, text: 'ml/kg/min' } } }
      }
    });
  }
}

// ════════════════════════════════════════════════════════════
//  PAGE 4: SETTINGS
// ════════════════════════════════════════════════════════════
function initSettingsPage() {
  document.getElementById('gist-id').value = STATE.settings.gistId || '';
  document.getElementById('gist-token').value = STATE.settings.gistToken || '';
  document.getElementById('btn-gist-save')?.addEventListener('click', () => {
    STATE.settings.gistId = document.getElementById('gist-id').value.trim();
    STATE.settings.gistToken = document.getElementById('gist-token').value.trim();
    saveToStorage();
    showToast('✅ تم حفظ الإعدادات');
    generateQR();
    renderStatsSummary();
  });
  document.getElementById('btn-gist-test')?.addEventListener('click', testGist);
  document.getElementById('btn-export-json')?.addEventListener('click', exportJSON);
  document.getElementById('btn-import-json')?.addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file')?.addEventListener('change', importJSON);
  document.getElementById('btn-reset')?.addEventListener('click', resetAll);
  generateQR();
  renderStatsSummary();
}

function renderStatsSummary() {
  const el = document.getElementById('stats-summary');
  if (!el) return;
  const editCount = Object.keys(STATE.userEdits).length;
  const healthCount = STATE.healthData.length;
  const weekCount = STATE.weeklyMetrics.filter(m => m.weight || m.muscle_mass).length;
  el.innerHTML = `
    📊 <strong>${editCount}</strong> خلية مُعدَّلة<br>
    🫀 <strong>${healthCount}</strong> مؤشر صحي<br>
    🧬 <strong>${weekCount}</strong> أسبوع InBody<br>
    💾 آخر حفظ: <strong>${new Date().toLocaleString('ar-SA')}</strong>
  `;
}

function generateQR() {
  const area = document.getElementById('qr-area');
  if (!area) return;
  const { gistId, gistToken } = STATE.settings;
  if (!gistId || !gistToken) {
    area.innerHTML = '<p style="color:var(--t-mute);font-size:0.78rem">احفظ الإعدادات أولاً</p>';
    return;
  }
  const data = encodeURIComponent(JSON.stringify({ gistId, gistToken }));
  const url = `https://chart.googleapis.com/chart?chs=180x180&cht=qr&chl=${data}`;
  area.innerHTML = `
    <img src="${url}" alt="QR" />
    <p style="font-size:0.68rem;color:var(--t-mute)">امسح من الجوال لإعدادات Gist</p>
  `;
}

function exportJSON() {
  const payload = {
    userEdits: STATE.userEdits,
    healthData: STATE.healthData,
    weeklyMetrics: STATE.weeklyMetrics,
    exported_at: new Date().toISOString()
  };
  download('fitness-data-' + Date.now() + '.json', JSON.stringify(payload, null, 2));
  showToast('📤 تم التصدير');
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (confirm('استيراد البيانات؟ سيحل محل الحالي.')) {
        STATE.userEdits = data.userEdits || {};
        STATE.healthData = data.healthData || [];
        STATE.weeklyMetrics = data.weeklyMetrics || STATE.weeklyMetrics;
        saveToStorage();
        renderStatsSummary();
        showToast('📥 تم الاستيراد');
      }
    } catch (err) {
      showToast('❌ ملف غير صالح', 'error');
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm('⚠️ حذف كامل البيانات المحلية؟ لا يمكن التراجع.')) return;
  if (!confirm('تأكيد نهائي: فعلاً حذف؟')) return;
  localStorage.removeItem(STORAGE_KEY);
  STATE.userEdits = {};
  STATE.healthData = [];
  STATE.weeklyMetrics = STATE.program?.weekly_metrics || [];
  renderStatsSummary();
  showToast('🗑️ تم الحذف');
}

function showToast(msg, type = 'info', duration = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ════════════════════════════════════════════════════════════════════════════
//  UNIFIED APP (personal_trainer.html) — single page, 4 sections
//  يُستبدل initProgramPage / initTrackerPage / initHealthPage / initSettingsPage
// ════════════════════════════════════════════════════════════════════════════
const HERO_META = {
  program: {
    title: 'البرنامج التدريبي',
    sub: 'شرح كامل + فيديوهات + تفاصيل كل تمرين',
    meta: '📅 5 أيام · 🏋️ 36 تمرين · ⏱️ 55-60 د/يوم'
  },
  tracker: {
    title: 'المتابعة اليومية',
    sub: 'سجّل أوزان المقاومة وتقدّم في التمارين',
    meta: '✅ شطب عند الإنجاز · 💾 حفظ تلقائي'
  },
  health: {
    title: 'المتابعة الصحية',
    sub: '6 مؤشرات + InBody شهري + 3 رسوم بيانية',
    meta: '📊 6 مؤشرات · 🧬 12 أسبوع · 📈 3 رسوم'
  },
  settings: {
    title: 'الإعدادات',
    sub: 'Gist · مزامنة · نسخ احتياطي · إعادة تعيين',
    meta: '☁️ GitHub Gist · 📤 JSON · 📱 QR'
  }
};

function updateHero(section) {
  const h = HERO_META[section];
  if (!h) return;
  document.getElementById('hero-title').textContent = h.title;
  document.getElementById('hero-sub').textContent = h.sub;
  // hero-meta: tracker يحوي progress-counter span بدلاً من meta ثابت
  const metaEl = document.getElementById('hero-meta');
  if (section === 'tracker') {
    // الـ progress-counter سيُملأ لاحقاً من updateProgress()
    metaEl.innerHTML = '<span class="meta-item" id="progress-counter">0 / 0  (0%)</span><span class="dot"></span><span class="meta-item"><span>✅ شطب عند الإنجاز</span></span>';
  } else {
    metaEl.innerHTML = h.meta.split(' · ').map((part, i) => {
      const dot = i > 0 ? '<span class="dot"></span>' : '';
      return `${dot}<span class="meta-item"><span>${part}</span></span>`;
    }).join('');
  }
}

function showSection(section) {
  // إخفاء كل الـ sections، إظهار المطلوب فقط
  document.querySelectorAll('section[data-section]').forEach(s => {
    s.hidden = s.dataset.section !== section;
  });
  // تحديث bottom-bar
  document.querySelectorAll('.bottom-bar a').forEach(a => {
    a.classList.toggle('active', a.dataset.nav === section);
  });
  // تحديث hero
  updateHero(section);
  // scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPersonalTrainer(section) {
  if (!section) section = 'program';
  // Hero أولاً (قبل الرسم حتى لا يلمع)
  showSection(section);

  // استدعاء init المناسب — كل init*Page() الحالية تعمل كما هي
  switch (section) {
    case 'program':
      initProgramPage();
      break;
    case 'tracker':
      initTrackerPage();
      break;
    case 'health':
      initHealthPage();
      break;
    case 'settings':
      initSettingsPage();
      break;
  }
}

// bottom-bar click handlers — يحدّث الـ hash (يدعم back/forward)
document.querySelector('.bottom-bar')?.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-nav]');
  if (!a) return;
  e.preventDefault();
  const target = a.dataset.nav;
  if (location.hash !== '#' + target) {
    location.hash = '#' + target;
  } else {
    // نفس الـ hash — أعد init لتحديث البيانات
    initPersonalTrainer(target);
  }
});

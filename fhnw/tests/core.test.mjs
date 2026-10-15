// Unit tests for the EPL core (data + domain logic + store), extracted from the deliverable index.html.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';


const HTML = process.env.EPL_HTML || fileURLToPath(new URL('../index.html', import.meta.url));
const src = readFileSync(HTML, 'utf8').match(/<script id="epl-core">([\s\S]*?)<\/script>/)[1];

new Function(src)(); // same realm, so deepEqual compares plain prototypes
const E = globalThis.EPL;
const approx = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} ≠ ${b}`);

class MemStorage { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }

/* ---------- process data validation ---------- */
test('all IST processes are valid (ids, roles, stages, connections, findings)', () => {
  for (const p of E.PROCESSES) assert.deepEqual(E.validateProcess(p), [], p.id);
});
test('generated SOLL process is valid for every option combination', () => {
  const keys = E.TARGET_STAGES.filter(t => t.key);
  const combos = keys.reduce((acc, t) => acc.flatMap(c => t.options.map(o => ({ ...c, [t.key]: o.id }))), [{}]);
  assert.equal(combos.length, 3 * 2 * 2 * 3);
  for (const c of combos) {
    const all = { ...c, variants: { motivation: true, aptitude: true, interview: true, surDossier: true } };
    for (const cfg of [c, all]) assert.deepEqual(E.validateProcess(E.buildTargetProcess(cfg), { requireFindings: false }), [], JSON.stringify(cfg));
  }
});
test('validation catches broken data', () => {
  const p = JSON.parse(JSON.stringify(E.getProcess('alpha')));
  p.steps[1].role = 'nobody';
  p.steps[2].procMin = -5;
  p.steps[3].mediaBreak = true; p.steps[3].findings = []; // flag without observation
  p.connections.push({ from: 'A-01', to: 'X-99' });
  const errs = E.validateProcess(p);
  assert.ok(errs.some(e => e.includes('unbekannte Rolle')));
  assert.ok(errs.some(e => e.includes('≥ 0')));
  assert.ok(errs.some(e => e.includes('ohne Beobachtung')));
  assert.ok(errs.some(e => e.includes('unbekannter Knoten')));
});

/* ---------- metric calculations ---------- */
test('processing time = Σ procMin × probability over activities', () => {
  for (const p of E.PROCESSES) {
    const exp = p.steps.filter(E.isActivity).reduce((a, s) => a + s.procMin * s.probability, 0);
    approx(E.computeMetrics(p.steps).procMin, Math.round(exp * 10) / 10, p.id);
  }
  // Alpha by hand: 35+10+25+15*0.4+30+15+10 = 131
  assert.equal(E.computeMetrics(E.getProcess('alpha').steps).procMin, 131);
});
test('waiting time = Σ waitDays × probability; lead time adds processing in workdays', () => {
  const m = E.computeMetrics(E.getProcess('alpha').steps); // 0+1+3+5*0.4+6+2+1 = 15
  assert.equal(m.waitDays, 15);
  approx(m.leadDays, Math.round((15 + 131 / 480) * 100) / 100, 'lead');
  assert.equal(E.computeMetrics(E.getProcess('beta').steps).waitDays, 7.6); // 2*0.3+6+1
});
test('media breaks, manual steps, handoffs and digital share are counted from step data', () => {
  const g = E.computeMetrics(E.getProcess('gamma').steps);
  assert.equal(g.mediaBreaks, 3);
  assert.equal(g.manual, 4);
  assert.equal(g.handoffs, 3);   // applicant → admin → lead → admin
  approx(g.digitalShare, 0.333, 'digital share');
  const b = E.computeMetrics(E.getProcess('beta').steps);
  assert.equal(b.mediaBreaks, 1);
  assert.equal(b.handoffs, 3, 'system steps are not handoffs');
});
test('events and gateways are not counted as activities', () => {
  const a = E.getProcess('alpha').steps;
  assert.equal(E.computeMetrics(a).activities, a.length - 3); // start, end, gateway
});

/* ---------- IST / SOLL comparison & variants ---------- */
test('IST vs SOLL comparison is derived from both metric sets', () => {
  const before = E.baselineMetrics('avg'), after = E.computeMetrics(E.buildTargetProcess().steps);
  const cmp = E.compareMetrics(before, after);
  const lead = cmp.find(c => c.key === 'leadDays');
  approx(lead.delta, Math.round((after.leadDays - before.leadDays) * 100) / 100, 'delta');
  assert.equal(lead.improved, after.leadDays < before.leadDays);
  assert.equal(cmp.find(c => c.key === 'digitalShare').improved, after.digitalShare > before.digitalShare);
  assert.equal(cmp.length, E.KPIS.length);
});
test('average baseline is the mean of the three schools', () => {
  const ms = E.PROCESSES.map(p => E.computeMetrics(p.steps));
  approx(E.baselineMetrics('avg').waitDays, Math.round((ms[0].waitDays + ms[1].waitDays + ms[2].waitDays) / 3 * 100) / 100, 'avg');
});
test('choosing a different option changes the computed metrics', () => {
  const manual = E.computeMetrics(E.buildTargetProcess({ completeness: 'manual' }).steps);
  const auto = E.computeMetrics(E.buildTargetProcess({ completeness: 'auto' }).steps);
  assert.ok(manual.manual > auto.manual);
  assert.ok(manual.procMin > auto.procMin);
  const email = E.computeMetrics(E.buildTargetProcess({ assignment: 'email' }).steps);
  assert.equal(email.mediaBreaks, 1);
  assert.equal(E.computeMetrics(E.buildTargetProcess({ assignment: 'queue' }).steps).mediaBreaks, 0);
  const doc = E.computeMetrics(E.buildTargetProcess({ decision: 'document' }).steps);
  assert.equal(doc.duplicates, 1);
});
test('optionImpacts holds other choices constant', () => {
  const imp = E.optionImpacts({ completeness: 'manual' }, 'communication');
  assert.deepEqual(imp.map(i => i.id), ['manual', 'template', 'auto']);
  assert.equal(imp[2].metrics.leadDays < imp[0].metrics.leadDays, true);
  for (const i of imp) assert.equal(i.metrics.manual >= 2, true, 'completeness stays manual');
});
test('activating variants adds their steps and time; core is unaffected', () => {
  const base = E.variantCost({});
  assert.equal(base.addedSteps, 0);
  const vc = E.variantCost({ variants: { interview: true, surDossier: true } });
  assert.equal(vc.addedSteps, 2);
  approx(vc.addedWaitDays, 7 + 3 * 0.25, 'wait');
  approx(vc.addedProcMin, 45 + 30 * 0.25, 'proc');
  assert.deepEqual(vc.core, base.core);
  const t = E.buildTargetProcess({ variants: { aptitude: true } });
  assert.ok(t.steps.some(s => s.id === 'V-APT-1' && s.stage === 'admission'));
});
test('invalid target config falls back to defaults', () => {
  const c = E.normalizeTarget({ completeness: 'teleport', variants: { interview: true } });
  assert.equal(c.completeness, E.DEFAULT_TARGET.completeness);
  assert.equal(c.variants.interview, true);
  assert.equal(c.variants.aptitude, false);
});

/* ---------- requirements & change evaluation ---------- */
test('requirement ranking follows WSJF and reacts to overrides', () => {
  const r = E.rankRequirements();
  assert.equal(r[0].id, 'REQ-007'); // (3+4+4)/1
  assert.equal(r[0].score, 11);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
  const r2 = E.rankRequirements({ 'REQ-006': { effort: 1 } });
  assert.equal(r2[0].id, 'REQ-007');
  assert.equal(r2.find(x => x.id === 'REQ-006').score, 10);
});
test('change approach evaluation depends on context', () => {
  const none = E.evaluateChangeApproach({});
  assert.equal(none.find(o => o.id === 'C').score, 3);
  const mand = E.evaluateChangeApproach({ mandatory: true });
  assert.ok(mand.find(o => o.id === 'A').score > mand.find(o => o.id === 'B').score);
  const proven = E.evaluateChangeApproach({ proven: true });
  assert.ok(proven.find(o => o.id === 'B').score > proven.find(o => o.id === 'A').score);
});

/* ---------- workshop measures & flow ---------- */
test('applying a measure changes only targeted steps and is immutable', () => {
  const steps = E.getProcess('gamma').steps;
  const m = E.MEASURES.find(x => x.id === 'M-01');
  const out = E.applyMeasure(steps, m, ['C-03']);
  assert.equal(steps.find(s => s.id === 'C-03').mediaBreak, true, 'input untouched');
  const c3 = out.find(s => s.id === 'C-03');
  assert.equal(c3.mediaBreak, false);
  assert.equal(c3.duplicateEntry, false);
  assert.equal(c3.procMin, 12.5);
  assert.deepEqual(out.find(s => s.id === 'C-02'), steps.find(s => s.id === 'C-02'));
  const cons = E.applyMeasure(steps, m, ['C-03'], { conservative: true });
  assert.equal(cons.find(s => s.id === 'C-03').procMin, 18.8); // 25 × 0.75
});
test('full workshop flow: guards, outcome, summary and decision', () => {
  let ws = E.emptyWorkshop();
  ws = E.workshopReducer(ws, { type: 'next' });
  assert.equal(ws.step, 0, 'cannot advance without process');
  ws = E.workshopReducer(ws, { type: 'process', id: 'gamma' });
  ws = E.workshopReducer(ws, { type: 'next' });
  assert.equal(ws.step, 1);
  const finding = E.findingsFor(E.getProcess('gamma')).find(f => f.cat === 'mediaBreak');
  ws = E.workshopReducer(ws, { type: 'finding', key: finding.key });
  ws = E.workshopReducer(ws, { type: 'next' });
  ws = E.workshopReducer(ws, { type: 'next' });
  assert.equal(ws.step, 2, 'needs required');
  ws = E.workshopReducer(ws, { type: 'need', need: 'admin:Weniger manuelle Arbeit' });
  ws = E.workshopReducer(ws, { type: 'need', need: 'it:Einheitliche Schnittstellen' });
  ws = E.workshopReducer(ws, { type: 'need', need: 'it:Einheitliche Schnittstellen' }); // toggle off
  assert.deepEqual([...ws.needs], ['admin:Weniger manuelle Arbeit']);
  ws = E.workshopReducer(ws, { type: 'next' });
  const ms = E.measuresForFinding(finding);
  assert.ok(ms.length >= 2 && ms.every(m => m.categories.includes('mediaBreak')));
  ws = E.workshopReducer(ws, { type: 'measure', id: 'M-01' });
  ws = E.workshopReducer(ws, { type: 'next' });
  assert.equal(ws.step, 4);
  const o = E.workshopOutcome(ws);
  assert.equal(o.targets.length, 3, 'applies to all media-break steps');
  assert.equal(o.after.mediaBreaks, 0);
  assert.ok(o.after.leadDays < o.before.leadDays);
  const single = E.workshopOutcome({ ...ws, applyAll: false });
  assert.equal(single.after.mediaBreaks, 2);
  ws = E.workshopReducer(ws, { type: 'next' });
  ws = E.workshopReducer(ws, { type: 'next' });
  assert.equal(ws.step, 5, 'last step is final');
  ws = { ...ws, rationale: 'Grösster Hebel' };
  const sum = E.workshopSummary(ws);
  assert.equal(sum.process, 'Hochschule Gamma');
  assert.equal(sum.stakeholders[0].needs[0], 'Weniger manuelle Arbeit');
  assert.ok(sum.impacts.some(c => c.key === 'mediaBreaks' && c.after === 0));
  const dec = E.workshopDecision(ws, 'DEC-W01');
  assert.equal(dec.id, 'DEC-W01');
  assert.equal(dec.rationale, 'Grösster Hebel');
  ws = E.workshopReducer(ws, { type: 'goto', step: 1 });
  assert.equal(ws.step, 1, 'can jump back');
  ws = E.workshopReducer(ws, { type: 'goto', step: 4 });
  assert.equal(ws.step, 1, 'cannot jump forward');
  assert.deepEqual(E.workshopReducer(ws, { type: 'restart' }), E.emptyWorkshop());
});

/* ---------- persistence & reset ---------- */
test('store persists state to storage and restores it', () => {
  const st = new MemStorage();
  const s1 = E.createStore(st);
  s1.set({ school: 'beta', target: E.normalizeTarget({ completeness: 'auto', variants: { interview: true } }) });
  const s2 = E.createStore(st);
  assert.equal(s2.get().school, 'beta');
  assert.equal(s2.get().target.completeness, 'auto');
  assert.equal(s2.get().target.variants.interview, true);
});
test('reset restores default data and clears storage', () => {
  const st = new MemStorage();
  const s = E.createStore(st);
  let notified = null;
  s.subscribe((state, meta) => { notified = meta; });
  s.set({ school: 'gamma', extraDecisions: [{ id: 'DEC-W01' }], reqOverrides: { 'REQ-001': { effort: 1 } } });
  s.reset();
  assert.deepEqual(s.get(), E.defaultState());
  assert.equal(st.getItem(E.STORAGE_KEY), null);
  assert.equal(notified.reset, true);
  assert.deepEqual(E.createStore(st).get(), E.defaultState());
});
test('corrupt or outdated storage falls back to defaults; missing storage works in memory', () => {
  const st = new MemStorage();
  st.setItem(E.STORAGE_KEY, '{not json');
  assert.deepEqual(E.createStore(st).get(), E.defaultState());
  st.setItem(E.STORAGE_KEY, JSON.stringify({ version: 0, school: 'beta' }));
  assert.equal(E.createStore(st).get().school, 'alpha');
  st.setItem(E.STORAGE_KEY, JSON.stringify({ version: 1, school: 'nowhere', target: { completeness: 'x' } }));
  const s = E.createStore(st).get();
  assert.equal(s.school, 'alpha');
  assert.equal(s.target.completeness, 'partial');
  const mem = E.createStore(null);
  mem.set({ school: 'beta' });
  assert.equal(mem.get().school, 'beta');
});
test('decision edits overlay defaults without mutating fixtures', () => {
  const state = { ...E.defaultState(), decisionEdits: { 'DEC-002': { status: 'Agreed (simulated)', chosen: 'c' } }, extraDecisions: [{ id: 'DEC-W01', topic: 't', options: [], recommended: 'b', status: 'Requires validation', rationale: '' }] };
  const all = E.allDecisions(state);
  assert.equal(all.length, 4);
  assert.equal(all.find(d => d.id === 'DEC-002').status, 'Agreed (simulated)');
  assert.equal(E.DECISIONS.find(d => d.id === 'DEC-002').status, 'Requires validation');
});

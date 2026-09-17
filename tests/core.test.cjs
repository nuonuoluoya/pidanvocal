const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Player, initialPlayer } = require('../core/player');
const { SyncRecord } = require('../core/sync');
const { searchSentences } = require('../utils/contracts');
const sentence = (id, index, available = true) => ({ id, index, text: 'A Quiet Morning ' + id, audioId: available ? id : null, duration: available ? 5 : null, alignment: { status: available ? 'verified' : 'unmatched', reason: available ? null : '待校对' } });
const book = { bookId: 'b', buildId: 'build', textRevision: 'r' };
const chapter = { ...book, chapterId: 'c', chapterAudio: { status: 'available', duration: 20 }, sentences: [sentence('s1', 1), sentence('s2', 2, false), sentence('s3', 3)] };
function audio() { const a = { src: '', playbackRate: 1, currentTime: 0, plays: 0, destroyed: false, events: {}, play() { this.plays++; this.events.Play(); }, pause() { if (this.events.Pause)
        this.events.Pause(); }, stop() { }, destroy() { this.destroyed = true; }, seek(t) { this.currentTime = t; this.events.Seeked(); } }; for (const n of ['Canplay', 'Play', 'Pause', 'Ended', 'Error', 'TimeUpdate', 'Seeked'])
    a['on' + n] = fn => a.events[n] = fn; return a; }
const grant = { audioId: 'audio', url: 'https://audio.invalid/a.mp3', duration: 5, issuedAt: '2026-09-01T00:00:00Z', expiresAt: '2026-09-01T01:00:00Z' };
function setup(authorize = async () => grant) { const instances = []; const p = new Player(initialPlayer(), () => { const a = audio(); instances.push(a); return a; }, authorize); p.load(book, chapter); return { p, instances }; }
test('载入章节仅选中，不创建音频；未校对句子禁止播放', async () => { let requests = 0; const { p, instances } = setup(async () => { requests++; return grant; }); assert.equal(p.state.status, 'selected'); assert.equal(instances.length, 0); p.select(1); await p.start(); assert.equal(requests, 0); assert.equal(p.state.status, 'unavailable'); p.dispose(); });
test('暂停取消未完成的授权，迟到结果不会创建播放器', async () => { let resolve; const { p, instances } = setup(() => new Promise(r => resolve = r)); const job = p.start(); p.pause(); resolve(grant); await job; assert.equal(instances.length, 0); p.dispose(); });
test('后台暂停且回前台不自动恢复；循环与连播互斥', async () => { const { p, instances } = setup(); p.setLoop(true); p.setContinuous(true); assert.equal(p.state.loop, false); await p.start(); instances[0].events.Canplay(); assert.equal(p.state.status, 'playing'); p.setForeground(false); assert.equal(p.state.status, 'paused'); assert.equal(p.state.continuous, false); p.setForeground(true); assert.equal(instances[0].plays, 1); p.dispose(); });
test('章内连播遇到无音频句子停止，不跳过原文', async () => { const { p, instances } = setup(); p.setContinuous(true); await p.start(); instances[0].events.Canplay(); instances[0].events.Ended(); assert.equal(p.state.index, 1); assert.equal(p.state.status, 'unavailable'); assert.equal(instances.length, 1); p.dispose(); });
test('整章播放结束停止，不改变逐句阅读位置', async () => { const { p, instances } = setup(); p.select(2); p.chapterPlay(); await Promise.resolve(); instances[0].events.Canplay(); instances[0].events.Ended(); assert.equal(p.state.mode, 'chapter'); assert.equal(p.state.index, 2); assert.equal(p.state.status, 'ended'); p.sentenceMode(); assert.equal(p.state.index, 2); assert.equal(p.state.status, 'selected'); p.dispose(); });
test('搜索忽略大小写并保留原始索引', () => { assert.deepEqual(searchSentences(chapter.sentences, ' S3 ').map(s => s.index), [3]); assert.equal(searchSentences(chapter.sentences, '').length, 3); });
const position = (id = 's1') => ({ ...book, sourceBuildId: 'build', chapterId: 'c', sentenceId: id, preferredSpeed: 1, updatedAt: new Date().toISOString() });
function record(transport = null) { let cache; let n = 0; return new SyncRecord('key', 'b', 'r', { get: () => cache, set: (k, v) => cache = structuredClone(v) }, transport, () => String(++n)); }
test('游客恢复本机位置，清除操作保存在本机', async () => { const r = record(); r.update(position()); assert.equal(r.state.progress.sentenceId, 's1'); await r.clear(); assert.equal(r.state.progress, null); assert.equal(r.state.resetting, false); });
test('未知云端基线不可直接覆盖已有云端进度', async () => { let writes = 0; const r = record({ get: async () => ({ version: 4, progress: position('s3') }), put: async () => { writes++; } }); r.update(position()); await r.flush(); assert.equal(writes, 0); assert.equal(r.state.conflict.version, 4); await r.choose('cloud'); assert.equal(r.state.progress.sentenceId, 's3'); assert.equal(r.state.dirty, false); });
test('请求未确认时重放原始幂等请求，期间本机新位置不丢失', async () => { const writes = []; let fail = true; const r = record({ get: async () => ({ version: 0, progress: null }), put: async (b, body) => { writes.push(structuredClone(body)); if (fail) {
        fail = false;
        throw Error('断网');
    } return { version: body.expectedVersion + 1, progress: { ...position(), ...body } }; } }); await r.pull(); r.update(position()); await r.flush(); assert.ok(r.state.inflight); r.update(position('s3')); await r.flush(); assert.deepEqual(writes[0], writes[1]); assert.equal(writes[2].sentenceId, 's3'); assert.notEqual(writes[2].clientMutationId, writes[0].clientMutationId); assert.equal(r.state.progress.sentenceId, 's3'); assert.equal(r.state.dirty, false); });
test('账号切换后取消的同步记录忽略迟到响应', async () => { let resolve; const r = record({ get: () => new Promise(r => resolve = r) }); const job = r.pull(); r.stop(); resolve({ version: 9, progress: position() }); await job; assert.equal(r.state.version, null); assert.equal(r.state.progress, null); });
test('清除进度的不确定响应保留冻结状态并复用 mutation id', async () => { let fail = true; const requests = []; const r = record({ get: async () => ({ version: 2, progress: position() }), reset: async (b, body) => { requests.push(structuredClone(body)); if (fail) {
        fail = false;
        throw Error('断网');
    } return { version: 3, progress: null }; } }); await r.pull(); await r.clear(); assert.equal(r.state.resetting, true); r.update(position('s3')); assert.equal(r.state.progress.sentenceId, 's1'); await r.clear(); assert.deepEqual(requests[0], requests[1]); assert.equal(r.state.progress, null); assert.equal(r.state.resetting, false); });

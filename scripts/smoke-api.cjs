// 可选真实 API 联调；仅访问公开内容，不创建账号或改写云端进度。
const assert = require('node:assert/strict');
const http = require('node:http');
const https = require('node:https');
global.wx = { getStorageSync: () => undefined, getStorageInfoSync: () => ({ keys: [] }), request(o) { const u = new URL(o.url); const request = (u.protocol === 'https:' ? https : http).request(u, { method: o.method, headers: o.header }, response => { let data = ''; response.on('data', s => data += s); response.on('end', () => { try {
        o.success({ statusCode: response.statusCode, data: JSON.parse(data) });
    }
    catch (e) {
        o.fail(e);
    } }); }); request.on('error', o.fail); request.setTimeout(o.timeout, () => request.destroy(Error('timeout'))); if (o.data)
        request.write(JSON.stringify(o.data)); request.end(); } };
const { content } = require('../models/content');
(async () => { const result = await content.list('sample'); assert.ok(result.items.length, '无公开样本可联调'); let sentences = 0; for (const item of result.items) {
    const book = await content.book(item.bookId);
    const snapshot = await content.snapshot(book);
    assert.equal(book.buildId, snapshot.buildId);
    const chapter = await content.chapter(book, book.chapters[0].id);
    sentences += chapter.sentences.length;
    const s = chapter.sentences.find(s => s.audioId);
    if (s) {
        const grant = await content.playback(book, s.id, 'sentence');
        assert.ok(grant.url && grant.audioId && grant.duration > 0);
    }
    if (chapter.chapterAudio.status === 'available') {
        const grant = await content.playback(book, chapter.chapterId, 'chapter');
        assert.ok(grant.url && grant.duration > 0);
    }
} console.log(`真实 API 联调通过：${result.items.length} 本书、${sentences} 句正文、逐句和整章音频授权。`); })().catch(e => { console.error(e); process.exitCode = 1; });

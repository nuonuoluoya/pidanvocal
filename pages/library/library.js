const { content } = require('../../models/content');
const { auth, onIdentityChange } = require('../../models/auth');
const { progressStore } = require('../../models/progress');
const { fullAudioLabel } = require('../../utils/contracts');
const { message, navigate } = require('../../utils/http');
Page({
    data: { books: [], audience: 'sample', nextCursor: null, busy: false, error: '', recent: null, loggedIn: false },
    onLoad() { this.alive = true; this.epoch = 0; this.setData({ audience: auth.session ? 'member' : 'sample' }); this.off = onIdentityChange(() => { this.epoch++; this.setData({ books: [], recent: null, audience: auth.session ? 'member' : 'sample', nextCursor: null, busy: false }); this.load(true); }); this.load(true); },
    onShow() { this.setData({ loggedIn: !!auth.session }); this.loadRecent(); },
    onUnload() { this.alive = false; this.epoch++; if (this.off)
        this.off(); },
    onPullDownRefresh() { this.load(true).finally(() => wx.stopPullDownRefresh()); },
    onReachBottom() { if (this.data.nextCursor && !this.data.busy)
        this.load(false); },
    async load(reset = true) { if (this.data.busy)
        return; const op = ++this.epoch; this.setData({ busy: true, error: '' }); try {
        const r = await content.list(this.data.audience, reset ? undefined : this.data.nextCursor);
        if (!this.alive || op !== this.epoch)
            return;
        const items = r.items.map(b => {
            const words = String(b.title || '').split(/\s+/).filter(w => w && !/^(the|a|an|and|of|from|in|on)$/i.test(w));
            const initials = words.slice(0, 2).map(w => w[0]).join('').toUpperCase() || '书';
            const language = /^en(?:[-_]|$)/i.test(b.language || '') ? '英文' : b.language;
            return { ...b, audioLabel: fullAudioLabel(b), audioComplete: b.chapterAudioAvailableCount > 0 && b.chapterAudioAvailableCount === b.contentChapterCount, coverInitials: initials, metadata: [language, b.edition, b.chapterCount + ' 章'].filter(Boolean).join(' · ') };
        });
        const byId = new Map((reset ? [] : this.data.books).map(b => [b.bookId, b]));
        items.forEach(b => byId.set(b.bookId, b));
        this.setData({ books: [...byId.values()].map((b, i) => ({ ...b, coverTone: ['forest', 'sage', 'stone'][i % 3] })), nextCursor: r.nextCursor });
        await this.loadRecent();
    }
    catch (e) {
        if (this.alive && op === this.epoch)
            this.setData({ error: message(e) });
    }
    finally {
        if (this.alive && op === this.epoch)
            this.setData({ busy: false });
    } },
    async loadRecent() { const id = progressStore.recent(); const op = this.epoch; if (!id) {
        this.setData({ recent: null });
        return;
    } try {
        const b = await content.book(id);
        if (!this.alive || op !== this.epoch)
            return;
        const p = progressStore.get(b).state.progress;
        this.setData({ recent: p ? { ...b, position: progressStore.position(b, p) } : null });
    }
    catch (e) {
        if (this.alive && op === this.epoch)
            this.setData({ recent: null });
    } },
    changeAudience(e) { const audience = e.currentTarget.dataset.value; if (audience === this.data.audience)
        return; if (audience === 'member' && !auth.session) {
        navigate('/pages/settings/settings');
        return;
    } this.epoch++; this.setData({ audience, books: [], nextCursor: null, busy: false, error: '' }); this.load(true); },
    openBook(e) { navigate('/pages/book/book?bookId=' + encodeURIComponent(e.currentTarget.dataset.id)); },
    continueReading() { if (this.data.recent)
        navigate('/pages/book/book?bookId=' + encodeURIComponent(this.data.recent.bookId) + '&continue=1'); },
    loadMore() { if (this.data.nextCursor && !this.data.busy) return this.load(false); },
    retry() { return this.load(true); }
});

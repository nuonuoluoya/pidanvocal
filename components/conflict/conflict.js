const { progressStore } = require('../../models/progress');
const { player } = require('../../models/player');
const { subscribe } = require('../../utils/events');
Component({
    properties: { book: { type: Object, value: null, observer: 'refresh' } },
    data: { open: false, local: '', cloud: '', resetting: false, busy: false },
    lifetimes: { attached() { this.unsubscribe = subscribe(() => this.refresh()); this.refresh(); }, detached() { if (this.unsubscribe)
            this.unsubscribe(); } },
    methods: {
        refresh() { const b = this.properties.book; if (!b) {
            this.setData({ open: false });
            return;
        } const s = progressStore.get(b).state; this.setData({ open: !!s.conflict && !s.deferred, local: s.progress ? progressStore.position(b, s.progress) : '尚无位置', cloud: s.conflict && s.conflict.progress ? progressStore.position(b, s.conflict.progress) : '已清除 / 尚无位置', resetting: !!s.resetting }); },
        async choose(e) { if (this.data.busy)
            return; const choice = e.currentTarget.dataset.choice || 'later'; player.pause(); this.setData({ busy: true }); try {
            await progressStore.get(this.properties.book).choose(choice);
            this.refresh();
            this.triggerEvent('resolved');
        }
        finally {
            this.setData({ busy: false });
        } },
        later() { this.choose({ currentTarget: { dataset: { choice: 'later' } } }); }
    }
});

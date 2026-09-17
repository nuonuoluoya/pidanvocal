const { player } = require('./models/player');
const { progressStore } = require('./models/progress');
App({
    visible: true,
    onLaunch() {
        wx.onNetworkStatusChange(r => { progressStore.online.value = r.isConnected; if (r.isConnected)
            progressStore.resume(); });
        wx.getNetworkType({ success: r => { progressStore.online.value = r.networkType !== 'none'; } });
        wx.onAudioInterruptionBegin(() => player.setForeground(false));
        wx.onAudioInterruptionEnd(() => { if (this.visible)
            player.setForeground(true); });
    },
    onShow() { this.visible = true; progressStore.resume(); },
    onHide() { this.visible = false; player.setForeground(false); progressStore.flushAll(); }
});

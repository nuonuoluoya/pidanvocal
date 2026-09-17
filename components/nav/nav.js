Component({
  properties: { title: String, back: Boolean },
  data: { statusBarHeight: 24, barHeight: 44, rightInset: 100 },
  lifetimes: {
    attached() {
      try {
        const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        const menu = wx.getMenuButtonBoundingClientRect();
        const status = info.statusBarHeight || 24;
        const validMenu = menu && menu.height > 0 && menu.top >= status;
        this.setData({ statusBarHeight: status, barHeight: validMenu ? (menu.top - status) * 2 + menu.height : 44, rightInset: validMenu ? info.windowWidth - menu.left + 12 : 100 });
      } catch (_) { /* Keep a safe layout in older runtimes. */ }
    }
  },
  methods: {
    goBack() {
      if (getCurrentPages().length > 1) wx.navigateBack();
      else wx.reLaunch({ url: '/pages/library/library' });
    }
  }
});

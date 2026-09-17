const { operatorContact } = require('../../config/config');
Page({ data: { notice: '' }, contact() { if (!operatorContact) {
        this.setData({ notice: '本地开发版本尚未配置运营联系方式，正式发布前必须补齐。' });
        return;
    } wx.setClipboardData({ data: operatorContact, success: () => this.setData({ notice: '运营联系方式已复制' }) }); } });

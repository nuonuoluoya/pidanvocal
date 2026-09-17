Component({ options: { multipleSlots: true }, properties: { open: Boolean, title: String }, methods: { close() { this.triggerEvent('close'); }, noop() { } } });

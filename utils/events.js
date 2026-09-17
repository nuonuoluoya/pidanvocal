// 原生页面订阅业务状态；合并同一轮更新，避免重复 setData。
const listeners = new Set();
let pending = false;
function emit() {
    if (pending)
        return;
    pending = true;
    Promise.resolve().then(() => { pending = false; listeners.forEach(fn => fn()); });
}
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function observable(input) {
    const result = {};
    Object.keys(input).forEach(key => {
        let value = input[key];
        Object.defineProperty(result, key, { enumerable: true, get: () => value,
            set(next) { if (next !== value) {
                value = next;
                emit();
            } } });
    });
    return result;
}
module.exports = { emit, subscribe, observable, ref: value => observable({ value }) };

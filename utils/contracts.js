"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playable = exports.speeds = void 0;
exports.searchSentences = searchSentences;
exports.isSpeed = isSpeed;
exports.fullAudioLabel = fullAudioLabel;
exports.timeLabel = timeLabel;
/** Platform-neutral HTTP contract. Never import Node/Nest/ORM here. */
exports.speeds = [0.75, 1, 1.25, 1.5];
const playable = (s) => {
    var _a;
    return (s.alignment.status === 'verified' || s.alignment.status === 'auto_passed') &&
        !!s.audioId &&
        ((_a = s.duration) !== null && _a !== void 0 ? _a : 0) > 0;
};
exports.playable = playable;
function searchSentences(sentences, query) {
    const q = query.trim().toLocaleLowerCase();
    return q ? sentences.filter((s) => s.text.toLocaleLowerCase().includes(q)) : sentences;
}
function isSpeed(value) {
    return exports.speeds.includes(value);
}
function fullAudioLabel(b) {
    return b.chapterAudioAvailableCount > 0
        ? b.chapterAudioAvailableCount === b.contentChapterCount
            ? '全部章节可用'
            : '部分章节可用'
        : '暂不可用';
}
function timeLabel(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(s / 60)
        .toString()
        .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

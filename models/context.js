"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectedBook = void 0;
const events_1 = require("../utils/events");
const auth_1 = require("./auth");
exports.selectedBook = (0, events_1.ref)(null);
(0, auth_1.onIdentityChange)(() => {
    exports.selectedBook.value = null;
});

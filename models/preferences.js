"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSpeed = defaultSpeed;
const contracts_1 = require("../utils/contracts");
const auth_1 = require("./auth");
const http_1 = require("../utils/http");
function defaultSpeed() {
    try {
        const value = http_1.storage.get(`pidan:${http_1.environment}:${(0, auth_1.identity)()}:speed`);
        return (0, contracts_1.isSpeed)(value) ? value : 1;
    }
    catch {
        return 1;
    }
}

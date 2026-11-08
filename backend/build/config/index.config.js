"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const dotenv_1 = require("dotenv");
// APP mode
const mode = process.env.NODE_ENV || "development";
(0, dotenv_1.config)({ path: `.${mode}.env` });
exports.appConfig = {
    app: {
        mode,
        port: process.env.APP_PORT,
        app_host: process.env.APP_HOST,
        memcached_host: process.env.MEMCACHED_HOST,
        memcached_port: process.env.MEMCACHED_PORT,
    },
};

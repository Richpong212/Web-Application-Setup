"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const operations_validation_1 = require("../validations/operations.validation");
const import_validation_1 = require("../validations/import.validation");
const index_validation_1 = require("../validations/index.validation");
const import_controller_1 = require("../controllers/import.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middleware_1.authenticate, operations_validation_1.farmReference, index_validation_1.validate);
router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
router.post("/preview", import_validation_1.historyValidation, index_validation_1.validate, import_controller_1.preview);
router.post("/commit", import_validation_1.historyValidation, index_validation_1.validate, import_controller_1.commit);
exports.default = router;

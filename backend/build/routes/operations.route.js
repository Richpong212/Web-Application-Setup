"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const controller = __importStar(require("../controllers/operations.controller"));
const validation = __importStar(require("../validations/operations.validation"));
const index_validation_1 = require("../validations/index.validation");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middleware_1.authenticate, validation.farmReference, index_validation_1.validate);
router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
router.get("/workspace", controller.workspace);
router.get("/dashboard", controller.dashboard);
router.get("/records/weekly", validation.weeklyRecordsValidation, index_validation_1.validate, controller.weeklyRecords);
router.post("/flocks", validation.createFlockValidation, index_validation_1.validate, controller.createFlock);
router.patch("/flocks/:id", validation.resourceReference, validation.updateFlockValidation, index_validation_1.validate, controller.updateFlock);
router.post("/records", validation.createRecordValidation, index_validation_1.validate, controller.createRecord);
router.patch("/records/:id", validation.resourceReference, validation.correctRecordValidation, index_validation_1.validate, controller.correctRecord);
router.put("/feed-schedule", validation.feedValidation, index_validation_1.validate, controller.feedSchedule);
router.put("/vaccination-schedule", validation.vaccineValidation, index_validation_1.validate, controller.vaccineSchedule);
router.post("/vaccinations", validation.completeVaccineValidation, index_validation_1.validate, controller.completeVaccination);
router.post("/tasks", validation.createTaskValidation, index_validation_1.validate, controller.createTask);
router.patch("/tasks/:id", validation.resourceReference, validation.updateTaskValidation, index_validation_1.validate, controller.updateTask);
router.delete("/tasks/:id", validation.resourceReference, index_validation_1.validate, controller.deleteTask);
router.get("/reports", validation.reportValidation, index_validation_1.validate, controller.report);
router.get("/reports.csv", validation.reportValidation, index_validation_1.validate, controller.exportReport);
router.get("/audit", controller.auditLog);
exports.default = router;

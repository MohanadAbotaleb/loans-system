"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const disbursements_module_1 = require("./modules/disbursements/disbursements.module");
const repayments_module_1 = require("./modules/repayments/repayments.module");
const rollbacks_module_1 = require("./modules/rollbacks/rollbacks.module");
const audit_module_1 = require("./modules/audit/audit.module");
const loans_module_1 = require("./modules/loans/loans.module");
const prisma_module_1 = require("./prisma/prisma.module");
const health_controller_1 = require("./modules/health/health.controller");
const core_1 = require("@nestjs/core");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            prisma_module_1.PrismaModule,
            disbursements_module_1.DisbursementsModule,
            repayments_module_1.RepaymentsModule,
            rollbacks_module_1.RollbacksModule,
            loans_module_1.LoansModule,
            audit_module_1.AuditModule,
        ],
        controllers: [app_controller_1.AppController, health_controller_1.HealthController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const uuid_1 = require("uuid");
let LoggingInterceptor = LoggingInterceptor_1 = class LoggingInterceptor {
    logger = new common_1.Logger(LoggingInterceptor_1.name);
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, url, body } = req;
        const userAgent = req.get('user-agent') || '';
        const transactionId = (0, uuid_1.v4)();
        req.transactionId = transactionId;
        const now = Date.now();
        this.logger.log({
            message: 'Incoming Request',
            transactionId,
            method,
            url,
            body: this.sanitizeBody(body),
            userAgent,
        });
        return next
            .handle()
            .pipe((0, operators_1.tap)((data) => {
            const response = context.switchToHttp().getResponse();
            const delay = Date.now() - now;
            this.logger.log({
                message: 'Outgoing Response',
                transactionId,
                method,
                url,
                statusCode: response.statusCode,
                duration: `${delay}ms`,
            });
        }));
    }
    sanitizeBody(body) {
        if (!body)
            return body;
        const sanitized = { ...body };
        return sanitized;
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = LoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map
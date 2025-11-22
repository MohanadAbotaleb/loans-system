"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepaymentsController = void 0;
const common_1 = require("@nestjs/common");
const repayments_service_1 = require("./repayments.service");
const create_repayment_dto_1 = require("./dto/create-repayment.dto");
let RepaymentsController = class RepaymentsController {
    repaymentsService;
    constructor(repaymentsService) {
        this.repaymentsService = repaymentsService;
    }
    async findAll(res) {
        const { data, count } = await this.repaymentsService.findAll();
        res.set('Content-Range', `repayments 0 - ${count}/${count}`);
        res.set('X-Total-Count', count.toString());
        return res.json(data);
    }
    async getHistory(loanId) {
        return this.repaymentsService.getHistory(loanId);
    }
    async getSchedule(loanId) {
        return this.repaymentsService.getSchedule(loanId);
    }
    async calculateDue(loanId) {
        return this.repaymentsService.calculateDue(loanId);
    }
    async create(createRepaymentDto) {
        return this.repaymentsService.recordRepayment(createRepaymentDto);
    }
};
exports.RepaymentsController = RepaymentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RepaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':loanId'),
    __param(0, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RepaymentsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':loanId/schedule'),
    __param(0, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RepaymentsController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Get)(':loanId/calculate'),
    __param(0, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RepaymentsController.prototype, "calculateDue", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_repayment_dto_1.CreateRepaymentDto]),
    __metadata("design:returntype", Promise)
], RepaymentsController.prototype, "create", null);
exports.RepaymentsController = RepaymentsController = __decorate([
    (0, common_1.Controller)('repayments'),
    __metadata("design:paramtypes", [repayments_service_1.RepaymentsService])
], RepaymentsController);
//# sourceMappingURL=repayments.controller.js.map
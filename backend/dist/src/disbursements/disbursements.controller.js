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
exports.DisbursementsController = void 0;
const common_1 = require("@nestjs/common");
const disbursements_service_1 = require("./disbursements.service");
const create_disbursement_dto_1 = require("./dto/create-disbursement.dto");
let DisbursementsController = class DisbursementsController {
    disbursementsService;
    constructor(disbursementsService) {
        this.disbursementsService = disbursementsService;
    }
    async create(createDisbursementDto) {
        return this.disbursementsService.disburseLoan(createDisbursementDto);
    }
};
exports.DisbursementsController = DisbursementsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_disbursement_dto_1.CreateDisbursementDto]),
    __metadata("design:returntype", Promise)
], DisbursementsController.prototype, "create", null);
exports.DisbursementsController = DisbursementsController = __decorate([
    (0, common_1.Controller)('disbursements'),
    __metadata("design:paramtypes", [disbursements_service_1.DisbursementsService])
], DisbursementsController);
//# sourceMappingURL=disbursements.controller.js.map
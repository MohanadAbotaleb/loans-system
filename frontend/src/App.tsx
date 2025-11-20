import { Admin, Resource } from "react-admin";
import { dataProvider } from "./dataProvider";
import { Dashboard } from "./Dashboard";
import { LoanList, LoanShow } from "./loans";
import { DisbursementList, DisbursementCreate } from "./disbursements";
import { RepaymentList, RepaymentCreate } from "./repayments";
import { AuditLogList } from "./auditLogs";

export const App = () => (
    <Admin dataProvider={dataProvider} dashboard={Dashboard}>
        <Resource name="loans" list={LoanList} show={LoanShow} />
        <Resource name="disbursements" list={DisbursementList} create={DisbursementCreate} />
        <Resource name="repayments" list={RepaymentList} create={RepaymentCreate} />
        <Resource name="audit-logs" list={AuditLogList} />
    </Admin>
);

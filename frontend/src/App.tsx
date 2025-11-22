import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";
import { LoanList } from "./loans/LoanList";
import { LoanShow } from "./loans/LoanShow";
import { DisbursementCreate } from "./disbursements/DisbursementCreate";
import { DisbursementList } from "./disbursements/DisbursementList";
import { RepaymentCreate } from "./repayments/RepaymentCreate";
import { RepaymentList } from "./repayments/RepaymentList";
import { RollbackCreate } from "./rollbacks/RollbackCreate";
import { RollbackList } from "./rollbacks/RollbackList";
import { AuditList } from "./audit/AuditList";

const dataProvider = simpleRestProvider("http://localhost:3000");

export const App = () => (
  <Admin dataProvider={dataProvider}>
    <Resource
      name="loans"
      list={LoanList}
      show={LoanShow}
    />
    <Resource
      name="disbursements"
      list={DisbursementList}
      create={DisbursementCreate}
    />
    <Resource
      name="repayments"
      list={RepaymentList}
      create={RepaymentCreate}
    />
    <Resource
      name="rollbacks"
      list={RollbackList}
      create={RollbackCreate}
    />
    <Resource
      name="audit"
      list={AuditList}
    />
  </Admin>
);

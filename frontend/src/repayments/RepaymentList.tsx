import { List, Datagrid, TextField, NumberField, DateField } from "react-admin";

export const RepaymentList = () => (
    <List bulkActionButtons={false}>
        <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="loanId" />
            <NumberField source="amount" />
            <NumberField source="principalPaid" />
            <NumberField source="interestPaid" />
            <NumberField source="lateFeePaid" />
            <DateField source="paymentDate" />
            <TextField source="status" />
        </Datagrid>
    </List>
);

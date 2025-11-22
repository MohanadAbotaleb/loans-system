import { List, Datagrid, TextField, NumberField, DateField } from "react-admin";

export const DisbursementList = () => (
    <List bulkActionButtons={false}>
        <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="loanId" />
            <NumberField source="amount" />
            <DateField source="disbursementDate" />
            <TextField source="status" />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);

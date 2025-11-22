import { List, Datagrid, TextField, NumberField, DateField } from "react-admin";

export const LoanList = () => (
    <List>
        <Datagrid bulkActionButtons={false} rowClick="show">
            <TextField source="id" />
            <TextField source="borrowerId" label="Borrower ID" />
            <NumberField source="amount" />
            <NumberField source="interestRate" label="Interest Rate %" />
            <NumberField source="tenor" label="Tenor (months)" />
            <TextField source="status" />
            <DateField source="createdAt" showTime />
        </Datagrid>
    </List>
);

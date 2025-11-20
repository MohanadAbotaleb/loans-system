import { List, Datagrid, TextField, DateField, NumberField, Show, SimpleShowLayout, ReferenceManyField } from "react-admin";

export const LoanList = () => (
    <List>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="borrowerId" />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="interestRate" />
            <NumberField source="tenor" />
            <TextField source="status" />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);

export const LoanShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="id" />
            <TextField source="borrowerId" />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="interestRate" />
            <NumberField source="tenor" />
            <TextField source="status" />
            <DateField source="createdAt" />
            <DateField source="updatedAt" />

            <ReferenceManyField label="Repayment Schedule" reference="repayments" target="loanId">
                <Datagrid>
                    <TextField source="installmentNumber" />
                    <DateField source="dueDate" />
                    <NumberField source="principalAmount" options={{ style: 'currency', currency: 'USD' }} />
                    <NumberField source="interestAmount" options={{ style: 'currency', currency: 'USD' }} />
                    <TextField source="status" />
                    <DateField source="paidDate" />
                </Datagrid>
            </ReferenceManyField>
        </SimpleShowLayout>
    </Show>
);

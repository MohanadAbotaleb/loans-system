import { Show, TextField, NumberField, DateField, TabbedShowLayout, Tab, Datagrid, ReferenceManyField } from "react-admin";

export const LoanShow = () => (
    <Show>
        <TabbedShowLayout>
            <Tab label="Summary">
                <TextField source="id" />
                <TextField source="borrowerId" label="Borrower ID" />
                <NumberField source="amount" />
                <NumberField source="interestRate" label="Interest Rate %" />
                <NumberField source="tenor" label="Tenor (months)" />
                <TextField source="status" />
                <DateField source="createdAt" showTime />
                <DateField source="updatedAt" showTime />
            </Tab>
            <Tab label="Payments">
                <ReferenceManyField reference="repayments" target="loanId" label={false}>
                    <Datagrid bulkActionButtons={false}>
                        <TextField source="id" />
                        <NumberField source="amount" />
                        <DateField source="paymentDate" showTime />
                        <NumberField source="principalPaid" />
                        <NumberField source="interestPaid" />
                        <TextField source="status" />
                    </Datagrid>
                </ReferenceManyField>
            </Tab>
        </TabbedShowLayout>
    </Show>
);

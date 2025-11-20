import { List, Datagrid, TextField, DateField, NumberField, Create, SimpleForm, NumberInput, ReferenceInput, SelectInput } from "react-admin";
import { RollbackButton } from "./RollbackButton";

export const RepaymentList = () => (
    <List>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="loanId" />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <DateField source="paymentDate" />
            <NumberField source="principalPaid" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="interestPaid" options={{ style: 'currency', currency: 'USD' }} />
            <NumberField source="lateFeePaid" options={{ style: 'currency', currency: 'USD' }} />
            <TextField source="status" />
            <RollbackButton />
        </Datagrid>
    </List>
);

export const RepaymentCreate = () => (
    <Create>
        <SimpleForm>
            <ReferenceInput source="loanId" reference="loans">
                <SelectInput optionText="id" label="Select Loan" required />
            </ReferenceInput>
            <NumberInput source="amount" label="Payment Amount" required min={0} />
        </SimpleForm>
    </Create>
);

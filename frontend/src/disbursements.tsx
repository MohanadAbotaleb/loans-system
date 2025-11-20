import { List, Datagrid, TextField, DateField, NumberField, Create, SimpleForm, TextInput, NumberInput } from "react-admin";
import { RollbackButton } from "./RollbackButton";
import { generateUUID } from "./utils";

export const DisbursementList = () => (
    <List>
        <Datagrid rowClick="show" bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="loanId" />
            <NumberField source="amount" options={{ style: 'currency', currency: 'USD' }} />
            <DateField source="disbursementDate" />
            <TextField source="status" />
            <RollbackButton />
        </Datagrid>
    </List>
);

export const DisbursementCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="loanId" label="Loan ID" defaultValue={generateUUID()} disabled />
            <TextInput source="borrowerId" label="Borrower ID" defaultValue={generateUUID()} disabled />
            <NumberInput source="amount" label="Amount" required min={0} />
            <NumberInput source="interestRate" label="Interest Rate (%)" required min={0} max={100} />
            <NumberInput source="tenor" label="Tenor (Months)" required min={1} />
            <TextInput source="currency" label="Currency" defaultValue="USD" />
        </SimpleForm>
    </Create>
);

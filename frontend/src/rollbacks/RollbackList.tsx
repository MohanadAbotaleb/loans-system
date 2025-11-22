import { List, Datagrid, TextField, DateField } from "react-admin";

export const RollbackList = () => (
    <List bulkActionButtons={false}>
        <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="transactionId" />
            <TextField source="originalOperation" />
            <TextField source="rollbackReason" />
            <DateField source="createdAt" />
        </Datagrid>
    </List>
);

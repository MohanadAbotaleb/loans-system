import { List, Datagrid, TextField, DateField, FunctionField } from "react-admin";

export const AuditList = () => (
    <List bulkActionButtons={false}>
        <Datagrid bulkActionButtons={false}>
            <TextField source="id" />
            <TextField source="transactionId" />
            <TextField source="operation" />
            <FunctionField label="User" render={record => record.userId || 'System'} />
            <DateField source="createdAt" showTime />
        </Datagrid>
    </List>
);

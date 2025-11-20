import { List, Datagrid, TextField, DateField, FunctionField } from "react-admin";

export const AuditLogList = () => (
    <List>
        <Datagrid>
            <TextField source="id" />
            <TextField source="operation" />
            <TextField source="transactionId" label="Transaction ID" />
            <TextField source="userId" label="User ID" emptyText="System" />
            <DateField source="createdAt" showTime />
            <FunctionField
                label="Metadata"
                render={(record: any) => record.metadata ? JSON.stringify(record.metadata).slice(0, 50) + '...' : '-'}
            />
        </Datagrid>
    </List>
);

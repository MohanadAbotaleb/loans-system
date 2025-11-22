import { Create, SimpleForm, NumberInput, ReferenceInput, SelectInput } from "react-admin";

export const RepaymentCreate = () => (
    <Create>
        <SimpleForm>
            <ReferenceInput
                source="loanId"
                reference="loans"
                filter={{ status: 'active', excludeRolledBack: 'true' }}
            >
                <SelectInput optionText={(record) => `${record.id} - ${record.amount}`} fullWidth />
            </ReferenceInput>
            <NumberInput source="amount" fullWidth />
        </SimpleForm>
    </Create>
);

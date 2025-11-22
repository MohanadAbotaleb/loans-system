import { Create, SimpleForm, TextInput, SelectInput, required, useGetList } from "react-admin";

export const RollbackCreate = () => {
    // Fetch disbursements and payments to populate the dropdown
    const { data: disbursements, isLoading: loadingDisbursements } = useGetList('disbursements', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'createdAt', order: 'DESC' }
    });

    const { data: payments, isLoading: loadingPayments } = useGetList('repayments', {
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'createdAt', order: 'DESC' }
    });

    // Combine disbursements and payments into transaction choices
    const transactionChoices = [
        ...(disbursements || []).map(d => ({
            id: d.id,
            name: `Disbursement: ${d.loanId} - $${d.amount} (${d.status})`,
            type: 'disbursement'
        })),
        ...(payments || []).map(p => ({
            id: p.id,
            name: `Payment: ${p.loanId} - $${p.amount} (${p.status})`,
            type: 'payment'
        }))
    ];

    return (
        <Create>
            <SimpleForm>
                <SelectInput
                    source="transactionId"
                    choices={transactionChoices}
                    optionText="name"
                    optionValue="id"
                    fullWidth
                    validate={required()}
                    isLoading={loadingDisbursements || loadingPayments}
                    helperText="Select a disbursement or payment to rollback"
                />
                <TextInput
                    source="reason"
                    multiline
                    rows={4}
                    fullWidth
                    validate={required()}
                    helperText="Explain why this transaction needs to be rolled back"
                />
            </SimpleForm>
        </Create>
    );
};

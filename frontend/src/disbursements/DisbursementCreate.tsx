import { Create, SimpleForm, TextInput, NumberInput, required } from "react-admin";
import { v4 as uuidv4 } from 'uuid';

// Generate full UUIDs for better compatibility
const generateLoanId = () => uuidv4();
const generateBorrowerId = () => uuidv4();

export const DisbursementCreate = () => {
    const defaultLoanId = generateLoanId();
    const defaultBorrowerId = generateBorrowerId();

    return (
        <Create>
            <SimpleForm>
                <TextInput
                    source="loanId"
                    defaultValue={defaultLoanId}
                    fullWidth
                    validate={required()}
                    helperText="Auto-generated unique loan ID"
                />
                <TextInput
                    source="borrowerId"
                    defaultValue={defaultBorrowerId}
                    fullWidth
                    validate={required()}
                    helperText="Auto-generated unique borrower ID"
                />
                <NumberInput
                    source="amount"
                    fullWidth
                    validate={required()}
                    min={0}
                    helperText="Loan amount in USD"
                />
                <TextInput
                    source="currency"
                    defaultValue="USD"
                    fullWidth
                    validate={required()}
                />
                <NumberInput
                    source="tenor"
                    fullWidth
                    validate={required()}
                    min={1}
                    max={360}
                    helperText="Loan duration in months (1-360)"
                />
                <NumberInput
                    source="interestRate"
                    fullWidth
                    validate={required()}
                    min={0}
                    max={100}
                    step={0.01}
                    helperText="Annual interest rate percentage (e.g., 12 for 12%)"
                />
            </SimpleForm>
        </Create>
    );
};

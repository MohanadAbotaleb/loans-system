import { useState } from 'react';
import { Button, useNotify, useRefresh, useDataProvider } from 'react-admin';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';

export const RollbackButton = ({ record }: { record?: any }) => {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const notify = useNotify();
    const refresh = useRefresh();
    const dataProvider = useDataProvider();

    if (!record) return null;

    // Only show rollback for successful/completed transactions
    if (record.status !== 'success' && record.status !== 'completed') return null;

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleConfirm = async () => {
        try {
            await dataProvider.rollback(record.id, { reason });
            notify('Transaction rolled back successfully', { type: 'info' });
            refresh();
            handleClose();
        } catch (error) {
            notify(`Error: ${error}`, { type: 'warning' });
        }
    };

    return (
        <>
            <Button label="Rollback" onClick={handleOpen} color="warning">
                <RestoreIcon />
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Rollback Transaction</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Reason for Rollback"
                        fullWidth
                        variant="standard"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button label="Cancel" onClick={handleClose} />
                    <Button label="Confirm Rollback" onClick={handleConfirm} color="warning" />
                </DialogActions>
            </Dialog>
        </>
    );
};

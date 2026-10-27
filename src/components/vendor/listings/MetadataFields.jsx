import { Autocomplete, MenuItem, TextField } from '@mui/material';

export default function MetadataFields({ fields, values, onChange, disabled = false }) {
    return fields.map((field) => {
        const value = values[field.key] ?? '';
        const props = { label: field.label, size: 'small', fullWidth: true, disabled };
        if (field.type === 'array') {
            return <Autocomplete key={field.key} multiple freeSolo options={[]} value={Array.isArray(value) ? value : []} onChange={(_, next) => onChange(field.key, next)} disabled={disabled} renderInput={(params) => <TextField {...params} label={field.label} size="small" placeholder={`e.g. ${field.example?.join(', ') || ''}`} helperText="Type a value and press Enter" />} />;
        }
        if (field.type === 'boolean') {
            return <TextField key={field.key} {...props} select value={value === '' ? '' : String(value)} onChange={(event) => onChange(field.key, event.target.value === '' ? '' : event.target.value === 'true')} slotProps={{ select: { MenuProps: { disableScrollLock: true } } }}><MenuItem value="">Not specified</MenuItem><MenuItem value="true">Yes</MenuItem><MenuItem value="false">No</MenuItem></TextField>;
        }
        return <TextField key={field.key} {...props} value={field.type === 'object' && typeof value !== 'string' ? JSON.stringify(value, null, 2) : value} type={field.type === 'number' ? 'number' : 'text'} slotProps={{ htmlInput: field.type === 'number' ? { min: 0, step: 'any' } : undefined }} multiline={field.type === 'object'} minRows={field.type === 'object' ? 2 : undefined} placeholder={field.type === 'object' ? 'JSON object' : `e.g. ${field.example ?? ''}`} onChange={(event) => onChange(field.key, event.target.value)} />;
    });
}

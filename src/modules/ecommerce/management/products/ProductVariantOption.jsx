import { MenuItem, TextField } from '@mui/material';
import { isColorOption } from '@/util/productPresentation.mjs';
import ProductColorPicker from './ProductColorPicker';
import { productSelectSlotProps } from './ProductControls';

export default function ProductVariantOption({ option, value, onChange, disabled }) {
  const values = option.values.map((item) => item.trim()).filter(Boolean);
  if (isColorOption(option.name)) return <ProductColorPicker required label={option.name} value={value} choices={values} onChange={onChange} disabled={disabled} />;
  return <TextField select slotProps={productSelectSlotProps} required fullWidth size="small" label={option.name} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}><MenuItem value="">Choose {option.name}</MenuItem>{values.map((item, index) => <MenuItem key={index} value={item}>{item}</MenuItem>)}</TextField>;
}

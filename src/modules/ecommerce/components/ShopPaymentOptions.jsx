import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';

export default function ShopPaymentOptions({ value, onChange, disabled = false }) {
  return <FormControl component="fieldset" disabled={disabled} sx={{ width: '100%', my: 2 }}>
    <FormLabel component="legend" id="shop-payment-method" sx={{ color: '#30262b', fontSize: 15, fontWeight: 600, '&.Mui-focused': { color: '#30262b' } }}>Payment method</FormLabel>
    <RadioGroup aria-labelledby="shop-payment-method" name="payment-method" value={value} onChange={(event) => onChange(event.target.value)}>
      <FormControlLabel value="RAZORPAY" control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#b61f4b' } }} />} label="Razorpay" />
      <FormControlLabel value="COD" disabled control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#b61f4b' } }} />} label="Cash on Delivery (currently unavailable)" />
    </RadioGroup>
  </FormControl>;
}

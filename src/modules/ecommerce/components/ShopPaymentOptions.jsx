import Image from 'next/image';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
import styles from '../ShopOrderDetails.module.css';

export default function ShopPaymentOptions({ value, onChange, disabled = false }) {
  return <FormControl component="fieldset" disabled={disabled} sx={{ width: '100%', mb: 3 }}>
    <FormLabel component="legend" id="shop-payment-method" className={styles.srOnly}>Payment method</FormLabel>
    <RadioGroup aria-labelledby="shop-payment-method" name="payment-method" value={value} className={styles.paymentOptions} sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }} onChange={(event) => onChange(event.target.value)}>
      <FormControlLabel value="RAZORPAY" className={`${styles.option} ${value === 'RAZORPAY' ? styles.selectedOption : ''}`} sx={{ '& .MuiFormControlLabel-label': { flex: 1, minWidth: 0 } }} control={<Radio size="small" sx={{ p: .5, mr: .5, '&.Mui-checked': { color: '#bd0b50' } }} />} label={<span className={styles.optionLabel}><Image src="/images/ecommerce/razorpay-payment.png" alt="Razorpay" width={120} height={40} className={styles.paymentLogo} /></span>} />
      <FormControlLabel value="COD" disabled title="Cash on Delivery is currently unavailable" className={styles.option} sx={{ '& .MuiFormControlLabel-label': { flex: 1, minWidth: 0 } }} control={<Radio size="small" sx={{ p: .5, mr: .5 }} />} label={<span className={`${styles.optionLabel} ${styles.codLabel}`}><Image src="/images/ecommerce/cod-payment.png" alt="Cash on Delivery" width={120} height={40} className={styles.paymentLogo} /><span className={styles.unavailable}>Unavailable</span></span>} />
    </RadioGroup>
  </FormControl>;
}

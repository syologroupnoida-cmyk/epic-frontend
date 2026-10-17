import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

export default function OfferingKindSelect({ value, onChange, disabled = false, className = "" }) {
  return <div className={`col-span-12 pb-[18px] ${className}`}>
    <TextField select fullWidth required size="small" variant="outlined" label="Service type" name="offeringKind" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}
      sx={{
        "& .MuiOutlinedInput-root": { height: 46, fontSize: 14, borderRadius: "4px", backgroundColor: "#fff" },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fecdd3" },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b61f4b" },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#b61f4b", borderWidth: "1px" },
        "& .MuiInputLabel-root": { fontSize: 14 },
        "& .MuiInputLabel-root.Mui-focused": { color: "#b61f4b" },
        "& .MuiSelect-select:focus-visible": { outline: "none" },
      }}
    >
      <MenuItem value="SERVICE">Service</MenuItem>
      <MenuItem value="VENUE_PROPERTY">Property</MenuItem>
    </TextField>
  </div>;
}

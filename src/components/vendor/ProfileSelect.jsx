import { useId } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";

export default function ProfileSelect({ label, placeholder, options, value, onChange, name, disabled = false, multiple = false }) {
  const id = useId();
  return <FormControl fullWidth size="small" disabled={disabled} sx={{ minWidth: 0, fontFamily: "inherit", "& .MuiInputLabel-root": { fontFamily: "inherit", fontSize: 14 }, "& .MuiInputLabel-root.Mui-focused": { color: "#b61f4b" } }}>
    <InputLabel id={`${id}-label`} shrink>{label}</InputLabel>
    <Select
      id={id}
      labelId={`${id}-label`}
      label={label}
      name={name}
      value={value}
      multiple={multiple}
      onChange={onChange}
      displayEmpty
      renderValue={multiple ? () => placeholder : undefined}
      sx={{ fontFamily: "inherit", fontSize: 14, backgroundColor: "white", "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#b61f4b" } }}
      MenuProps={{ slotProps: { paper: { sx: { maxHeight: 280, backgroundColor: "white", "& .MuiMenuItem-root": { fontFamily: "inherit", fontSize: 14, minHeight: 36 }, "& .MuiMenuItem-root.Mui-selected": { backgroundColor: "#fff1f2" }, "& .MuiMenuItem-root.Mui-selected:hover": { backgroundColor: "#ffe4e6" } } } } }}
    >
      {!multiple && <MenuItem value="" disabled>{placeholder}</MenuItem>}
      {options.map((option) => <MenuItem key={option.id} value={option.id}>{multiple ? <><Checkbox checked={value.includes(option.id)} size="small" disableRipple tabIndex={-1} slotProps={{ input: { "aria-hidden": true } }} sx={{ color: "#b61f4b", "&.Mui-checked": { color: "#b61f4b" } }} /><ListItemText primary={option.name} slotProps={{ primary: { sx: { fontFamily: "inherit", fontSize: 14 } } }} /></> : option.name}</MenuItem>)}
    </Select>
  </FormControl>;
}

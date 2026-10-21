import { useId, useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ServiceActionIcon } from "@/components/superadmin/ServiceSubcategoryMenu";

export default function ServiceCategoryActions({ category, onView, onEdit, onDelete }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  const close = () => setAnchor(null);

  return <>
    <button type="button" id={id} onClick={(event) => setAnchor(event.currentTarget)}
      aria-label={`Actions for ${category.name}`} aria-haspopup="menu" aria-expanded={Boolean(anchor)}
      className="ml-auto flex h-5 w-5 cursor-pointer items-center justify-center gap-[2px] rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700">
      {[0, 1, 2].map((dot) => <span key={dot} className="h-[3px] w-[3px] rounded-full bg-current" aria-hidden="true" />)}
    </button>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close} disableScrollLock
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ list: { "aria-labelledby": id, dense: true }, paper: { sx: { mt: 0.5, minWidth: 140, borderRadius: 1.5, border: "1px solid #e2e8f0" } } }}>
      <MenuItem onClick={() => { close(); onView(); }} sx={{ gap: 1.25, fontSize: 13, color: "#334155" }}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
        View details
      </MenuItem>
      <MenuItem onClick={() => { close(); onEdit(); }} sx={{ gap: 1.25, fontSize: 13, color: "#334155" }}><ServiceActionIcon action="edit" />Edit</MenuItem>
      <MenuItem onClick={() => { close(); onDelete(); }} sx={{ gap: 1.25, fontSize: 13, color: "#dc2626" }}><ServiceActionIcon action="delete" />Delete</MenuItem>
    </Menu>
  </>;
}

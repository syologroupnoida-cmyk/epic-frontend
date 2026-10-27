export const agentListTableContainerSx = {
  flex: 1,
  minHeight: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  border: '1px solid #e6eaf0',
  borderRadius: '4px',
  outline: 'none',
  '&:focus-visible': {
    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.28)',
  },
};

export const agentListTableSx = {
  width: '100%',
  tableLayout: 'fixed',
  '& .MuiTableCell-root': {
    px: { xs: 0.65, lg: 1 },
    py: 1.1,
    fontSize: { xs: 10.5, md: 11.5, lg: 12.5 },
    lineHeight: 1.35,
    minWidth: 0,
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    verticalAlign: 'middle',
  },
  '& .MuiTableHead-root .MuiTableCell-root': {
    py: 0.9,
    fontSize: { xs: 10.5, md: 11, lg: 12 },
    lineHeight: 1.2,
    overflow: 'visible',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    height: 38,
  },
  '& .MuiTableHead-root .MuiTableRow-root': { height: 38 },
  '& .MuiTableSortLabel-root': { display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' },
  '& .MuiTableBody-root .MuiTableRow-root': { minHeight: 48 },
};

export const agentListPaginationSlotProps = {
  select: {
    variant: 'outlined',
    size: 'small',
    inputProps: { 'aria-label': 'Rows per page' },
    MenuProps: {
      disableScrollLock: true,
      keepMounted: true,
      slotProps: {
        paper: {
          sx: { mt: 0.5, maxHeight: 240, borderRadius: 1.5 },
        },
      },
    },
    sx: { minWidth: 62, height: 28, borderRadius: 1, fontSize: 12, display: 'flex', alignItems: 'center' },
  },
  toolbar: { sx: { minHeight: 36, height: 36, px: 1, py: 0, alignItems: 'center' } },
};

export const agentListPaginationSx = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  width: '100%',
  flexShrink: 0,
  minHeight: 36,
  borderTop: '1px solid #eef1f4',
  overflow: 'visible',
  '& .MuiToolbar-root, & .MuiTablePagination-toolbar': {
    width: 'auto',
    minHeight: 36,
    height: 36,
    px: 1,
    py: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  '& .MuiTablePagination-spacer': { display: 'none' },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { my: 0, fontSize: 12, lineHeight: '36px' },
  '& .MuiTablePagination-input': { my: 0, display: 'flex', alignItems: 'center' },
  '& .MuiTablePagination-actions': { display: 'flex', alignItems: 'center' },
  '& .MuiTablePagination-actions .MuiIconButton-root': { p: 0.45 },
};

export const agentListRowsPerPageOptions = [50, 100, 150, 200];

export const agentListActionButtonSx = {
  width: 24,
  height: 24,
  border: '1px solid #d0d7de',
  borderRadius: '50%',
  color: '#344054',
  bgcolor: '#fff',
  p: 0.15,
  mx: 'auto',
  '&:hover': { bgcolor: '#f8fafc' },
  '& .MuiSvgIcon-root': { fontSize: 16 },
};

export const agentListLoadingCellSx = {
  height: 72,
  py: 2,
};

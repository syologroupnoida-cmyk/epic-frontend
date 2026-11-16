import { TablePagination } from '@mui/material';
import { agentListPaginationSlotProps, agentListPaginationSx } from '@/components/vendor/listings/tableStyles';

export default function InventoryPagination({ result, page, limit, loading, error, onPage, onLimit }) {
  return <TablePagination component="div" count={result.total} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => onPage(next)} onRowsPerPageChange={(event) => onLimit(Number(event.target.value))} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: loading || Boolean(error) || !result.hasNext }, previousButton: { disabled: loading || page === 0 } } }} sx={agentListPaginationSx} />;
}

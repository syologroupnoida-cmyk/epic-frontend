import { useEffect, useState } from 'react';
import { Alert, Button, TablePagination } from '@mui/material';
import MainApi from '@/util/MainApi';
import { billingError, billingMoney, fetchWalletTransactions, walletTransaction } from '@/util/vendorBilling.mjs';
import { leadDate } from '@/util/vendorLeads.mjs';
import { agentListPaginationSlotProps, agentListPaginationSx } from '../listings/tableStyles';
import { useVendorWallet, WalletIcon } from './VendorWalletProvider';
import styles from './VendorBilling.module.css';

export default function WalletTransactions() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const { wallet, error, loading: walletLoading, refresh, revision } = useVendorWallet();
  useEffect(() => {
    const controller = new AbortController();
    fetchWalletTransactions(MainApi, { page: page + 1, limit, signal: controller.signal }).then((data) => { if (!controller.signal.aborted) setResult({ ...data, page, limit, attempt, revision }); }).catch((failure) => { if (!controller.signal.aborted) setResult({ error: billingError(failure), items: [], page, limit, attempt, revision }); });
    return () => controller.abort();
  }, [page, limit, attempt, revision]);
  const current = result?.page === page && result?.limit === limit && result?.attempt === attempt && result?.revision === revision ? result : null;
  return <section className={styles.panel}>
    <header className={`${styles.header} ${styles.walletHeader}`}><div><h1>Wallet Transactions</h1><p>Track credits, purchases and wallet activity.</p></div><div className={styles.balance} aria-label="Wallet balance"><WalletIcon /><strong>{walletLoading ? 'Loading...' : error ? 'Unavailable' : billingMoney(wallet?.balance, wallet?.currency)}</strong></div></header>
    {error && <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}>{error}</Alert>}
    {current?.error && <Alert severity="error" sx={{ m: 2 }} action={<Button color="inherit" size="small" onClick={() => setAttempt((value) => value + 1)}>Retry</Button>}>{current.error}</Alert>}
    <div className={styles.tableScroll}><table className={styles.table} aria-label="Wallet transactions"><thead><tr>{['Date', 'Transaction', 'Description', 'Amount', 'Balance after', 'Status'].map((title) => <th key={title}>{title}</th>)}</tr></thead><tbody>
      {!current ? <tr><td colSpan={6} className={styles.empty} role="status">Loading transactions...</td></tr> : !current.items.length ? <tr><td colSpan={6} className={styles.empty}>{current.error ? 'Transactions could not be loaded.' : 'No wallet transactions found.'}</td></tr> : current.items.map((item, index) => {
        const row = walletTransaction(item);
        return <tr key={row.id || index}><td>{leadDate(row.date, true)}</td><td><p>{String(row.type).replaceAll('_', ' ')}</p>{row.reference && <small>{String(row.reference)}</small>}</td><td><p>{row.description || 'Not provided'}</p></td><td><span className={row.direction === 'CREDIT' ? styles.credit : row.direction === 'DEBIT' ? styles.debit : ''}>{row.direction === 'CREDIT' ? '+' : row.direction === 'DEBIT' ? '-' : ''}{billingMoney(row.amount == null ? null : Math.abs(Number(row.amount)), row.currency)}</span></td><td>{billingMoney(row.balance, row.currency)}</td><td>{row.status ? <span className={styles.status}>{String(row.status).replaceAll('_', ' ')}</span> : 'Not provided'}</td></tr>;
      })}
    </tbody></table></div>
    <TablePagination component="div" count={current?.total ?? -1} page={page} rowsPerPage={limit} rowsPerPageOptions={[20, 50, 100]} onPageChange={(_, next) => setPage(next)} onRowsPerPageChange={(event) => { setPage(0); setLimit(Number(event.target.value)); }} slotProps={{ ...agentListPaginationSlotProps, actions: { nextButton: { disabled: !current || !current.hasNext }, previousButton: { disabled: !current || page === 0 } } }} sx={agentListPaginationSx} />
  </section>;
}

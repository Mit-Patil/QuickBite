import usePagedHistory from '../hooks/usePagedHistory';
import {
  currentMonthKey, formatRupees, formatDateTime, formatMinutes, formatPercent, shortOrderId,
} from '../utils/format';
import Input from './Input';
import Notice from './Notice';
import ErrorMessage from './ErrorMessage';
import Pagination from './Pagination';

const TABS = [
  { key: 'DELIVERED', label: 'Delivered', count: (s) => s.deliveries, empty: 'No deliveries in this month.' },
  { key: 'CANCELLED', label: 'Cancelled', count: (s) => s.cancelled, empty: 'No cancelled deliveries in this month.' },
  { key: 'DECLINED', label: 'Declined', count: (s) => s.declined, empty: 'No declined offers in this month.' },
  { key: 'ALL', label: 'All', count: (s) => s.deliveries + s.cancelled + s.declined, empty: 'Nothing in this month.' },
];

const ROW_LABEL = {
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  DECLINED: 'Declined',
  TIMED_OUT: 'Missed (timed out)',
};

function DeliveryHistory({ title = 'Delivery history', fetchHistory, pageSize }) {
  const { month, page, status, data, loading, error, setMonth, setPage, setStatus } =
    usePagedHistory(fetchHistory, { pageSize });
  const summary = data?.summary;
  const activeTab = TABS.find((t) => t.key === status);

  return (
    <div>
      <h1>{title}</h1>

      <Input
        label="Month"
        name="history-month"
        type="month"
        value={month}
        max={currentMonthKey()}
        onChange={(e) => e.target.value && setMonth(e.target.value)}
      />

      <div role="tablist" aria-label="Filter">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === status}
            disabled={tab.key === status}
            onClick={() => setStatus(tab.key)}
          >
            {tab.label}{summary ? ` (${tab.count(summary)})` : ''}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} />

      {summary && (
        <section aria-label="Summary">
          <p>Deliveries: <strong>{summary.deliveries}</strong></p>
          <p>Total earning: <strong>{formatRupees(summary.totalEarning)}</strong></p>
          <p>Days worked: <strong>{summary.daysWorked}</strong></p>
          <p>Average delivery time: <strong>{formatMinutes(summary.averageMinutes)}</strong></p>
          <p>Acceptance rate: <strong>{formatPercent(summary.acceptanceRate)}</strong></p>
        </section>
      )}

      {loading && !data && <p>Loading history...</p>}
      {data && !loading && data.items.length === 0 && <Notice>{activeTab.empty}</Notice>}

      {data && data.items.length > 0 && (
        <ul>
          {data.items.map((item) => (
            <li key={`${item.orderId}-${item.partnerId}-${item.status}`}>
              <strong>{shortOrderId(item.orderId)}</strong> · {item.restaurantName} · {ROW_LABEL[item.status] ?? item.status}
              <br />
              {formatDateTime(item.eventAt)}
              {item.status === 'DELIVERED' && (
                <> · earned {formatRupees(item.earning)} · delivery fee {formatRupees(item.deliveryFee)}</>
              )}
              {(item.status === 'DECLINED' || item.status === 'TIMED_OUT') && item.pickupDistanceKm !== null && (
                <> · {item.pickupDistanceKm} km away</>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onPageChange={setPage} disabled={loading} />
    </div>
  );
}

export default DeliveryHistory;
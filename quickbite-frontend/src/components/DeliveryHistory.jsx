import usePagedHistory from '../hooks/usePagedHistory';
import {
  currentMonthKey, formatRupees, formatDateTime, formatMinutes, shortOrderId,
} from '../utils/format';
import Input from './Input';
import Notice from './Notice';
import ErrorMessage from './ErrorMessage';
import Pagination from './Pagination';

function DeliveryHistory({ title = 'Delivery history', fetchHistory, pageSize }) {
  const { month, page, data, loading, error, setMonth, setPage } = usePagedHistory(fetchHistory, { pageSize });
  const summary = data?.summary;

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

      <ErrorMessage message={error} />

      {summary && (
        <section aria-label="Summary">
          <p>Deliveries: <strong>{summary.deliveries}</strong></p>
          <p>Total earning: <strong>{formatRupees(summary.totalEarning)}</strong></p>
          <p>Days worked: <strong>{summary.daysWorked}</strong></p>
          <p>Average delivery time: <strong>{formatMinutes(summary.averageMinutes)}</strong></p>
        </section>
      )}

      {loading && !data && <p>Loading history...</p>}
      {data && !loading && data.items.length === 0 && <Notice>No deliveries in this month.</Notice>}

      {data && data.items.length > 0 && (
        <ul>
          {data.items.map((item) => (
            <li key={item.orderId}>
              <strong>{shortOrderId(item.orderId)}</strong> · {item.restaurantName}
              <br />
              {formatDateTime(item.deliveredAt)} · earned {formatRupees(item.earning)} · delivery fee {formatRupees(item.deliveryFee)}
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onPageChange={setPage} disabled={loading} />
    </div>
  );
}

export default DeliveryHistory;
function Pagination({ page, totalPages, onPageChange, disabled = false }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 0}>
        Previous
      </button>
      <span> Page {page + 1} of {totalPages} </span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= totalPages - 1}>
        Next
      </button>
    </nav>
  );
}

export default Pagination;
export default function LoadingOverlay({ visible, message }) {
  if (!visible) return null;

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-panel">
        <div className="loading-spinner" aria-hidden="true" />
        {message ? <p className="loading-message">{message}</p> : null}
      </div>
    </div>
  );
}

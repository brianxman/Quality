/*
 * ConfirmDialog.jsx  -  a small modal "Are you sure?" box.
 *
 * We build our own instead of using window.confirm() because native browser
 * dialogs look inconsistent and can be blocked inside a native iOS wrapper.
 */
import { useEffect } from 'react';

export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  // Pressing Escape (hardware keyboard) cancels.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey); // clean up when the dialog closes
  }, [onCancel]);

  return (
    // The dark backdrop. Tapping it cancels.
    <div className="backdrop" onClick={onCancel}>
      {/* stopPropagation: taps inside the box must not reach the backdrop. */}
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dlg-title">{title}</h2>
        <p>{message}</p>
        <div className="dialog-buttons">
          <button className="btn" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button className="btn btn-danger-solid" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

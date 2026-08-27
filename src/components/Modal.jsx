export default function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal modal-pop" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

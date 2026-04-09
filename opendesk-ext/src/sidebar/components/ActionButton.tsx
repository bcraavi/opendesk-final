interface ActionButtonProps {
  icon: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export function ActionButton({ icon, label, disabled, onClick }: ActionButtonProps) {
  return (
    <button className="action-btn" disabled={disabled} onClick={onClick}>
      <span className="action-btn-icon">{icon}</span>
      <span className="action-btn-label">{label}</span>
    </button>
  );
}

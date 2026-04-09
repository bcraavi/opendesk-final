interface SidebarHeaderProps {
  onCollapse: () => void;
}

export function SidebarHeader({ onCollapse }: SidebarHeaderProps) {
  return (
    <div className="sidebar-header">
      <div className="sidebar-header-left">
        <div className="sidebar-logo">O</div>
        <span className="sidebar-title">OpenDesk</span>
      </div>
      <button className="sidebar-collapse-btn" onClick={onCollapse} title="Collapse sidebar">
        &times;
      </button>
    </div>
  );
}

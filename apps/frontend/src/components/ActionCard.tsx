/**
 * ActionCard Component
 * Responsive display panel component layout
 */

interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export default function ActionCard({ title, description, icon, onClick }: ActionCardProps) {
  return (
    <div
      onClick={onClick}
      className="card card-hover p-6 cursor-pointer hover:scale-105 transition-transform duration-200"
    >
      {icon && <div className="mb-4 text-primary">{icon}</div>}
      <h3 className="text-lg font-bold mb-2 text-text-primary">{title}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
    </div>
  );
}

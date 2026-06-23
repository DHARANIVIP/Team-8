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
      className="glass p-6 cursor-pointer hover:scale-105 transition-transform"
    >
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
}

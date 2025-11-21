import { categoryColors } from '../../utils/constants';

export default function CategoryBadge({ category }) {
  if (!category) return null;
  
  const colors = categoryColors[category] || categoryColors.Important;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      {category}
    </span>
  );
}

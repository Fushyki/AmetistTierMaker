import React from 'react';
import { 
  LayoutGrid, 
  Gamepad2, 
  Flame, 
  Film, 
  Music, 
  Trophy, 
  Shapes 
} from 'lucide-react';
import { getCategoryData } from '../data/categories';

const iconMap = {
  LayoutGrid,
  Gamepad2,
  Flame,
  Film,
  Music,
  Trophy,
  Shapes
};

export default function CategoryBadge({ categoryId, size = 13, showLabel = true, style = {} }) {
  const cat = getCategoryData(categoryId);
  const IconComponent = iconMap[cat.iconName] || Shapes;

  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: `${cat.color}18`,
        border: `1px solid ${cat.color}35`,
        color: cat.color,
        fontSize: '0.72rem',
        fontWeight: '600',
        letterSpacing: '0.2px',
        ...style
      }}
    >
      <IconComponent size={size} strokeWidth={2.2} />
      {showLabel && <span>{cat.label}</span>}
    </span>
  );
}

export function CategoryIcon({ name, size = 15, color = 'currentColor' }) {
  const IconComponent = iconMap[name] || Shapes;
  return <IconComponent size={size} color={color} strokeWidth={2.2} />;
}

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableItem({ id, item, isSelected, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: { item }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: isSelected ? '2px solid #ffd700' : 'none',
    boxSizing: 'border-box',
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  const getProxiedSrc = (url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('supabase.co')) {
      return `https://corsproxy.io/?${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <img
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      src={getProxiedSrc(item.src)}
      crossOrigin="anonymous"
      title={item.nome}
      className={`personagem-item`}
      alt={item.nome}
      onClick={() => onClick(item)}
    />
  );
}

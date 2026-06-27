import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export default function DraggableItem({ id, item, isClickMode, isSelected, onClick }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    data: { item }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    border: isSelected ? '2px solid #ffd700' : 'none',
    boxSizing: 'border-box'
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
      className={`personagem-item ${transform ? 'dragging' : ''}`}
      alt={item.nome}
      onClick={() => onClick(item)}
    />
  );
}

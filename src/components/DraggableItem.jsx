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

  return (
    <img
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      src={item.src}
      title={item.nome}
      className={`personagem-item ${transform ? 'dragging' : ''}`}
      alt={item.nome}
      onClick={() => onClick(item)}
    />
  );
}

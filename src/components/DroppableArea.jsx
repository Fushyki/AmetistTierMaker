import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export default function DroppableArea({ id, className, children, onClick }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const style = {
    backgroundColor: isOver ? 'rgba(255, 255, 255, 0.05)' : undefined,
    border: isOver ? '1px dashed #ffd700' : undefined,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

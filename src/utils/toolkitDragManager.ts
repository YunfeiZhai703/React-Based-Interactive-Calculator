import * as React from 'react';

// Describes the shape of toolbar position object
export interface ToolbarPosition {
  top: number | null;
  left: number | null;
  isDragging: boolean;
}

// Describes the shape of reference object
export interface DragRefs {
  dragRef: React.RefObject<HTMLDivElement>;
  initialPointerRef: React.MutableRefObject<{ x: number; y: number }>;
  initialElementRef: React.MutableRefObject<{ top: number; left: number }>;
}

/**
 * Creates and initializes references for dragging window
 */
export const createDragRefs = (): DragRefs => {
  const dragRef = React.useRef<HTMLDivElement>(null);
  const initialPointerRef = React.useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const initialElementRef = React.useRef<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  return { dragRef, initialPointerRef, initialElementRef };
};

/**
 * Handles the start of a drag operation
 */
export const handleDragStart = (
  e: React.PointerEvent,
  refs: DragRefs,
  setToolbarPosition: React.Dispatch<React.SetStateAction<ToolbarPosition>>,
): void => {
  // Only initiate drag from the toolbar header
  if (!(e.target as HTMLElement).closest('.toolbar-header')) return;
  if (!refs.dragRef.current) return;

  // Set initial cursor and element positions
  refs.initialPointerRef.current = { x: e.clientX, y: e.clientY };

  // Get current element position (default or custom)
  const rect = refs.dragRef.current.getBoundingClientRect();
  refs.initialElementRef.current = {
    top: rect.top,
    left: rect.left,
  };

  setToolbarPosition((prev) => ({ ...prev, isDragging: true }));

  // Capture pointer for better dragging experience
  refs.dragRef.current.setPointerCapture(e.pointerId);

  // Make dragging look nice with cursor change
  if ((e.target as HTMLElement).closest('.toolbar-header')) {
    (e.target as HTMLElement).style.cursor = 'grabbing';
  }
};

/**
 * Handles the drag movement
 */
export const handleDrag = (
  e: React.PointerEvent,
  refs: DragRefs,
  toolbarPosition: ToolbarPosition,
  setToolbarPosition: React.Dispatch<React.SetStateAction<ToolbarPosition>>,
): void => {
  if (!toolbarPosition.isDragging) return;

  // Calculate the movement delta
  const deltaX = e.clientX - refs.initialPointerRef.current.x;
  const deltaY = e.clientY - refs.initialPointerRef.current.y;

  // Update position based on initial positions plus delta
  setToolbarPosition({
    top: refs.initialElementRef.current.top + deltaY,
    left: refs.initialElementRef.current.left + deltaX,
    isDragging: true,
  });
};

/**
 * Handles the end of a drag operation
 */
export const handleDragEnd = (
  e: React.PointerEvent,
  refs: DragRefs,
  toolbarPosition: ToolbarPosition,
  setToolbarPosition: React.Dispatch<React.SetStateAction<ToolbarPosition>>,
): void => {
  if (!toolbarPosition.isDragging) return;
  if (!refs.dragRef.current) return;

  // Release pointer capture and reset cursor
  refs.dragRef.current.releasePointerCapture(e.pointerId);

  const header = refs.dragRef.current.querySelector(
    '.toolbar-header',
  ) as HTMLElement;
  if (header) {
    header.style.cursor = 'grab';
  }

  setToolbarPosition((prev) => ({ ...prev, isDragging: false }));
};

/**
 * Restores the toolbar to its default position
 */
export const restoreToolbarPosition = (
  setToolbarPosition: React.Dispatch<React.SetStateAction<ToolbarPosition>>,
): void => {
  setToolbarPosition({ top: null, left: null, isDragging: false });
};

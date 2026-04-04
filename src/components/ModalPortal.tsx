import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/**
 * Renders children into document.body so position:fixed overlays use the viewport,
 * not a tall ancestor (e.g. Layout panels with backdrop-filter).
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

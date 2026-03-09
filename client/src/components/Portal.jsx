import { useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children }) {
  const container = useMemo(() => {
    let target = document.getElementById('modal-root');
    if (!target) {
      target = document.createElement('div');
      target.id = 'modal-root';
      document.body.appendChild(target);
    }
    return target;
  }, []);

  return createPortal(children, container);
}

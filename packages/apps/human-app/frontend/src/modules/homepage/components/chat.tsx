import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export function Chat({
  displayChatIcon = true,
}: {
  displayChatIcon?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    let chatElement: HTMLElement | undefined;
    const root = document.getElementById('root') as Element | undefined;
    if (!root) return;

    const positionChatElement = () => {
      if (chatElement && ref.current) {
        const refRect = ref.current.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();

        chatElement.style.position = 'absolute';
        if (displayChatIcon) {
          chatElement.style.opacity = '1';
          chatElement.style.top = `${(refRect.top - rootRect.top).toString()}px`;
          chatElement.style.right = isMobile ? '16px' : '80px';
          chatElement.style.width = `${refRect.width.toString()}px`;
          chatElement.style.height = `${refRect.height.toString()}px`;
        } else {
          chatElement.style.opacity = '0';
        }
      }
    };

    const mutationObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          chatElement = document.querySelector('[data-id="zsalesiq"]') as
            | HTMLElement
            | undefined;
          if (chatElement && ref.current) {
            positionChatElement();
          }
        }
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const resizeObserverElement = document.createElement('div');
    resizeObserverElement.style.position = 'absolute';
    resizeObserverElement.style.width = '100%';
    resizeObserverElement.style.height = '100%';
    resizeObserverElement.style.top = '0';
    resizeObserverElement.style.left = '0';
    resizeObserverElement.style.opacity = '0';
    resizeObserverElement.style.pointerEvents = 'none';
    document.body.appendChild(resizeObserverElement);

    const resizeObserver = new ResizeObserver(positionChatElement);

    resizeObserver.observe(resizeObserverElement);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (resizeObserverElement.parentNode) {
        resizeObserverElement.parentNode.removeChild(resizeObserverElement);
      }
    };
  }, [ref, displayChatIcon, isMobile]);

  return (
    <div
      ref={ref}
      style={{ width: '60px', height: '60px', position: 'relative' }}
    />
  );
}

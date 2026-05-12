import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useEffect } from 'react';

export function Chat({
  displayChatIcon = true,
}: {
  displayChatIcon?: boolean;
}) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const applyVisibility = () => {
      const chatElement = document.querySelector('[data-id="zsalesiq"]') as
        | HTMLElement
        | undefined;
      if (chatElement) {
        chatElement.style.opacity = displayChatIcon ? '1' : '0';
        chatElement.style.pointerEvents = displayChatIcon ? 'auto' : 'none';
        chatElement.childNodes.forEach((element, idx) => {
          if (element instanceof HTMLElement) {
            element.style.right = isMobile ? '16px' : '24px';
            if (idx === 1) {
              element.style.bottom = isMobile ? '16px' : '20px';
            }
          }
        });
        return true;
      }

      return false;
    };

    if (applyVisibility()) {
      return;
    }

    const mutationObserver = new MutationObserver(() => {
      if (applyVisibility()) {
        mutationObserver.disconnect();
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [displayChatIcon, isMobile]);

  return null;
}

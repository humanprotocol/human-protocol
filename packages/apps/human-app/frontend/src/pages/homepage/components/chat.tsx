import { useEffect, useRef } from 'react';

export function Chat() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          const chatElement = document.querySelector('[data-id="zsalesiq"]') as
            | HTMLElement
            | undefined;
          if (
            chatElement &&
            ref.current &&
            !ref.current.contains(chatElement)
          ) {
            chatElement.style.position = 'absolute';
            chatElement.style.top = '0';
            chatElement.style.bottom = '0';
            chatElement.style.right = '0';
            chatElement.style.left = '0';
            ref.current.appendChild(chatElement);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return (
    <div
      ref={ref}
      style={{ width: '60px', height: '60px', position: 'relative' }}
    />
  );
}

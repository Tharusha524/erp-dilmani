import React, { useEffect, useRef } from "react";

const READONLY_ATTR = "data-readonly-disabled";
// Dialog/Popover/Menu content is portaled straight to <body> by MUI, so it
// escapes this guard's own DOM subtree — swept separately below.
const OVERLAY_SELECTOR = ".MuiDialog-root, .MuiPopover-root, .MuiMenu-root";
const INTERACTIVE_SELECTOR = "input, textarea, select, button, [contenteditable='true']";
// App-chrome overlays (Sign Out confirmation, notifications, profile, etc.)
// aren't part of any page's own content, so "View only" must never touch
// them — mark those with this class (see MainLayout/NotificationCenter).
const EXEMPT_CLASS = "readonly-guard-exempt";

function disableWithin(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR).forEach((el) => {
    if (el.hasAttribute(READONLY_ATTR)) return;
    if (el.closest("[data-readonly-allow]")) return;
    el.setAttribute(READONLY_ATTR, "true");
    if ("disabled" in el) (el as HTMLInputElement).disabled = true;
    el.style.pointerEvents = "none";
    el.style.opacity = "0.6";
  });
}

function restoreWithin(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(`[${READONLY_ATTR}]`).forEach((el) => {
    el.removeAttribute(READONLY_ATTR);
    if ("disabled" in el) (el as HTMLInputElement).disabled = false;
    el.style.pointerEvents = "";
    el.style.opacity = "";
  });
}

/**
 * View-only enforcement that needs no changes inside individual pages: when
 * `readOnly`, disables every native form control inside this subtree, plus
 * inside any MUI Dialog/Popover/Menu mounted to <body> while this page is
 * active (those portal out of the subtree otherwise, e.g. action dialogs).
 * Dialogs can still be dismissed via backdrop click / Escape, since MUI's
 * onClose isn't gated by the disabled state of buttons inside it.
 */
export default function ReadOnlyGuard({
  readOnly,
  children,
}: {
  readOnly: boolean;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!readOnly || !containerRef.current) return;
    const container = containerRef.current;

    const isExempt = (el: Element) => el.classList.contains(EXEMPT_CLASS) || !!el.closest(`.${EXEMPT_CLASS}`);

    const sweep = () => {
      disableWithin(container);
      document
        .querySelectorAll(OVERLAY_SELECTOR)
        .forEach((overlay) => !isExempt(overlay) && disableWithin(overlay));
    };

    sweep();
    const observer = new MutationObserver(sweep);
    observer.observe(container, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: false });

    return () => {
      observer.disconnect();
      restoreWithin(container);
      document
        .querySelectorAll(OVERLAY_SELECTOR)
        .forEach((overlay) => !isExempt(overlay) && restoreWithin(overlay));
    };
  }, [readOnly]);

  return (
    <div ref={containerRef} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

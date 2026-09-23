import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, ChevronDown, Pencil, X } from "lucide-react";
import { money } from "./ui.jsx";
import "./budget-details.css";

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]';
const sourceLabel = (line) => line.missingPrice ? "价格待补充" : ({ official: "官方参考", free: "免费", included: "已包含", user: "你的记录", "user-preference": "你的偏好", excluded: "待填写", model: "规划估算", allowance: "预算预留" }[line.sourceType] || "参考预算");

/** A budget row and its compact, interactive detail card. */
export function BudgetPopover({ label, trigger, children, className = "", wide = false }) {
  const id = useId();
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimer = useRef(null);
  const pinned = useRef(false);
  const suppressFocus = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12, visibility: "hidden" });

  const cancelClose = useCallback(() => window.clearTimeout(closeTimer.current), []);
  const close = useCallback((restoreFocus = false) => {
    cancelClose();
    pinned.current = false;
    if (restoreFocus && document.activeElement !== triggerRef.current) {
      suppressFocus.current = true;
      triggerRef.current?.focus({ preventScroll: true });
    }
    setOpen(false);
  }, [cancelClose]);
  const show = () => {
    cancelClose();
    window.dispatchEvent(new CustomEvent("budget-detail-open", { detail: id }));
    setOpen(true);
  };
  const deferClose = () => {
    cancelClose();
    if (!pinned.current) closeTimer.current = window.setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement) && document.activeElement !== triggerRef.current) close();
    }, 180);
  };

  useEffect(() => {
    const otherOpened = (event) => { if (event.detail !== id) close(); };
    window.addEventListener("budget-detail-open", otherOpened);
    return () => { window.removeEventListener("budget-detail-open", otherOpened); cancelClose(); };
  }, [id, close, cancelClose]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!anchor || !panel) return;
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      const viewportLeft = viewport?.offsetLeft || 0;
      const viewportTop = viewport?.offsetTop || 0;
      const edge = 12;
      const left = viewportWidth >= 700 && anchor.left - viewportLeft >= panel.width + 24
        ? anchor.left - panel.width - 10
        : Math.min(anchor.right - panel.width, viewportLeft + viewportWidth - panel.width - edge);
      const top = viewportWidth < 700
        ? anchor.bottom + panel.height + 10 <= viewportTop + viewportHeight - edge ? anchor.bottom + 8 : anchor.top - panel.height - 8
        : anchor.top;
      setPosition({ left: Math.max(viewportLeft + edge, left), top: Math.max(viewportTop + edge, Math.min(top, viewportTop + viewportHeight - panel.height - edge)), maxWidth: viewportWidth - edge * 2, maxHeight: Math.min(660, viewportHeight - edge * 2), visibility: "visible" });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panelRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (!triggerRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) close(); };
    const escape = (event) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", outside); document.removeEventListener("keydown", escape); };
  }, [open, close]);

  const focusPanel = () => window.requestAnimationFrame(() => panelRef.current?.querySelector(FOCUSABLE)?.focus());
  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={`budget-detail-trigger ${className}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? id : undefined}
        aria-label={`${label}，查看明细`}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") show(); }}
        onPointerLeave={deferClose}
        onFocus={() => { if (suppressFocus.current) suppressFocus.current = false; else show(); }}
        onBlur={deferClose}
        onClick={() => { if (pinned.current && open) close(); else { pinned.current = true; show(); } }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || (event.key === "Tab" && open && !event.shiftKey)) {
            event.preventDefault(); pinned.current = true; show(); focusPanel();
          }
        }}
      >{trigger}</button>
      {open && createPortal(
        <div
          ref={panelRef}
          id={id}
          className={`budget-detail-popover${wide ? " budget-detail-wide" : ""}`}
          style={position}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${id}-title`}
          onPointerEnter={cancelClose}
          onPointerLeave={deferClose}
          onFocusCapture={cancelClose}
          onBlurCapture={deferClose}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const controls = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((node) => node.getClientRects().length);
            if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); close(true); }
            else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
              event.preventDefault();
              const outside = [...document.querySelectorAll(FOCUSABLE)].filter((node) => !panelRef.current.contains(node) && node.getClientRects().length);
              const next = outside[outside.indexOf(triggerRef.current) + 1];
              close();
              (next || triggerRef.current)?.focus();
            }
          }}
        >
          <div className="budget-detail-heading">
            <strong id={`${id}-title`}>{label}</strong>
            <button type="button" onClick={() => close(true)} aria-label={`关闭${label}明细`}><X size={16} /></button>
          </div>
          <div className="budget-detail-content">{children}</div>
        </div>, document.body,
      )}
    </>
  );
}

/** Shared line presentation; expanding a row keeps references out of the summary. */
export function BudgetLineDetails({ lines = [], currency = "CNY", onEditLine }) {
  if (!lines.length) return <p className="budget-detail-empty">这一项暂未产生费用。</p>;
  return <div className="budget-detail-lines">
    {lines.map((line) => <details className="budget-detail-line" key={line.id}>
      <summary>
        <span className="budget-line-name"><strong>{line.label}</strong><small>{Number(Number(line.quantity || 0).toFixed(2))} {line.unit} · {sourceLabel(line)}{line.confirmed && <Check size={12} aria-label="已核对" />}</small></span>
        <span className="budget-line-amount">{line.missingPrice ? "待补充" : money(line.amount, currency)}<ChevronDown size={13} /></span>
      </summary>
      <div className="budget-line-expanded">
        {!line.missingPrice && <p className="budget-line-range">参考区间 {money(line.low, currency)} — {money(line.high, currency)}</p>}
        {line.note && <p>{line.note}</p>}
        <div className="budget-line-actions">
          {line.sourceUrl && <a href={line.sourceUrl} target="_blank" rel="noopener noreferrer">{line.sourceName || "参考来源"}<ArrowUpRight size={12} /></a>}
          {onEditLine && <button type="button" onClick={() => onEditLine(line.id)}><Pencil size={12} />核对 / 修改金额</button>}
        </div>
        {line.checkedAt && <small className="budget-line-date">资料日期 {String(line.checkedAt).slice(0, 10)}</small>}
      </div>
    </details>)}
    <p className="budget-detail-note">以上金额已包含在总预算中，点击项目可查看计费方式与来源。</p>
  </div>;
}

export default BudgetPopover;

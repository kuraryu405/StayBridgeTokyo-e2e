import type { Page } from "@playwright/test";
import type { EvidenceOverlayPayload } from "./types";

export const OVERLAY_ID = "__staybridge_acceptance_overlay__";

/** Runs entirely in the target page; it intentionally has no imports or closures. */
function installOverlayRuntime(): void {
  const runtimeKey = "__staybridgeAcceptanceEvidenceRuntime__";
  const overlayId = "__staybridge_acceptance_overlay__";
  const globalRecord = globalThis as unknown as Record<string, unknown>;

  type Payload = {
    kind: string;
    step?: number;
    total?: number;
    acceptance?: string[];
    action?: string;
    detail?: string;
    verify?: string;
    expected?: string;
    actual?: string;
    from?: string;
    to?: string;
  };
  type Runtime = {
    payload: Payload;
    host?: HTMLElement;
    root?: ShadowRoot;
    render: (next?: Payload) => void;
  };

  const escape = (value: unknown): string =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const readableUrl = (value: string): string => {
    try {
      const url = new URL(value, location.href);
      return url.origin === location.origin
        ? `${url.pathname}${url.search}${url.hash}`
        : `${url.host}${url.pathname}${url.search}${url.hash}`;
    } catch {
      return value;
    }
  };

  const existing = globalRecord[runtimeKey] as Runtime | undefined;
  if (existing) {
    existing.render();
    return;
  }

  const runtime: Runtime = {
    payload: { kind: "READY", detail: "Acceptance test is ready" },
    render(next?: Payload): void {
      if (next) runtime.payload = next;
      if (!document.documentElement) return;

      let host = document.getElementById(overlayId) as HTMLElement | null;
      if (!host || runtime.host !== host || !runtime.root) {
        host?.remove();
        host = document.createElement("div");
        host.id = overlayId;
        host.setAttribute("data-qa-evidence", "true");
        host.setAttribute("aria-hidden", "true");
        host.inert = true;
        document.documentElement.append(host);
        runtime.host = host;
        // A closed root keeps QA narration visible to the video recorder while
        // preventing Playwright's target-facing text/role locators from
        // piercing the overlay and matching its duplicated assertion text.
        runtime.root = host.attachShadow({ mode: "closed" });
      }

      const root = runtime.root;
      if (!root) return;
      const p = runtime.payload;
      const criteria = p.acceptance?.length
        ? `<div class="criteria">${escape(p.acceptance.join(" / "))}</div>`
        : "";
      const step = p.step
        ? `<div class="step">STEP ${String(p.step).padStart(2, "0")}${p.total ? ` / ${String(p.total).padStart(2, "0")}` : ""}</div>`
        : "";
      const navigation =
        p.kind === "NAVIGATION"
          ? `<div class="navigation"><span>${escape(readableUrl(p.from ?? ""))}</span><b>→</b><span>${escape(readableUrl(p.to ?? ""))}</span></div>`
          : "";
      const detail = p.detail ? `<div class="detail">${escape(p.detail)}</div>` : "";
      const verify = p.verify ? `<div class="verify"><b>VERIFY</b>${escape(p.verify)}</div>` : "";
      const expected = p.expected ? `<div class="small"><b>EXPECTED</b>${escape(p.expected)}</div>` : "";
      const actual = p.actual ? `<div class="small"><b>ACTUAL</b>${escape(p.actual)}</div>` : "";
      const statusClass = p.kind === "PASS" ? "pass" : p.kind === "FAIL" ? "fail" : "";
      const statusText = p.kind === "PASS" ? "✓ PASS" : p.kind === "FAIL" ? "✕ FAIL" : escape(p.action ?? p.kind);

      root.innerHTML = `
        <style>
          :host { all: initial; }
          .panel { position: fixed; top: 16px; left: 16px; z-index: 2147483647;
            width: min(400px, calc(100vw - 32px)); box-sizing: border-box; pointer-events: none;
            color: #fff; background: rgba(9, 15, 27, .91); border: 1px solid rgba(255,255,255,.24);
            border-radius: 12px; box-shadow: 0 10px 35px rgba(0,0,0,.42); padding: 13px 15px;
            font: 600 13px/1.42 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: pre-wrap; overflow-wrap: anywhere; }
          .brand { color: #b8c7df; font-size: 10px; letter-spacing: .14em; margin-bottom: 7px; }
          .target { color: #91a4c0; font-size: 9px; float: right; letter-spacing: 0; }
          .step { color: #fff; margin-right: 8px; display: inline-block; }
          .criteria { color: #ffd166; display: inline-block; }
          .action { margin-top: 5px; font-size: 15px; color: #8dd7ff; }
          .detail { margin-top: 4px; font-weight: 500; }
          .verify, .small { margin-top: 7px; font-weight: 500; }
          .verify b, .small b { display: block; color: #a9b8ce; font-size: 10px; letter-spacing: .08em; }
          .navigation { margin-top: 5px; display: grid; gap: 2px; font-weight: 500; }
          .navigation b { color: #ffd166; }
          .pass { color: #6ee7a6; }
          .fail { color: #ff8a8a; }
          .url { margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,.15);
            color: #91a4c0; font-size: 9px; font-weight: 500; }
        </style>
        <section class="panel" role="status" aria-live="polite">
          <div class="brand">QA EVIDENCE <span class="target">TARGET ${escape(location.host)}</span></div>
          ${step}${criteria}
          <div class="action ${statusClass}">${statusText}</div>
          ${navigation}${detail}${verify}${expected}${actual}
          <div class="url">URL ${escape(`${location.pathname}${location.search}${location.hash}`)}</div>
        </section>`;
    },
  };
  globalRecord[runtimeKey] = runtime;

  const renderWhenReady = (): void => runtime.render();
  if (document.documentElement) renderWhenReady();
  else document.addEventListener("DOMContentLoaded", renderWhenReady, { once: true });

  // History API transitions do not emit Playwright frame navigation events.
  let previousUrl = location.href;
  const showSpaNavigation = (): void => {
    const nextUrl = location.href;
    if (nextUrl === previousUrl) return;
    const from = previousUrl;
    previousUrl = nextUrl;
    runtime.render({ kind: "NAVIGATION", action: "NAVIGATION", from, to: nextUrl });
  };
  const historyRecord = history as unknown as Record<string, unknown>;
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method];
    historyRecord[method] = function (this: History, ...args: Parameters<History[typeof method]>) {
      const result = original.apply(this, args);
      queueMicrotask(showSpaNavigation);
      return result;
    };
  }
  addEventListener("popstate", showSpaNavigation);
  addEventListener("hashchange", showSpaNavigation);
}

export async function installOverlay(page: Page): Promise<void> {
  // esbuild/tsx can retain a small `__name` helper in serialized callbacks.
  // Defining the inert helper in the page keeps this runtime portable without
  // exposing any overlay narration to the application DOM.
  const serializationShim =
    "if(typeof globalThis.__name!=='function'){globalThis.__name=(target,_name)=>target;}";
  await page.addInitScript({ content: serializationShim });
  await page.evaluate(serializationShim);
  await page.addInitScript(installOverlayRuntime);
  if (!page.isClosed()) await page.evaluate(installOverlayRuntime);
}

export async function showOverlay(page: Page, payload: EvidenceOverlayPayload): Promise<void> {
  if (page.isClosed()) return;
  await page.evaluate((next) => {
    const runtime = (
      globalThis as unknown as Record<
        string,
        { render?: (payload: typeof next) => void } | undefined
      >
    ).__staybridgeAcceptanceEvidenceRuntime__;
    runtime?.render?.(next);
  }, payload);
}

export async function clearOverlay(page: Page): Promise<void> {
  if (page.isClosed()) return;
  await page.evaluate((id) => document.getElementById(id)?.remove(), OVERLAY_ID);
}

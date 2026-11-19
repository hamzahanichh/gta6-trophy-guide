/* drawer.js — the settings drawer: the settings view's own section in an overlay panel, so the view behind it
   stays on screen — the tracker keeps its spoiler-censored rows visible while settings are checked. boot.js
   calls toggleSettingsDrawer when the nav's Settings link is used outside the settings view; #/settings
   remains the full-page deep link. Reached by import() only when first used. */

import { renderSettings } from './view-settings.js';

let open = null;

/** Close the drawer: restore the escape chain and the page's scroll, return focus to what opened it. */
export function closeSettingsDrawer() {
  if (open === null) return;
  const { wrap, ctx, mine, previousEscape, previousOverflow, opener, onHash } = open;
  open = null;
  removeEventListener('hashchange', onHash);
  if (ctx.onEscape === mine) ctx.onEscape = previousEscape;
  document.body.style.overflow = previousOverflow;
  wrap.remove();
  if (opener && document.contains(opener)) opener.focus();
}

/** The nav's Settings link: open the drawer over the current view, or close it when it is already open. */
export function toggleSettingsDrawer(ctx, opener) {
  if (open !== null) {
    closeSettingsDrawer();
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'drawer-wrap';
  const back = document.createElement('div');
  back.className = 'drawer-back';
  const panel = document.createElement('div');
  panel.className = 'drawer';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Settings');

  const head = document.createElement('div');
  head.className = 'drawer-head';
  const h2 = document.createElement('h2');
  h2.textContent = 'Settings';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'drawer-close';
  close.setAttribute('aria-label', 'Close settings');
  close.textContent = '\u2715';
  head.append(h2, close);

  const body = renderSettings(ctx);
  body.el.classList.add('drawer-body');
  panel.append(head, body.el);
  wrap.append(back, panel);
  document.body.append(wrap);

  const mine = () => closeSettingsDrawer();
  const onHash = () => closeSettingsDrawer();
  open = {
    wrap,
    ctx,
    mine,
    previousEscape: ctx.onEscape,
    previousOverflow: document.body.style.overflow,
    opener: opener ?? null,
    onHash,
  };
  document.body.style.overflow = 'hidden';
  ctx.onEscape = mine;
  addEventListener('hashchange', onHash);
  back.addEventListener('click', closeSettingsDrawer);
  close.addEventListener('click', closeSettingsDrawer);
  close.focus();
}

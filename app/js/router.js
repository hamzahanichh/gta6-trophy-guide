/* router.js — hash routing. The tracker lives at #/ carrying its filter state in the hash (#/?f=missable&q=stunt&s=grade),
   the roadmap at #/roadmap, one trophy's page at #/trophy/<id>, settings at #/settings. The three later views are
   fetched by relative import() the first time they are navigated to, so they never weigh down the first load. */

import { renderTracker } from './view-tracker.js';

const DEFAULT_PARAMS = { f: 'all', q: '', s: 'official' };

/** The route a hash names: a view, an optional trophy id, and the tracker's filter params. */
export function parseHash(hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query] = raw.split('?');
  const params = { ...DEFAULT_PARAMS };
  for (const [key, value] of new URLSearchParams(query ?? '')) params[key] = value;
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { view: 'tracker', params };
  if (parts[0] === 'roadmap') return { view: 'roadmap', params };
  if (parts[0] === 'settings') return { view: 'settings', params };
  if (parts[0] === 'trophy' && parts[1]) return { view: 'trophy', id: parts[1], params };
  return { view: 'tracker', params };
}

/** The hash that a view with these params would sit at. */
export function hashOfTracker(params) {
  const query = new URLSearchParams();
  if (params.f && params.f !== 'all') query.set('f', params.f);
  if (params.q) query.set('q', params.q);
  if (params.s && params.s !== 'official') query.set('s', params.s);
  const qs = query.toString();
  return qs ? `#/?${qs}` : '#/';
}

export function startRouter(ctx) {
  const mount = document.getElementById('view');
  const nav = document.getElementById('nav');
  let current = null;

  const setNav = (name) => {
    for (const a of nav.querySelectorAll('a')) {
      if (a.dataset.view === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  };

  async function show() {
    const route = parseHash(location.hash);
    ctx.route = route;
    ctx.viewName = route.view;

    /* same view, new params: the tracker updates in place and keeps the caret */
    if (current?.name === 'tracker' && route.view === 'tracker') {
      current.api.update(route);
      return;
    }

    if (current) current.api.dispose();
    let next;
    if (route.view === 'tracker') {
      next = { name: 'tracker', api: renderTracker(ctx, route) };
    } else if (route.view === 'roadmap') {
      const { renderRoadmap } = await import('./view-roadmap.js');
      next = { name: 'roadmap', api: renderRoadmap(ctx, route) };
    } else if (route.view === 'trophy') {
      const trophy = ctx.byId.get(route.id);
      if (!trophy) {
        location.hash = '#/';
        return;
      }
      const { renderTrophy } = await import('./view-trophy.js');
      next = { name: 'trophy', api: renderTrophy(ctx, trophy) };
    } else {
      const { renderSettings } = await import('./view-settings.js');
      next = { name: 'settings', api: renderSettings(ctx, route) };
    }
    current = next;
    mount.replaceChildren(current.api.el);
    setNav(current.name);
    if (ctx.wantSearch) {
      ctx.wantSearch = false;
      ctx.focusSearch?.();
    }
  }

  /** Filter, search and sort changes rewrite the hash without a history entry, then re-show. */
  ctx.setParams = (patch) => {
    const params = { ...(ctx.route?.params ?? DEFAULT_PARAMS), ...patch };
    history.replaceState(null, '', location.pathname + hashOfTracker(params));
    show();
  };

  /** A view that changes its own state (a reveal, a toggle) re-shows the same hash. */
  ctx.show = show;

  addEventListener('hashchange', show);
  show();
}

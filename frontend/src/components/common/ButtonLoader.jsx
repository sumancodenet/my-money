import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { loaderStore } from '../../services/loaderStore';

/**
 * Professional button-level loader — shows a loader on every button click.
 *
 * How it works:
 * - Background API calls (page load, filter auto-load) show no loader.
 * - When a button is clicked and that click starts an API request,
 *   a spinner appears inside the same button until the request completes.
 * - Non-API buttons (modal open, navigation, filter toggle) show no loader.
 *
 * Opt-out: add data-no-loader to any button that should not show a loader:
 *   <button data-no-loader>...</button>
 *
 * Buttons that manage their own loading state (disabled + text swap,
 * e.g. Login/Register) are skipped — their own spinner + text handles it.
 */

const CLICK_CHECK_DELAY = 120; // ms — whether an API started after the click
const HIDE_DEBOUNCE = 250; // ms — hide once requests stay at 0 (chained calls)

export function ButtonLoaderTracker() {
  useEffect(() => {
    const live = new Set(); // { button, unsub, timers } — for cleanup

    const onClick = (e) => {
      if (!(e.target instanceof Element)) return;
      const btn = e.target.closest('button');
      if (!btn || btn.disabled || btn.dataset.noLoader) return;

      const before = loaderStore.getState().active;

      const checkTimer = setTimeout(() => {
        // Button disabled itself → the page manages its own loading state
        if (btn.disabled) return;
        // No new API started after this click → non-API action (modal/nav)
        if (loaderStore.getState().active <= before) return;

        btn.classList.add('btn-auto-loading');

        let stableTimer = null;
        let safetyTimer = null;
        let unsub = null;

        const cleanup = () => {
          btn.classList.remove('btn-auto-loading');
          clearTimeout(stableTimer);
          clearTimeout(safetyTimer);
          if (unsub) { unsub(); unsub = null; }
          live.delete(entry);
        };

        const entry = {};
        live.add(entry);

        unsub = loaderStore.subscribe(({ active }) => {
          if (active === 0) {
            if (!stableTimer) stableTimer = setTimeout(cleanup, HIDE_DEBOUNCE);
          } else {
            clearTimeout(stableTimer);
            stableTimer = null;
          }
        });

        // Network hang safety — auto cleanup after 30s
        safetyTimer = setTimeout(cleanup, 30000);
      }, CLICK_CHECK_DELAY);

      live.add({ checkTimer });
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      live.forEach((entry) => {
        if (entry.checkTimer) clearTimeout(entry.checkTimer);
        if (entry.unsub) entry.unsub();
      });
      live.clear();
    };
  }, []);

  return null;
}

/** Inline spinner — buttons / small inline use. */
export function InlineLoader({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`loader-spin inline-block shrink-0 ${className}`} />;
}

/**
 * Reusable loading button — for future pages.
 * Usage: <LoadingButton loading={saving} onClick={save} className="btn-primary">Save</LoadingButton>
 */
export function LoadingButton({ loading, loadingText = 'Loading…', children, className = '', disabled, ...props }) {
  return (
    <button disabled={loading || disabled} className={className} {...props}>
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <InlineLoader size={15} />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

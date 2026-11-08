import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { loaderStore } from '../../services/loaderStore';

/**
 * Professional button-level loader — har button click par loader.
 *
 * Kaam kaise karta hai:
 * - Background API calls (page load, filters auto-load) par koi loader nahi.
 * - Jab koi button click hota hai aur us click se API start hoti hai,
 *   to usi button ke andar spinner aa jata hai jab tak request complete na ho.
 * - Modal open / navigation / filter toggle jaise non-API buttons par loader nahi.
 *
 * Opt-out: kisi button ko loader nahi chahiye to data-no-loader laga do:
 *   <button data-no-loader>...</button>
 *
 * Buttons jo khud apna loading state manage kar rahe hain (disabled + text
 * swap, e.g. Login/Register) un par yeh overlay nahi lagega — unke apne
 * spinner + text handle karte hain.
 */

const CLICK_CHECK_DELAY = 120; // ms — click ke baad API start hua ya nahi
const HIDE_DEBOUNCE = 250; // ms — requests 0 stable rahne par hide (chained calls)

export function ButtonLoaderTracker() {
  useEffect(() => {
    const live = new Set(); // { button, unsub, timers } — cleanup ke liye

    const onClick = (e) => {
      if (!(e.target instanceof Element)) return;
      const btn = e.target.closest('button');
      if (!btn || btn.disabled || btn.dataset.noLoader) return;

      const before = loaderStore.getState().active;

      const checkTimer = setTimeout(() => {
        // Button khud disable ho gaya → page apna loading state manage kar raha hai
        if (btn.disabled) return;
        // Click ke baad koi naya API start nahi hua → non-API action (modal/nav)
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

        // Network hang safety — 30s baad auto cleanup
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
 * Reusable loading button — future pages ke liye.
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

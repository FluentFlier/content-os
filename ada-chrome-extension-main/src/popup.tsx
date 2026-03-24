// Theme init to prevent flash (must run before render)
(function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  try {
    chrome.storage.local.get('theme', (r: Record<string, string>) => {
      const t = r.theme || (prefersDark ? 'dark' : 'light');
      document.documentElement.dataset.theme = t;
    });
  } catch {
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
  }
})();

import { render } from 'preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { PopupState, Category, MetaDataMessage, AuthStatusMessage, SaveResultMessage } from './types';
import { classify } from './services/classifier';
import { signInWithEmail, fetchProfile } from './services/auth';
import { CONFIG } from './config';
import { Preview } from './components/Preview';
import { CategoryBadge } from './components/CategoryBadge';
import { NoteInput } from './components/NoteInput';
import { SuccessState } from './components/SuccessState';
import { AuthPrompt } from './components/AuthPrompt';
import { ErrorState } from './components/ErrorState';
import { LoadingState } from './components/LoadingState';

interface PageData {
  url: string;
  title: string;
  description?: string;
  selectedText?: string;
  ogImage?: string;
  favicon?: string;
}

function Popup() {
  const [state, setState] = useState<PopupState>('loading');
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [category, setCategory] = useState<Category>('other');
  const [userNote, setUserNote] = useState('');
  const [error, setError] = useState('');
  const [savedCategory, setSavedCategory] = useState<Category | undefined>();
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    init();
    return () => { mountedRef.current = false; };
  }, []);

  async function init() {
    try {
      const authResponse: AuthStatusMessage = await chrome.runtime.sendMessage({
        type: 'AUTH_CHECK',
      });

      if (!mountedRef.current) return;

      if (!authResponse.authenticated) {
        // Background service worker may fail to verify via API because
        // MV3 workers can't reliably send cookies with fetch.
        // Retry from the popup context where credentials: 'include' works.
        const user = await fetchProfile();
        if (!mountedRef.current) return;
        if (!user) {
          setState('auth');
          return;
        }
      }

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!mountedRef.current) return;

      if (!tab?.id || !tab.url) {
        setError('Cannot access this page');
        setState('error');
        return;
      }

      let meta: MetaDataMessage | null = null;
      try {
        meta = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_META' });
      } catch {
        // Content script not available on this page
      }

      if (!mountedRef.current) return;

      const data: PageData = {
        url: meta?.url ?? tab.url,
        title: meta?.ogTitle ?? meta?.title ?? tab.title ?? '',
        description: meta?.description,
        selectedText: meta?.selectedText,
        ogImage: meta?.ogImage,
        favicon: meta?.favicon ?? tab.favIconUrl,
      };

      setPageData(data);

      const result = classify(
        data.url,
        data.selectedText ?? data.description ?? data.title
      );
      setCategory(result.category);

      setState('preview');
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('[Ada] Init error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
      setState('error');
    }
  }

  const handleGoogleSignIn = useCallback(async () => {
    setAuthLoading(true);
    setAuthError('');
    // Send to background — it opens the tab and watches for completion.
    // The popup will close when the tab opens (Chrome behavior).
    // When the user reopens the popup, init() will find the session.
    await chrome.runtime.sendMessage({ type: 'GOOGLE_SIGN_IN' });
    // Popup will likely close here, but just in case it stays open:
    if (mountedRef.current) setAuthLoading(false);
  }, []);

  const handleEmailSignIn = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmail(email, password);
      if (!mountedRef.current) return;
      setState('loading');
      await init();
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('[Ada] Email auth error:', err);
      setAuthError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      if (mountedRef.current) setAuthLoading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!pageData || saving) return;
    setSaving(true);
    setState('saving');

    try {
      const response: SaveResultMessage = await chrome.runtime.sendMessage({
        type: 'SAVE_ITEM',
        payload: {
          url: pageData.url,
          title: pageData.title,
          description: pageData.description,
          selectedText: pageData.selectedText,
          ogImage: pageData.ogImage,
          userNote: userNote.trim() || undefined,
          saveAndAct: false,
        },
      });

      if (!mountedRef.current) return;

      if (response.success) {
        setSavedCategory(
          (response.heuristicCategory as Category) ?? category
        );
        setState('success');
        setTimeout(() => { window.close(); }, CONFIG.timing.successDismissMs);
      } else {
        const msg = sanitizeErrorMessage(response.error);
        setError(msg);
        setState('error');
        setSaving(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('[Ada] Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
      setState('error');
      setSaving(false);
    }
  }, [pageData, userNote, category, saving]);

  const handleRetry = useCallback(() => {
    setSaving(false);
    setState('loading');
    init();
  }, []);

  return (
    <div class="popup-container">
      <header class="popup-header">
        <div class="header-logo">
          <svg width="24" height="24" viewBox="0 0 120 120" fill="none">
            <rect width="120" height="120" rx="26" fill="#1A1612" />
            <text x="52" y="78" text-anchor="middle" fill="white" font-size="52" font-weight="800" font-family="system-ui, -apple-system, sans-serif">ada</text>
            <circle cx="97" cy="74" r="6" fill="#EB5E55" />
          </svg>
          <span class="header-title">Ada</span>
        </div>
      </header>

      <main class="popup-content">
        {state === 'auth' && (
          <AuthPrompt
            onGoogleSignIn={handleGoogleSignIn}
            onEmailSignIn={handleEmailSignIn}
            loading={authLoading}
            error={authError}
          />
        )}

        {state === 'loading' && <LoadingState />}

        {state === 'preview' && pageData && (
          <>
            <Preview
              title={pageData.title}
              url={pageData.url}
              description={pageData.description}
              selectedText={pageData.selectedText}
              favicon={pageData.favicon}
            />
            <CategoryBadge category={category} />
            <NoteInput value={userNote} onChange={setUserNote} />
            <button
              class="btn btn-primary save-btn slide-up"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save to Ada'}
            </button>
          </>
        )}

        {state === 'saving' && (
          <div class="loading-state fade-in">
            <div class="spinner" />
            <div class="loading-text">Saving...</div>
          </div>
        )}

        {state === 'success' && <SuccessState category={savedCategory} />}

        {state === 'error' && <ErrorState message={error} onRetry={handleRetry} />}
      </main>

      {state === 'preview' && (
        <footer class="popup-footer">
          <span class="shortcut-hint">
            {navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+A
          </span>
        </footer>
      )}
    </div>
  );
}

function sanitizeErrorMessage(raw?: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  const stripped = raw.replace(/<[^>]*>/g, '').trim();
  if (!stripped || stripped.length > 200) return 'Something went wrong. Please try again.';
  return stripped;
}

render(<Popup />, document.getElementById('app')!);

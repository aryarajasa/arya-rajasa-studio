import { motion, AnimatePresence } from 'motion/react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowUpRight, Moon, Sun } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import Loader from './components/Loader';
import Logo from './components/Logo';
import Home from './pages/Home';
import Story from './pages/Story';
import Playbook from './pages/Playbook';
import Project from './pages/Project';
import { content } from './content';

// The admin UI only works against the Vite dev server (it writes site.json
// through dev-only middleware), so it is compiled out of production builds:
// `import.meta.env.DEV` is statically false there, which lets Rollup drop the
// branch and the dynamic import with it.
const AdminApp = import.meta.env.DEV ? lazy(() => import('./admin/AdminApp')) : null;

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Show loading screen only on the user's first visit per session
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const hasVisited = window.sessionStorage.getItem('arya-visited');
      return !hasVisited;
    } catch {
      return true;
    }
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = window.localStorage.getItem('arya-theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.localStorage.setItem('arya-theme', isDarkMode ? 'dark' : 'light');

    // Dynamically update favicon based on active theme
    const faviconEl = document.getElementById('favicon') as HTMLLinkElement | null;
    if (faviconEl) {
      faviconEl.href = `${import.meta.env.BASE_URL}favicon-${isDarkMode ? 'dark' : 'light'}.png`;
    }
  }, [isDarkMode]);

  // Global scroll detector across any scrollable <main> or window container
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      const scrollTop =
        target instanceof HTMLElement
          ? target.scrollTop
          : window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  // Reset scroll state when navigating between routes
  useEffect(() => {
    setIsScrolled(false);
  }, [location.pathname]);

  const handleLoaderComplete = () => {
    setIsLoading(false);
    try {
      window.sessionStorage.setItem('arya-visited', 'true');
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  // Admin renders standalone — no site header, footer, cursor or loader.
  if (AdminApp && location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="p-8 text-neutral-400">loading editor…</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(content.site.email);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };

  const toggleTheme = () => setIsDarkMode((current) => !current);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <Loader key="loader" onComplete={handleLoaderComplete} />
        )}
      </AnimatePresence>

      <div className="h-[100dvh] flex flex-col justify-between overflow-hidden">
        <CustomCursor />
        
        <header className={`px-6 md:px-8 lg:px-16 transition-all duration-300 shrink-0 z-30 ${isScrolled ? 'pt-2 pb-1.5' : 'pt-[18px] pb-3'}`}>
          {/* Mobile Header */}
          <div className="flex md:hidden w-full justify-between items-center z-50 relative">
            <div className="w-8" />
            <Logo isScrolled={isScrolled} />
            <button 
              className="text-neutral-900 select-none z-50 relative focus:outline-none" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? 'close' : 'menu'}
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-3 items-center w-full">
            <nav className="flex items-center gap-8 md:gap-16 justify-start">
              <Link to="/story" className="hover:text-neutral-500 transition-colors">story</Link>
              <a href="#" className="hover:text-neutral-500 transition-colors">designs</a>
            </nav>

            <div className="flex justify-center items-center">
              <Logo isScrolled={isScrolled} />
            </div>

            <nav className="flex items-center gap-8 md:gap-16 justify-end">
              <Link to="/playbook" className="hover:text-neutral-500 transition-colors">playbook</Link>
              <a href="#" onClick={handleCopyEmail} className="flex items-center gap-1 hover:text-neutral-500 transition-colors">
                {isCopied ? "email copied!" : "contact"} {!isCopied && <ArrowUpRight size={12} strokeWidth={1.5} />}
              </a>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="text-neutral-900 hover:text-neutral-500 transition-colors focus:outline-none cursor-pointer"
              >
                {isDarkMode ? <Sun size={13} strokeWidth={1.5} /> : <Moon size={13} strokeWidth={1.5} />}
              </button>
            </nav>
          </div>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
                transition={{ duration: 0.6, ease: [0.85, 0, 0.15, 1] }}
                className="fixed inset-0 bg-white z-40 flex flex-col md:hidden pt-32 pb-16 px-4"
              >
                <div className="flex-1 flex flex-col items-center justify-around w-full">
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Link to="/story" className="hover:text-neutral-500 transition-colors" onClick={() => setIsMenuOpen(false)}>story</Link>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <a href="#" className="hover:text-neutral-500 transition-colors" onClick={() => setIsMenuOpen(false)}>designs</a>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                    <Link to="/playbook" className="hover:text-neutral-500 transition-colors" onClick={() => setIsMenuOpen(false)}>playbook</Link>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <a href="#" onClick={(e) => { handleCopyEmail(e); setTimeout(() => setIsMenuOpen(false), 1000); }} className="flex items-center gap-1 hover:text-neutral-500 transition-colors">
                      {isCopied ? "email copied!" : "contact"} {!isCopied && <ArrowUpRight size={12} strokeWidth={1.5} />}
                    </a>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                      className="flex items-center gap-2 hover:text-neutral-500 transition-colors focus:outline-none"
                    >
                      {isDarkMode ? <Sun size={13} strokeWidth={1.5} /> : <Moon size={13} strokeWidth={1.5} />}
                      {isDarkMode ? 'light mode' : 'dark mode'}
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Cross-fade between pages. `mode="wait"` lets the outgoing page
            finish before the next one enters, and passing `location` into
            Routes keeps the exiting copy rendering its own route instead of
            snapping to the new one mid-exit. The wrapper carries the flex
            sizing the pages expect from the shell. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/story" element={<Story />} />
              <Route path="/playbook" element={<Playbook />} />
              <Route path="/project/:slug" element={<Project />} />
              {/* Legacy single-project URL from before per-project pages. */}
              <Route path="/project" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>

        <footer className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-4 md:gap-16 px-6 md:px-8 lg:px-16 py-3 shrink-0 z-10 relative bg-white">
          <p className="hidden md:block select-none text-neutral-900">{content.site.copyright}</p>
          <div className="flex flex-wrap gap-8 md:gap-16">
            {content.site.socials.map((social) => (
              <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">{social.label}</a>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}

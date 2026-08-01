import { motion, AnimatePresence } from 'motion/react';
import React, { lazy, Suspense, useState } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import Loader from './components/Loader';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const location = useLocation();

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

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <Loader key="loader" onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      <div className="h-[100dvh] flex flex-col justify-between overflow-hidden">
        <CustomCursor />
        
        <header className="flex flex-col md:flex-row justify-between items-center md:gap-16 px-6 md:px-8 lg:px-16 pt-[18px] pb-3 shrink-0">
          <div className="flex w-full md:w-auto justify-between items-center z-50 relative">
            <div className="flex flex-col gap-[2px]">
              <Link to="/" className="select-none hover:text-neutral-500 transition-colors">
                <h1>{content.site.title}</h1>
              </Link>
              <p className="text-neutral-400 select-none">{content.site.role}</p>
            </div>
            <div className="flex items-center">
              <button 
                className="md:hidden text-neutral-900 select-none z-50 relative focus:outline-none" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? 'close' : 'menu'}
              </button>
            </div>
          </div>

          <nav className="hidden md:flex flex-wrap items-center gap-8 md:gap-16">
            <Link to="/story" className="hover:text-neutral-500 transition-colors">story</Link>
            <a href="#" className="hover:text-neutral-500 transition-colors">designs</a>
            <Link to="/playbook" className="hover:text-neutral-500 transition-colors">playbook</Link>
            <a href="#" onClick={handleCopyEmail} className="flex items-center gap-1 hover:text-neutral-500 transition-colors">
              {isCopied ? "email copied!" : "contact"} {!isCopied && <ArrowUpRight size={12} strokeWidth={1.5} />}
            </a>
          </nav>

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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/story" element={<Story />} />
          <Route path="/playbook" element={<Playbook />} />
          <Route path="/project/:slug" element={<Project />} />
          {/* Legacy single-project URL from before per-project pages. */}
          <Route path="/project" element={<Navigate to="/" replace />} />
        </Routes>

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

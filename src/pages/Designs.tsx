import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import SEO from '../components/SEO';
import { projectsList } from '../content';

export default function Designs() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setShowScrollTop(scrollRef.current.scrollTop > 200);
      }
    };

    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main
      ref={scrollRef}
      className="flex-1 overflow-y-auto relative bg-white pb-32 px-6 md:px-8 lg:px-16"
    >
      <SEO
        title="designs"
        description="All selected works, brand identities, and visual systems by Arya Rajasa Studio."
      />

      {/* Header section */}
      <section className="pt-16 md:pt-24 pb-12 md:pb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-neutral-200/60 dark:border-neutral-800">
        <div className="flex flex-col gap-3 max-w-xl">
          <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-mono">
            archive / selected works
          </span>
          <p className="text-neutral-900 text-sm md:text-base leading-relaxed select-none">
            Selected brand identities, packaging, digital experiences, and visual systems crafted for modern businesses.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
          <span>total projects:</span>
          <span className="text-neutral-900 font-medium font-sans text-xs">
            {String(projectsList.length).padStart(2, '0')}
          </span>
        </div>
      </section>

      {/* Editorial Projects Grid */}
      <section className="pt-12 md:pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-16 md:gap-y-20">
          {projectsList.map((project, idx) => (
            <div
              key={project.slug}
              className="flex flex-col gap-3 group cursor-pointer select-none"
              onClick={() => navigate(`/project/${project.slug}`)}
            >
              {/* Card Meta Top */}
              <div className="flex items-baseline justify-between gap-4 text-xs">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-neutral-400 font-mono text-[10px]">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <span className="text-neutral-900 font-medium group-hover:text-neutral-500 transition-colors truncate">
                    {project.name}
                  </span>
                </div>
                <span className="text-neutral-400 text-[11px] shrink-0">
                  {project.caseStudy.meta.year || project.details}
                </span>
              </div>

              {/* Card Thumbnail */}
              <div className="w-full aspect-[4/3] bg-[#e5e5e5] rounded-[2px] overflow-hidden relative">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                    {project.name}
                  </div>
                )}

                {/* Subtle Hover Action Pill */}
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 pointer-events-none">
                  <span>view project</span>
                  <ArrowUpRight size={10} strokeWidth={2} />
                </div>
              </div>

              {/* Card Meta Bottom */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                <span className="truncate">{project.details}</span>
                <span className="text-neutral-500 font-mono text-[10px] uppercase">
                  {project.caseStudy.meta.industry || 'branding'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Back to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 mb-6 w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center z-50 focus:outline-none cursor-pointer shadow-sm hover:scale-105 transition-transform"
          aria-label="Scroll to top"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </main>
  );
}

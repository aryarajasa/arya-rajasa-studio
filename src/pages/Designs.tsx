import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import SEO from '../components/SEO';
import { projectsList, Project } from '../content';

type ViewMode = 'grid' | 'index';

export default function Designs() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  const projectCount = String(projectsList.length).padStart(2, '0');

  return (
    <main
      ref={scrollRef}
      className="flex-1 px-6 md:px-8 lg:px-16 pt-3 md:pt-4 overflow-y-auto w-full pb-32"
    >
      <SEO
        title="designs"
        description="Comprehensive archive of all brand identities, visual systems, and graphic design projects by Arya Rajasa Studio."
      />

      {/* Top Editorial Header */}
      <section className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-6 md:mb-8 select-none">
        <div className="flex items-baseline gap-3">
          <p className="text-neutral-900">
            all works
          </p>
          <span className="text-neutral-400 text-[11px]">
            ({projectCount})
          </span>
        </div>

        {/* View Switcher: Grid vs Index */}
        <div className="flex items-center gap-6 text-[11px]">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`transition-colors focus:outline-none cursor-pointer ${
              viewMode === 'grid'
                ? 'text-neutral-900 font-medium underline underline-offset-4'
                : 'text-neutral-400 hover:text-neutral-900'
            }`}
          >
            grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('index')}
            className={`transition-colors focus:outline-none cursor-pointer ${
              viewMode === 'index'
                ? 'text-neutral-900 font-medium underline underline-offset-4'
                : 'text-neutral-400 hover:text-neutral-900'
            }`}
          >
            index
          </button>
        </div>
      </section>

      {/* 1. Grid View: Asymmetric Editorial Gallery */}
      {viewMode === 'grid' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 md:gap-x-12 gap-y-8 md:gap-y-10 lg:gap-y-12">
          {projectsList.map((project: Project, idx: number) => {
            const indexNumber = String(idx + 1).padStart(2, '0');
            const meta = project.caseStudy?.meta;

            return (
              <article
                key={project.slug}
                onClick={() => navigate(`/project/${project.slug}`)}
                className="group flex flex-col gap-2 cursor-pointer select-none"
              >
                {/* Header line above card */}
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-neutral-400 text-[11px] font-mono">
                      {indexNumber}
                    </span>
                    <span className="text-neutral-900 font-medium group-hover:text-neutral-500 transition-colors">
                      {project.name}
                    </span>
                  </div>
                  <span className="text-neutral-400 text-right text-[11px]">
                    {project.details}
                  </span>
                </div>

                {/* Image Canvas */}
                <div className="w-full aspect-[4/3] bg-[#e5e5e5] rounded-[2px] overflow-hidden relative">
                  {project.image && (
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Metadata footer below card */}
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>
                    {meta?.industry ? `${meta.industry}` : 'brand design'}
                  </span>
                  <span>{meta?.year || '2025'}</span>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* 2. Index View: Minimalist Editorial Archive Table */}
      {viewMode === 'index' && (
        <section className="w-full select-none divide-y divide-neutral-200 border-t border-b border-neutral-200">
          {/* Header Row */}
          <div className="grid grid-cols-12 py-3 text-[11px] uppercase tracking-wider text-neutral-400">
            <span className="col-span-1">no.</span>
            <span className="col-span-4 md:col-span-4">project</span>
            <span className="col-span-4 md:col-span-4">discipline</span>
            <span className="hidden md:block md:col-span-2">industry</span>
            <span className="col-span-3 md:col-span-1 text-right">year</span>
          </div>

          {/* Project Rows */}
          {projectsList.map((project: Project, idx: number) => {
            const indexNumber = String(idx + 1).padStart(2, '0');
            const meta = project.caseStudy?.meta;

            return (
              <div
                key={project.slug}
                onClick={() => navigate(`/project/${project.slug}`)}
                className="group grid grid-cols-12 items-center py-4 cursor-pointer hover:bg-neutral-50 transition-colors -mx-2 px-2 rounded-[2px]"
              >
                <span className="col-span-1 text-neutral-400 text-[11px] font-mono">
                  {indexNumber}
                </span>

                <span className="col-span-4 md:col-span-4 text-neutral-900 group-hover:text-neutral-500 transition-colors font-medium flex items-center gap-1">
                  {project.name}
                  <ArrowUpRight
                    size={11}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                </span>

                <span className="col-span-4 md:col-span-4 text-neutral-400 text-[11px] truncate">
                  {meta?.services?.join(', ') || project.details.replace(/[()]/g, '')}
                </span>

                <span className="hidden md:block md:col-span-2 text-neutral-400 text-[11px]">
                  {meta?.industry || 'design'}
                </span>

                <span className="col-span-3 md:col-span-1 text-right text-neutral-400 text-[11px]">
                  {meta?.year || '2025'}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="md:hidden fixed bottom-6 right-6 mb-6 w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center z-50 focus:outline-none"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </main>
  );
}

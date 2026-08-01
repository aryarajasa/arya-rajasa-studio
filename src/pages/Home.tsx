import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import ProjectSlider from '../components/ProjectSlider';
import { content, projectsList, Project } from '../content';

export function Slideshow({ items = projectsList }: { items?: Project[] }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Stacked View */}
      <div className="md:hidden flex flex-col px-6 gap-12 pt-8 pb-32">
        {items.map((p) => (
          <div
            key={p.slug}
            className="w-full flex flex-col gap-4 select-none cursor-pointer"
            onClick={() => navigate(`/project/${p.slug}`)}
          >
            <div className="flex justify-between items-start gap-4">
              <span className="shrink-0">{p.name}</span>
              <span className="text-neutral-400 text-right">{p.details}</span>
            </div>
            <div className="w-full aspect-[4/3] bg-[#e5e5e5] rounded-[2px] overflow-hidden">
              {/* A project with no thumbnail yet keeps the grey box. */}
              {p.image && (
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop two-up auto-sliding view */}
      <div className="hidden md:block md:h-full px-8 lg:px-16">
        <ProjectSlider items={items} />
      </div>
    </>
  );
}

export default function Home() {
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
    <main ref={scrollRef} className="flex-1 flex flex-col min-h-0 relative overflow-y-auto md:overflow-hidden">
      <section className="px-6 md:px-8 lg:px-16 max-w-[480px] mt-[5vh] md:mt-[10vh] shrink-0">
        <p className="select-none">
          {content.home.intro}
        </p>
      </section>

      <section className="w-full max-md:mt-8 max-md:mb-4 max-md:pb-16 max-md:shrink-0 md:flex-1 md:min-h-0 md:mt-6">
        <Slideshow />
      </section>

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

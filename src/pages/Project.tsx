import { useEffect, useState, useRef } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Slideshow } from './Home';
import { content, findProject, projectsList, Block } from '../content';

// Images are optional while a project is still being filled in, and an <img>
// with an empty src re-requests the page. Hold the space with the grey box
// used everywhere else instead.
function Media({ src, className }: { src: string; className: string }) {
  if (!src) return <div className={`${className} bg-neutral-100`} />;
  return <img src={src} alt="" className={`${className} object-cover bg-neutral-100`} />;
}

function CaseStudyBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return (
        <div className="max-w-3xl flex flex-col gap-6">
          <h2 className="text-neutral-900">{block.heading}</h2>
          {block.paragraphs.map((text, i) => (
            <p key={i} className="text-neutral-900 leading-relaxed">
              {text}
            </p>
          ))}
        </div>
      );
    case 'full':
      return <Media src={block.image} className="w-full aspect-[16/9]" />;
    case 'grid':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {block.images.map((src, i) => (
            <Media key={i} src={src} className="w-full aspect-[4/3]" />
          ))}
        </div>
      );
  }
}

export default function Project() {
  const { slug } = useParams();
  const project = findProject(slug);
  const scrollRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setShowScrollTop(scrollRef.current.scrollTop > 200);
      }
    };

    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Jump back to the top when switching between projects.
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [slug]);

  // A slug that no longer exists (renamed or deleted project) falls back home
  // rather than rendering a broken page.
  if (!project) return <Navigate to="/" replace />;

  const caseStudy = project.caseStudy;
  // "more projects" should show the others, not the one already open.
  const others = projectsList.filter((p) => p.slug !== project.slug);

  return (
    <main ref={scrollRef} className="flex-1 overflow-y-auto relative bg-white pb-32">
      <div className="px-6 md:px-8 lg:px-16 pt-24 md:pt-32">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-16 md:gap-32 mb-16 md:mb-24">
          <div className="flex flex-col gap-16 md:gap-24 w-full md:w-1/2">
            <p className="text-neutral-900 leading-relaxed max-w-sm">
              {caseStudy.intro}
            </p>
            <p className="text-neutral-400">{caseStudy.label}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 w-full md:w-auto">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-400">company</span>
              <span className="text-neutral-900">{caseStudy.meta.company}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-neutral-400">services</span>
              <div className="flex flex-col text-neutral-900">
                {caseStudy.meta.services.map((service) => (
                  <span key={service}>{service}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-neutral-400">industry</span>
              <span className="text-neutral-900">{caseStudy.meta.industry}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-neutral-400">year</span>
              <span className="text-neutral-900">{caseStudy.meta.year}</span>
            </div>
          </div>
        </div>

        {/* Content Flow */}
        <div className="flex flex-col gap-16 md:gap-24">
          <Media src={caseStudy.hero} className="w-full aspect-[16/9]" />
          {caseStudy.blocks.map((block, i) => (
            <CaseStudyBlock key={i} block={block} />
          ))}
        </div>

        {/* More Projects */}
        {others.length > 0 && (
          <div className="mt-32 -mx-6 md:-mx-8 lg:-mx-16">
            <div className="px-6 md:px-8 lg:px-16 mb-8">
              <p className="text-neutral-900">{content.projectPage.moreProjectsLabel}</p>
            </div>
            <Slideshow items={others} />
          </div>
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 mb-6 w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center z-50 focus:outline-none"
        >
          <ArrowUp size={16} />
        </button>
      )}
    </main>
  );
}

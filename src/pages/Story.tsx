import SEO from '../components/SEO';
import { content } from '../content';

const story = content.story;

export default function Story() {
  const storyDescription = story.paragraphs[0] || 'Story and creative services of Arya Rajasa Studio — Brand & Visual Identity Designer.';

  return (
    <main className="flex-1 px-6 md:px-8 lg:px-16 mt-[5vh] md:mt-[10vh] overflow-y-auto w-full">
      <SEO
        title="story"
        description={storyDescription}
        image={story.portrait}
      />
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 lg:gap-32 pb-16">

        {/* Left Column: Image */}
        <div className="w-full">
          <img
            src={story.portrait}
            alt="Portrait"
            className="w-full aspect-square object-cover grayscale"
          />
        </div>

        {/* Middle Column: Text */}
        <div className="w-full">
          <p className="select-none flex flex-col gap-6 text-neutral-900 pr-0 lg:pr-8">
            {story.paragraphs.map((text, i) => (
              <span key={i}>{text}</span>
            ))}
          </p>
        </div>

        {/* Right Column: Services */}
        <div className="w-full flex flex-col md:flex-row gap-2 md:gap-16 lg:gap-32">
          <h2 className="text-neutral-400 select-none shrink-0 w-24">{story.servicesLabel}</h2>
          <ul className="flex flex-col select-none text-neutral-900 leading-tight">
            {story.services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>

      </div>
    </main>
  );
}

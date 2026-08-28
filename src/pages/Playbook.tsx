import SEO from '../components/SEO';
import { content } from '../content';

export default function Playbook() {
  return (
    <main className="flex-1 overflow-hidden relative flex flex-col items-center justify-center bg-white">
      <SEO
        title="playbook"
        description="Design Playbook and methodology by Arya Rajasa Studio."
      />
      <span className="text-neutral-900 select-none">{content.playbook.comingSoon}</span>
    </main>
  );
}

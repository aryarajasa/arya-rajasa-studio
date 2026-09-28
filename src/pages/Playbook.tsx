import SEO from '../components/SEO';
import { content } from '../content';

export default function Playbook() {
  return (
    <main className="flex-1 overflow-hidden relative flex flex-col items-center justify-center bg-white">
      <SEO
        title="playbook"
        description="Design Playbook, brand strategy methodology, and creative principles by Arya Rajasa Studio."
        keywords="brand playbook, brand design methodology, design principles, Bali brand designer, creative systems"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Playbook', url: '/playbook' }
        ]}
      />
      <h1 className="sr-only">Design Playbook & Creative Methodology — Arya Rajasa Studio</h1>
      <span className="text-neutral-900 select-none">{content.playbook.comingSoon}</span>
    </main>
  );
}

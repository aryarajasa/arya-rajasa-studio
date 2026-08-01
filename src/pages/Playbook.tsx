import { content } from '../content';

export default function Playbook() {
  return (
    <main className="flex-1 overflow-hidden relative flex flex-col items-center justify-center bg-white">
      <span className="text-neutral-900 select-none">{content.playbook.comingSoon}</span>
    </main>
  );
}

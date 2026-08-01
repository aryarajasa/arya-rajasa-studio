import { useEffect, useState } from 'react';

const TITLE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789©()[]{}<>@#$%&*+-=";

interface ProjectTitleProps {
  originalText: string;
  isRandomizing: boolean;
}

export default function ProjectTitle({ originalText, isRandomizing }: ProjectTitleProps) {
  const [displayText, setDisplayText] = useState(originalText);

  useEffect(() => {
    if (!isRandomizing) {
      setDisplayText(originalText);
      return;
    }

    const interval = setInterval(() => {
      const randomized = originalText
        .split("")
        .map((char) => {
          if (char === " ") return " ";
          return TITLE_CHARS[Math.floor(Math.random() * TITLE_CHARS.length)];
        })
        .join("");
      setDisplayText(randomized);
    }, 80);

    return () => clearInterval(interval);
  }, [isRandomizing, originalText]);

  return <span className="shrink-0">{displayText}</span>;
}

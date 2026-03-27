import { formatTime } from '../../utils/helpers';
import { ExternalLink } from 'lucide-react';

// Parse text and convert URLs to clickable links
const parseMessageContent = (text, isOwn) => {
  // URL regex pattern - matches http/https and www links
  const urlPattern = /(https?:\/\/[^\s<>]*|www\.[^\s<>]*)/g;

  const parts = text.split(urlPattern);

  return parts.map((part, index) => {
    if (part && urlPattern.test(part)) {
      // Reset regex lastIndex
      urlPattern.lastIndex = 0;

      // Add http:// to www links
      const href = part.startsWith('www.') ? 'http://' + part : part;

      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1 underline hover:opacity-80 transition-opacity ${
            isOwn ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {part.length > 40 ? part.substring(0, 40) + '...' : part}
          <ExternalLink size={12} className="flex-shrink-0" />
        </a>
      );
    }
    return part;
  });
};

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm
          ${isOwn
            ? 'gradient-bg text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
          }`}
      >
        <p className="leading-relaxed break-words">{parseMessageContent(message.text, isOwn)}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

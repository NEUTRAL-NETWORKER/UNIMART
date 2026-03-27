import { motion } from 'framer-motion';

export default function Loader({ size = 'md', text = '', fullScreen = false }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className={`${sizes[size]} rounded-full border-[3px] border-gray-200 dark:border-gray-700 border-t-indigo-500 border-r-purple-500`}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-1 rounded-full border-[2px] border-transparent border-b-pink-500`}
        />
      </div>
      {text && (
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

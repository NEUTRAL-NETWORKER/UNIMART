import { motion } from 'framer-motion';
import { Target, Globe, BookOpen, Award } from 'lucide-react';

const AboutUsSection = () => {
  const features = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'Bringing the concept of free software to everyone, encouraging its improvement in industry and academia.',
    },
    {
      icon: Globe,
      title: 'Major Aims',
      description: 'Creating awareness on GNU/Linux Operating System and Free Software, delivering Linux flavors to those in need.',
    },
    {
      icon: BookOpen,
      title: 'What we are Doing?',
      description: 'Conducting open tech meetups to equip rural youth with coding and analytical skills through FOSS technologies.',
    },
    {
      icon: Award,
      title: 'Recognitions',
      description: 'Received the prestigious Achievers Award from Honorable Chief Minister of TamilNadu M.K. Stalin in 2021.',
    }
  ];

  return (
    <section id="about" className="section-padding py-20 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white"
        >
          About <span className="gradient-text">VGLUG Foundation</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-600 dark:text-gray-400"
        >
          Villupuram GNU/Linux Users Group is a Technical & Philosophical group focused on the Philosophy of Free Software and Freedom over the Internet.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-indigo-500/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <feature.icon size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              {feature.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default AboutUsSection;

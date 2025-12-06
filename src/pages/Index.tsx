import { useSeoMeta } from '@unhead/react';

// This page is no longer used - LandingPage is now the main entry point
// Keeping for backwards compatibility with any direct imports

const Index = () => {
  useSeoMeta({
    title: 'Echos of the Wood',
    description: 'A calming exploration game where you observe, encounter, and interact with small luminous spirits in an enchanted forest.',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Echos of the Wood
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          A calming exploration game in an enchanted forest.
        </p>
      </div>
    </div>
  );
};

export default Index;

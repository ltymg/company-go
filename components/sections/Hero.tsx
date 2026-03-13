import React from 'react';
import Button from '../ui/Button';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28 bg-gray-900 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[150%] rounded-full bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-transparent -rotate-45 blur-3xl opacity-50"></div>
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tighter">
          Launch your business, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">anywhere in the world.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
          The all-in-one platform to incorporate, get a bank account, and manage compliance for your global company.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button href="/setup" variant="primary" size="lg">Start your business</Button>
          <Button href="#pricing" variant="outline" size="lg">View Pricing</Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;

import React from 'react';
import Card from '../ui/Card';

const steps = [
  {
    step: 1,
    title: 'Choose Your Entity',
    description: 'Select the best country and legal structure for your new venture with our guided process.',
  },
  {
    step: 2,
    title: 'Submit Your Information',
    description: 'Complete our secure online form with your company and founder details in minutes.',
  },
  {
    step: 3,
    title: 'We Handle the Paperwork',
    description: 'Our team files all necessary documents with the relevant government agencies.',
  },
  {
    step: 4,
    title: 'Launch Your Business',
    description: 'Receive your official company documents, open a bank account, and start operating.',
  },
];

const Process: React.FC = () => {
  return (
    <section id="process" className="py-20 lg:py-28 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">A simple, streamlined process</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">Get your company up and running in just a few steps.</p>
        </div>
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-700/50 -translate-y-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 px-4">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;

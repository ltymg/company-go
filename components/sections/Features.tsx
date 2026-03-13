import React from 'react';
import Card from '../ui/Card';

const features = [
  {
    title: 'Global Formation',
    description: 'Launch your US, UK, or Singapore company from anywhere in the world, 100% online.',
    icon: '🌍',
  },
  {
    title: 'Bank Account Setup',
    description: 'We partner with leading financial institutions to get your business banking set up.',
    icon: '🏦',
  },
  {
    title: 'Compliance Automation',
    description: 'Stay compliant with automated reminders and filings for your annual reports and taxes.',
    icon: '✅',
  },
  {
    title: 'Payment Gateway',
    description: 'Integrate with Stripe to accept payments from customers globally from day one.',
    icon: '💳',
  },
  {
    title: 'Document Vault',
    description: 'All your important company documents, securely stored and accessible anytime.',
    icon: '📄',
  },
  {
    title: 'Expert Support',
    description: 'Our team of experts is here to help you navigate the complexities of global business.',
    icon: '👩‍💼',
  },
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Everything you need to start</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">A complete toolkit to launch and grow your global business.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index}>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

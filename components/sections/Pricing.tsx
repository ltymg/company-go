import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const plans = [
  {
    name: 'Formation',
    price: '$399',
    frequency: 'one-time',
    description: 'Everything you need to launch your company.',
    features: [
      'US, UK, or SG Company Formation',
      'Official Incorporation Documents',
      'Founder KYC/AML Checks',
      'Access to Partner Rewards',
    ],
    cta: 'Start Formation',
    primary: true,
  },
  {
    name: 'Compliance',
    price: '$799',
    frequency: 'per year',
    description: 'Automated compliance and registered agent services.',
    features: [
      'Registered Agent Service',
      'Annual Report Filings',
      'Tax Consultation Access',
      '24/7 Expert Support',
    ],
    cta: 'Get Compliance',
    primary: false,
  },
];

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Simple, transparent pricing</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">Choose the plan that fits your needs. No hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`flex flex-col ${plan.primary ? 'border-indigo-500' : ''}`}>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-gray-400">{plan.description}</p>
                <div className="my-8">
                  <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-gray-400"> / {plan.frequency}</span>
                </div>
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <svg className="w-6 h-6 text-indigo-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10">
                <Button href="/setup" variant={plan.primary ? 'primary' : 'outline'} size="lg" className="w-full">{plan.cta}</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;

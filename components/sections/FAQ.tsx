import React, { useState } from 'react';

const faqs = [
  {
    question: 'What countries can I form a company in?',
    answer: 'We currently support company formation in the United States (Delaware C-Corp & LLC), the United Kingdom (LTD), and Singapore (Pte. Ltd.). More countries are coming soon.',
  },
  {
    question: 'Do I need to be a resident of the country?',
    answer: 'No, our service is designed for global founders. You can form a company in any of our supported jurisdictions regardless of your country of residence.',
  },
  {
    question: 'What is included in the Formation package?',
    answer: 'The package includes company registration, all official government filing fees, a registered agent for the first year, and access to our document vault and partner rewards.',
  },
  {
    question: 'Can you help with a business bank account?',
    answer: 'Yes, we partner with leading digital banks and financial institutions like Mercury, Wise, and Stripe to help you open a business bank account after your company is formed.',
  },
];

const FaqItem = ({ faq }: { faq: typeof faqs[0] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-700/50 py-6">
      <button
        className="w-full flex justify-between items-center text-left text-lg font-semibold text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{faq.question}</span>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>+</span>
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-gray-400">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  return (
    <section id="faq" className="py-20 lg:py-28 bg-black">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>
        <div>
          {faqs.map((faq, index) => (
            <FaqItem key={index} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

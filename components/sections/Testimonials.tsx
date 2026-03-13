import React from 'react';
import Card from '../ui/Card';

const testimonials = [
  {
    quote: 'GlobalCorp made it incredibly simple to launch our US entity from Europe. The process was seamless and their support team was always responsive.',
    name: 'Alex Steiner',
    title: 'CEO, TechNova',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    quote: 'The best all-in-one platform for global startups. We saved weeks of time and thousands in legal fees. Highly recommended.',
    name: 'Maria Garcia',
    title: 'Founder, Creativio',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    quote: 'As a non-US founder, navigating the incorporation process was daunting. Firstbase held our hand through every step. A must-have service.',
    name: 'Kenji Tanaka',
    title: 'Co-founder, ZenFi',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
  },
];

const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Trusted by founders worldwide</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <p className="text-gray-300 mb-6">“{testimonial.quote}”</p>
              <div className="flex items-center">
                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.title}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

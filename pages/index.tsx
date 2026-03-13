import React from 'react';
import Layout from '../components/layout/Layout';
import Hero from '../components/sections/Hero';
import Features from '../components/sections/Features';
import Process from '../components/sections/Process';
import Pricing from '../components/sections/Pricing';
import Testimonials from '../components/sections/Testimonials';
import FAQ from '../components/sections/FAQ';
import FadeInWhenVisible from '../components/animations/FadeInWhenVisible';

const HomePage: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <FadeInWhenVisible>
        <Features />
      </FadeInWhenVisible>
      <FadeInWhenVisible>
        <Process />
      </FadeInWhenVisible>
      <FadeInWhenVisible>
        <Pricing />
      </FadeInWhenVisible>
      <FadeInWhenVisible>
        <Testimonials />
      </FadeInWhenVisible>
      <FadeInWhenVisible>
        <FAQ />
      </FadeInWhenVisible>
    </Layout>
  );
};

export default HomePage;

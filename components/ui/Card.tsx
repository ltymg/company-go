import React from 'react';
import cn from 'classnames';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  const combinedClassName = cn(
    'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-indigo-500/50 hover:scale-[1.02]',
    className
  );

  return (
    <div className={combinedClassName}>
      {children}
    </div>
  );
};

export default Card;

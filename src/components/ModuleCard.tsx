import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BaseModule {
  path: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  searchTerms: string[];
  category: string;
  color: string;
  gradient: string;
}

interface ModuleCardProps<T extends BaseModule = BaseModule> {
  module: T;
  index: number;
  onClick: (module: T) => void;
}

const ModuleCard = <T extends BaseModule>({ module, index, onClick }: ModuleCardProps<T>) => {
  const IconComponent = module.icon;

  return (
    <div
      className={`account-module-card ${module.gradient}`}
      style={{
        animationDelay: `${index * 0.1}s`
      }}
      onClick={() => onClick(module)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(module);
        }
      }}
      aria-label={`Open ${module.title}`}
    >
      <div className="module-icon">
        <IconComponent size={28} />
      </div>
      <div className="module-content">
        <h3 className="module-title">{module.title}</h3>
        <p className="module-description">{module.description}</p>
      </div>
      <div className="module-arrow">
        <ChevronRight size={20} />
      </div>
    </div>
  );
};

export default ModuleCard;
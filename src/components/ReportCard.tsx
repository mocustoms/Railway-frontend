import React from 'react';
import { Download, Calendar, Filter, ArrowRight } from 'lucide-react';
import { ReportModule } from '../data/reportModules';

interface ReportCardProps {
  report: ReportModule;
  onClick: (report: ReportModule) => void;
  index: number;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onClick, index }) => {
  const IconComponent = report.icon;

  return (
    <div
      className="report-card"
      onClick={() => onClick(report)}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      <div className="report-card-header">
        <div 
          className="report-icon"
          style={{ background: report.gradient }}
        >
          <IconComponent className="h-6 w-6 text-white" />
        </div>
        <div className="report-category">
          <span 
            className="category-badge"
            style={{ backgroundColor: report.color + '20', color: report.color }}
          >
            {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
          </span>
        </div>
      </div>

      <div className="report-card-content">
        <h3 className="report-title">{report.title}</h3>
        <p className="report-description">{report.description}</p>
        
        <div className="report-features">
          {report.features.slice(0, 3).map((feature, idx) => (
            <span key={idx} className="feature-tag">
              {feature}
            </span>
          ))}
          {report.features.length > 3 && (
            <span className="feature-tag more">
              +{report.features.length - 3} more
            </span>
          )}
        </div>

        <div className="report-tags">
          {report.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="report-card-footer">
        <div className="report-actions">
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement quick export
              }}
            title="Quick Export"
          >
            <Download className="h-4 w-4" />
          </button>
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement schedule report
              }}
            title="Schedule Report"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button 
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement advanced filters
              }}
            title="Advanced Filters"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
        
        <div className="report-arrow">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>

      <div 
        className="report-card-overlay"
        style={{ background: report.gradient }}
      />
    </div>
  );
};

export default ReportCard;
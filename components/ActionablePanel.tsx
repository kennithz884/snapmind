
import React from 'react';
import { Screenshot } from '../types';

interface ActionablePanelProps {
  screenshot: Screenshot;
}

const ActionablePanel: React.FC<ActionablePanelProps> = ({ screenshot }) => {
  const { links, phones, addresses } = screenshot.insights;

  if (!links.length && !phones.length && !addresses.length) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Actionable Insights
      </h4>
      <div className="flex flex-wrap gap-2">
        {links.map((link, idx) => (
          <a 
            key={idx} 
            href={link.startsWith('http') ? link : `https://${link}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {link}
          </a>
        ))}
        {phones.map((phone, idx) => (
          <a 
            key={idx} 
            href={`tel:${phone}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {phone}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ActionablePanel;

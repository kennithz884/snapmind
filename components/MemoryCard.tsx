
import React from 'react';
import { Screenshot } from '../types';

interface MemoryCardProps {
  screenshot: Screenshot;
  onRefresh: () => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ screenshot, onRefresh }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider">
          {screenshot.category}
        </span>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          <img 
            src={screenshot.url} 
            alt="Flashcard" 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Memory Spark</h3>
            <p className="text-gray-600 italic mb-4 leading-relaxed">
              "Remember this? Captured on {new Date(screenshot.timestamp).toLocaleDateString()}"
            </p>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-800 text-sm">{screenshot.summary}</p>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button 
              onClick={onRefresh}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Next Memory
            </button>
            <button className="px-4 py-2 bg-white text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              Archive Insight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;

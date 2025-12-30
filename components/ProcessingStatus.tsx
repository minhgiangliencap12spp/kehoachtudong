import React from 'react';
import { Loader2, FileText, Check, AlertTriangle } from 'lucide-react';
import { ProcessingState } from '../types';

interface ProcessingStatusProps {
  state: ProcessingState;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ state }) => {
  if (state.status === 'idle') return null;

  const getStatusContent = () => {
    switch (state.status) {
      case 'uploading':
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-blue-500" />,
          title: 'Reading File...',
          desc: 'Preparing your PDF for analysis.'
        };
      case 'analyzing':
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-purple-500" />,
          title: 'AI Analysis in Progress',
          desc: 'Gemini is reading the document structure and extracting text...'
        };
      case 'generating':
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />,
          title: 'Creating Word Doc',
          desc: 'Formatting paragraphs, headings, and lists...'
        };
      case 'complete':
        return {
          icon: <Check className="w-8 h-8 text-green-500" />,
          title: 'Conversion Complete!',
          desc: 'Your file has been downloaded.'
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          title: 'Conversion Failed',
          desc: state.message || 'An unexpected error occurred.'
        };
      default:
        return null;
    }
  };

  const content = getStatusContent();
  if (!content) return null;

  return (
    <div className="mt-8 w-full max-w-xl mx-auto bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-slate-50 rounded-full shrink-0">
          {content.icon}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-slate-800 mb-1">{content.title}</h4>
          <p className="text-slate-600">{content.desc}</p>
          
          {(state.status === 'analyzing' || state.status === 'generating') && (
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse w-2/3 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

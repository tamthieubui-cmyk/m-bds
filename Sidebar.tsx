import React from 'react';
import { AppType } from '../types';
import { APPS } from '../constants';
import { Home, Sparkles, LandPlot, Zap } from 'lucide-react';

interface SidebarProps {
  selectedApp: AppType;
  onSelectApp: (app: AppType) => void;
}

// Map AppType to Lucide Components
const ICONS = {
  [AppType.BRANDING]: Sparkles,
  [AppType.TOWNHOUSE]: Home,
  [AppType.LAND]: LandPlot
};

export const Sidebar: React.FC<SidebarProps> = ({ selectedApp, onSelectApp }) => {
  return (
    <>
      {/* === DESKTOP SIDEBAR (Visible on md and up) === */}
      <aside className="hidden md:flex w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 flex-shrink-0 flex-col h-screen z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
        {/* Header */}
        <div className="p-8 border-b border-gray-100/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Zap size={18} fill="currentColor" />
            </div>
            <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 tracking-tight">
              AI Studio
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full tracking-wider shadow-sm">PRO VERSION</span>
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Real Estate Suite</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-5 space-y-2">
          {APPS.map((app) => {
            const isActive = selectedApp === app.id;
            const IconComponent = ICONS[app.id] || Sparkles;

            return (
              <button
                key={app.id}
                onClick={() => onSelectApp(app.id)}
                className={`w-full text-left p-3.5 rounded-2xl transition-all duration-300 flex items-center gap-4 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' 
                    : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
                  }
                `}
              >
                {/* Icon Container */}
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                  ${isActive 
                    ? 'bg-white/20 text-white backdrop-blur-sm' 
                    : 'bg-white border border-gray-100 text-slate-400 group-hover:border-indigo-100 group-hover:text-indigo-600 group-hover:shadow-md'
                  }
                `}>
                  <IconComponent size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                {/* Text */}
                <div className="z-10 flex-1">
                  <div className={`font-bold text-sm tracking-wide ${isActive ? 'text-white' : ''}`}>{app.label}</div>
                  <div className={`text-[10px] truncate max-w-[140px] ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {app.id === AppType.BRANDING ? 'Personal Brand' : app.id === AppType.LAND ? 'Investment' : 'Interior Design'}
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                   <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100/50 bg-gradient-to-b from-transparent to-slate-50/50">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white shadow-sm">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Powered by</div>
             <div className="flex justify-center items-center gap-2 text-xs font-bold text-slate-700">
               <span className="flex items-center gap-1"><Sparkles size={10} className="text-indigo-500" /> Gemini 2.5</span>
               <span className="text-slate-300">|</span>
               <span className="flex items-center gap-1">Veo <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div></span>
             </div>
          </div>
        </div>
      </aside>

      {/* === MOBILE BOTTOM NAVIGATION (Native-like) === */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 px-6 py-2 pb-safe flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {APPS.map((app) => {
          const isActive = selectedApp === app.id;
          const IconComponent = ICONS[app.id] || Sparkles;
          
          return (
            <button
              key={app.id}
              onClick={() => onSelectApp(app.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative
                ${isActive ? 'text-indigo-600' : 'text-gray-400'}
              `}
            >
              {isActive && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-b-full shadow-[0_2px_8px_rgba(79,70,229,0.5)]"></div>
              )}
              <div className={`mb-1 transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                 <IconComponent size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {app.id === AppType.BRANDING && 'Thương Hiệu'}
                {app.id === AppType.TOWNHOUSE && 'Nhà Phố'}
                {app.id === AppType.LAND && 'Đất Nền'}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  );
};
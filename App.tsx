import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { AppType } from './types';

const App: React.FC = () => {
  // State 'selectedApp' as requested to track the active application
  const [selectedApp, setSelectedApp] = useState<AppType>(AppType.BRANDING);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar selectedApp={selectedApp} onSelectApp={setSelectedApp} />
      <Workspace selectedApp={selectedApp} />
    </div>
  );
};

export default App;
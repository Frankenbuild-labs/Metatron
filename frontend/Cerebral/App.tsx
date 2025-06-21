
import React, { useState, useCallback, Suspense } from 'react';
import { BrainSectionId, BrainDataState, OptionalBrainSectionId, UploadedItem } from './types.ts';
import { BRAIN_SECTION_CONFIGS, IconXCircle } from './constants.tsx';
import { SectionEditor } from './components/SectionEditor.tsx';
import BrainViewer from './components/BrainViewer.tsx';

const App: React.FC = () => {
  const [selectedSectionId, setSelectedSectionId] = useState<OptionalBrainSectionId>(null);
  const [brainData, setBrainData] = useState<BrainDataState>(() => {
    const initialData: Partial<BrainDataState> = {};
    BRAIN_SECTION_CONFIGS.forEach(config => {
      initialData[config.id] = { items: [] };
    });
    return initialData as BrainDataState;
  });

  const handleSectionSelect = useCallback((sectionId: OptionalBrainSectionId) => {
    setSelectedSectionId(sectionId);
  }, []);

  const handleUpdateSectionContent = useCallback((sectionId: BrainSectionId, newItems: UploadedItem[]) => {
    setBrainData(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], items: newItems },
    }));
  }, []);
  
  const selectedConfig = selectedSectionId ? BRAIN_SECTION_CONFIGS.find(c => c.id === selectedSectionId) : null;

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 relative overflow-hidden">
      {/* Left Sliding Panel */}
      <div 
        className={`absolute top-0 left-0 h-full w-[450px] bg-gray-800 shadow-2xl flex flex-col z-20 transform transition-transform duration-300 ease-in-out
                    ${selectedSectionId && selectedConfig ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {selectedSectionId && selectedConfig && (
          <>
            <div className="sticky top-0 bg-gray-800 p-6 z-10 border-b border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold" style={{color: selectedConfig.highlightColor as string}}>{selectedConfig.name}</h2>
                <button
                  onClick={() => handleSectionSelect(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close panel"
                >
                  <IconXCircle className="w-8 h-8" />
                </button>
              </div>
              <p className="text-sm text-gray-400 italic">{selectedConfig.memoryType}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedConfig.description}</p>
            </div>
            <div className="overflow-y-auto flex-grow">
              <SectionEditor
                sectionId={selectedSectionId}
                content={brainData[selectedSectionId]}
                updateContent={handleUpdateSectionContent}
              />
            </div>
          </>
        )}
      </div>

      {/* Brain Viewer Area */}
      <div className="w-full h-full">
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-xl">Loading 3D Brain...</div>}>
          <BrainViewer
            selectedSectionId={selectedSectionId}
            onSectionSelect={handleSectionSelect}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default App;

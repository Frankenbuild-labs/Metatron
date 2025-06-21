
import React, { useState, ChangeEvent, useCallback, useId } from 'react';
import { BrainSectionId, SectionContent, UploadedItem } from '../types.ts';
import { IconUpload, IconLink, IconDocumentText, IconPencilSquare, IconTrash, IconPhoto } from '../constants.tsx';

interface SectionEditorProps {
  sectionId: BrainSectionId;
  content: SectionContent;
  updateContent: (sectionId: BrainSectionId, newItems: UploadedItem[]) => void;
}

const FileInputButton: React.FC<{
  onFilesSelected: (files: FileList) => void;
  accept: string;
  label: string;
  icon: React.ReactNode;
  multiple?: boolean;
}> = ({ onFilesSelected, accept, label, icon, multiple = false }) => {
  const inputId = useId();
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(event.target.files);
      event.target.value = ''; // Reset file input
    }
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="w-full flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md cursor-pointer transition-colors"
      >
        {icon}
        <span className="ml-2 text-sm font-medium">{label}</span>
      </label>
      <input
        id={inputId}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
    </div>
  );
};


export const SectionEditor: React.FC<SectionEditorProps> = ({ sectionId, content, updateContent }) => {
  const [urlInput, setUrlInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const handleAddItem = useCallback((itemType: UploadedItem['type'], data: File | string) => {
    let newItem: UploadedItem;
    const itemId = Date.now().toString() + Math.random().toString(36).substring(2,9);

    if (itemType === 'image' && data instanceof File) {
      newItem = { id: itemId, name: data.name, url: URL.createObjectURL(data), file: data, type: 'image' };
    } else if (itemType === 'document' && data instanceof File) {
      newItem = { id: itemId, name: data.name, url: '', file: data, type: 'document' }; // URL not used for preview here
    } else if (itemType === 'url' && typeof data === 'string' && data.trim() !== '') {
      newItem = { id: itemId, name: data, url: data, type: 'url' };
    } else if (itemType === 'note' && typeof data === 'string' && data.trim() !== '') {
      newItem = { id: itemId, name: 'Note', url: '', type: 'note', noteContent: data };
    } else {
      return; // Invalid item
    }
    updateContent(sectionId, [...content.items, newItem]);
  }, [sectionId, content.items, updateContent]);

  const handleFileSelected = (files: FileList, type: 'image' | 'document') => {
    Array.from(files).forEach(file => handleAddItem(type, file));
  };
  
  const handleAddUrl = () => {
    if (urlInput.trim()) {
      try {
        new URL(urlInput); // Validate URL
        handleAddItem('url', urlInput);
        setUrlInput('');
      } catch (_) {
        alert("Please enter a valid URL (e.g., https://example.com)");
      }
    }
  };

  const handleAddNote = () => {
    if (noteInput.trim()) {
      handleAddItem('note', noteInput);
      setNoteInput('');
    }
  };

  const handleDeleteItem = useCallback((itemId: string) => {
    const itemToDelete = content.items.find(item => item.id === itemId);
    if (itemToDelete && itemToDelete.type === 'image' && itemToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(itemToDelete.url); // Clean up blob URL
    }
    updateContent(sectionId, content.items.filter(item => item.id !== itemId));
  }, [sectionId, content.items, updateContent]);

  const renderItem = (item: UploadedItem) => (
    <div key={item.id} className="bg-gray-700 p-3 rounded-md mb-2 flex items-center justify-between shadow">
      <div className="flex items-center overflow-hidden mr-2">
        {item.type === 'image' && <IconPhoto className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" />}
        {item.type === 'document' && <IconDocumentText className="w-5 h-5 mr-2 text-green-400 flex-shrink-0" />}
        {item.type === 'url' && <IconLink className="w-5 h-5 mr-2 text-purple-400 flex-shrink-0" />}
        {item.type === 'note' && <IconPencilSquare className="w-5 h-5 mr-2 text-yellow-400 flex-shrink-0" />}
        
        {item.type === 'image' && item.url ? (
           <img src={item.url} alt={item.name} className="w-10 h-10 object-cover rounded mr-2" />
        ) : null}
        <span className="text-sm text-gray-200 truncate" title={item.type === 'note' ? item.noteContent : item.name}>
            {item.type === 'note' ? (item.noteContent?.substring(0,30) + (item.noteContent && item.noteContent.length > 30 ? '...' : '')) : item.name}
        </span>
      </div>
      <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-600">
        <IconTrash className="w-5 h-5" />
      </button>
    </div>
  );

  const filterItems = (type: UploadedItem['type']) => content.items.filter(item => item.type === type);

  return (
    <div className="p-6 space-y-6 flex-grow">
      {/* Images Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-300 flex items-center"><IconPhoto className="w-5 h-5 mr-2 text-blue-400"/>Images</h3>
        <FileInputButton
            onFilesSelected={(files) => handleFileSelected(files, 'image')}
            accept="image/*"
            label="Upload Image(s)"
            icon={<IconUpload className="w-5 h-5" />}
            multiple
        />
        <div className="mt-3 max-h-40 overflow-y-auto space-y-2 pr-1">
            {filterItems('image').map(renderItem)}
        </div>
      </div>

      {/* Documents Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-300 flex items-center"><IconDocumentText className="w-5 h-5 mr-2 text-green-400"/>Documents</h3>
         <FileInputButton
            onFilesSelected={(files) => handleFileSelected(files, 'document')}
            accept=".pdf,.doc,.docx,.txt,.md"
            label="Upload Document(s)"
            icon={<IconUpload className="w-5 h-5" />}
            multiple
        />
        <div className="mt-3 max-h-40 overflow-y-auto space-y-2 pr-1">
            {filterItems('document').map(renderItem)}
        </div>
      </div>

      {/* URLs Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-300 flex items-center"><IconLink className="w-5 h-5 mr-2 text-purple-400"/>URLs</h3>
        <div className="flex space-x-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
            className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
          />
          <button onClick={handleAddUrl} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors">Add URL</button>
        </div>
        <div className="mt-3 max-h-40 overflow-y-auto space-y-2 pr-1">
            {filterItems('url').map(renderItem)}
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-300 flex items-center"><IconPencilSquare className="w-5 h-5 mr-2 text-yellow-400"/>Notes</h3>
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Type your notes here..."
          rows={3}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-500"
        />
        <button onClick={handleAddNote} className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-sm font-medium transition-colors w-full">Add Note</button>
        <div className="mt-3 max-h-40 overflow-y-auto space-y-2 pr-1">
            {filterItems('note').map(renderItem)}
        </div>
      </div>
    </div>
  );
};
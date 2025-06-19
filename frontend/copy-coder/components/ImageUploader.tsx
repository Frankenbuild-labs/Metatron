
import React, { useState, useCallback, useRef } from 'react';
import Button from './Button'; // Assuming Button component is in the same directory

interface ImageUploaderProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  onImageClear: () => void;
  imagePreviewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, onImageClear, imagePreviewUrl }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onImageSelect(file, previewUrl);
    }
  }, [onImageSelect]);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      onImageSelect(file, previewUrl);
    }
  }, [onImageSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
    onImageClear();
  };


  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${dragOver ? 'border-sky-500 bg-gray-700' : 'border-gray-600 hover:border-sky-400'}
                    ${imagePreviewUrl ? 'border-solid' : ''}`}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!imagePreviewUrl ? openFileDialog : undefined} // Only open dialog if no image
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
        {imagePreviewUrl ? (
          <div className="relative group">
            <img src={imagePreviewUrl} alt="Preview" className="max-h-64 mx-auto rounded-md shadow-lg" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
              <Button onClick={openFileDialog} variant="secondary" className="mb-2">Change Image</Button>
              <Button onClick={clearImage} variant="secondary" className="bg-red-600 hover:bg-red-700">Clear Image</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <p className="text-gray-400">Drag & drop an image here, or click to select</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
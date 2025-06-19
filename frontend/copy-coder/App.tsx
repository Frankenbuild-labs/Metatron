
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import CodeDisplay from './components/CodeDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import Button from './components/Button';
import { generateUiCodeFromImage, isApiKeyAvailable } from './services/geminiService';
import { AppState, ImageMimeData } from './types';

const getBase64AndMimeType = (file: File): Promise<ImageMimeData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Format: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
      const parts = result.split(';');
      if (parts.length < 2 || !parts[0].startsWith('data:')) {
        reject(new Error('Invalid data URL format'));
        return;
      }
      const mimeType = parts[0].substring(5); // "image/png"
      const base64Part = parts[1];
      if (!base64Part.startsWith('base64,')) {
         reject(new Error('Invalid base64 data URL format'));
        return;
      }
      const base64Data = base64Part.substring(7); // Actual base64 string
      resolve({ base64Data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};


const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    selectedImageFile: null,
    imagePreviewUrl: null,
    generatedUiCode: null,
    isLoading: false,
    errorMessage: null,
    apiKeyExists: false, 
  });

  useEffect(() => {
    setState(prevState => ({ ...prevState, apiKeyExists: isApiKeyAvailable() }));
    if (!isApiKeyAvailable()) {
       setState(prevState => ({ ...prevState, errorMessage: "Gemini API Key (API_KEY environment variable) is not configured. Code generation is disabled." }));
    }
  }, []);

  const handleImageSelect = useCallback((file: File, previewUrl: string) => {
    setState(prevState => ({
      ...prevState,
      selectedImageFile: file,
      imagePreviewUrl: previewUrl,
      generatedUiCode: null, // Clear previous code
      errorMessage: null,    // Clear previous error
    }));
  }, []);

  const handleImageClear = useCallback(() => {
    if (state.imagePreviewUrl) {
      URL.revokeObjectURL(state.imagePreviewUrl);
    }
    setState(prevState => ({
      ...prevState,
      selectedImageFile: null,
      imagePreviewUrl: null,
      // Keep generatedUiCode and errorMessage as they might still be relevant or cleared by new actions
    }));
  }, [state.imagePreviewUrl]);

  const handleGenerateCode = useCallback(async () => {
    if (!state.selectedImageFile) {
      setState(prevState => ({ ...prevState, errorMessage: "Please select an image first." }));
      return;
    }
    if (!state.apiKeyExists) {
      setState(prevState => ({ ...prevState, errorMessage: "Gemini API Key is not configured. Cannot generate code." }));
      return;
    }

    setState(prevState => ({ ...prevState, isLoading: true, errorMessage: null, generatedUiCode: null }));

    try {
      const imageData = await getBase64AndMimeType(state.selectedImageFile);
      const code = await generateUiCodeFromImage(imageData);
      setState(prevState => ({ ...prevState, generatedUiCode: code, isLoading: false }));
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setState(prevState => ({ ...prevState, errorMessage: message, isLoading: false }));
    }
  }, [state.selectedImageFile, state.apiKeyExists]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-8 font-sans">
      <main className="max-w-4xl w-full bg-gray-800 shadow-2xl rounded-xl p-6 sm:p-10 space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300 pb-2">
            Image Copy Coder
          </h1>
          <p className="text-gray-400 text-md sm:text-lg">
            Upload an image of a UI, and let AI generate the front-end code structure.
          </p>
        </header>

        {!state.apiKeyExists && (
           <div className="bg-red-800 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative shadow-md" role="alert">
            <strong className="font-bold">API Key Missing! </strong>
            <span className="block sm:inline">{state.errorMessage}</span>
          </div>
        )}

        <section className="bg-gray-700/75 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-sky-300 mb-4">1. Upload UI Image</h2>
          <ImageUploader 
            onImageSelect={handleImageSelect} 
            onImageClear={handleImageClear}
            imagePreviewUrl={state.imagePreviewUrl} 
          />
        </section>

        {state.selectedImageFile && state.apiKeyExists && (
          <section className="text-center">
            <Button 
              onClick={handleGenerateCode} 
              disabled={state.isLoading || !state.selectedImageFile}
              className="px-8 py-3 text-lg"
            >
              {state.isLoading ? 'Generating Code...' : '2. Generate UI Code'}
            </Button>
          </section>
        )}
        
        {state.isLoading && (
          <LoadingSpinner size={12} message="AI is analyzing the image and generating code... This might take a moment." />
        )}

        {state.errorMessage && !state.isLoading && (
          <div className="bg-red-800 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative shadow-md" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{state.errorMessage}</span>
          </div>
        )}

        {state.generatedUiCode && !state.isLoading && (
          <section>
            <CodeDisplay code={state.generatedUiCode} />
          </section>
        )}
        
        {!state.generatedUiCode && !state.isLoading && !state.errorMessage && state.imagePreviewUrl && (
            <div className="text-center p-6 bg-gray-700/50 rounded-lg mt-8">
                <p className="text-gray-400">Click "Generate UI Code" to process the uploaded image.</p>
            </div>
        )}

        {!state.imagePreviewUrl && !state.isLoading && !state.errorMessage && (
             <div className="text-center p-6 bg-gray-700/50 rounded-lg mt-8">
                <p className="text-gray-400">Upload an image to get started.</p>
            </div>
        )}


      </main>
      <footer className="text-center py-8 text-gray-500 text-sm">
        Powered by React, Tailwind CSS, and Gemini API.
      </footer>
    </div>
  );
};

export default App;
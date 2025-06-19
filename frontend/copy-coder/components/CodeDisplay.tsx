
import React, { useState, useCallback } from 'react';
import Button from './Button';

interface CodeDisplayProps {
  code: string | null;
}

const CodeDisplay: React.FC<CodeDisplayProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy code: ', err);
        // Fallback for older browsers or if clipboard API fails
        try {
            const textArea = document.createElement("textarea");
            textArea.value = code;
            textArea.style.position = "fixed"; //avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            alert("Failed to copy. Please copy manually.");
        }
      });
    }
  }, [code]);

  if (!code) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg relative">
      <div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-300">Generated Output</h3>
        <Button onClick={handleCopy} variant="secondary" className="text-sm py-1 px-3">
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
      </div>
      <pre className="p-4 text-sm text-gray-200 whitespace-pre-wrap break-all overflow-x-auto max-h-[60vh]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeDisplay;
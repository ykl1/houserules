// src/components/RoomCodeDisplay.tsx
import { useState } from 'react';

const RoomCodeDisplay = ({ roomCode }: { roomCode: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async () => {
    try {
      // Use modern Clipboard API if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      // Fallback for browsers without Clipboard API access
      const textArea = document.createElement('textarea');
      textArea.value = roomCode;
      
      // Make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Select and copy
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('Fallback: Copying text failed');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-xl font-bold text-stone-800">Room: </h2>
      <button
        onClick={copyToClipboard}
        className="text-xl font-bold text-stone-800 cursor-pointer hover:bg-stone-100 px-2 py-1 rounded flex items-center transition-colors"
        title="Click to copy room code"
        aria-label="Copy room code to clipboard"
      >
        {roomCode}
        {copied ? (
          <span className="ml-2 text-green-600 text-sm">✓</span>
        ) : (
          <svg className="ml-2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
          </svg>
        )}
      </button>
    </div>
  );
};

export default RoomCodeDisplay;

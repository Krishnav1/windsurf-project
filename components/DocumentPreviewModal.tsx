'use client';

import { useState } from 'react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
    document_type: string;
  } | null;
}

export default function DocumentPreviewModal({ isOpen, onClose, document }: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(100);

  if (!isOpen || !document) return null;

  const isPDF = document.file_type === 'application/pdf';
  const isImage = document.file_type?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{document.document_type.replace('_', ' ')}</h3>
              <p className="text-sm text-gray-500">{document.file_name}</p>
            </div>
            <div className="flex items-center gap-2">
              {isImage && (
                <>
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-sm text-gray-600">{zoom}%</span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    +
                  </button>
                </>
              )}
              <a
                href={document.file_url}
                download
                className="px-4 py-2 bg-[#0B67FF] text-white rounded hover:bg-[#2D9CDB]"
              >
                Download
              </a>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100">
            {isPDF ? (
              <iframe
                src={document.file_url}
                className="w-full h-full min-h-[600px] bg-white"
                title="Document Preview"
              />
            ) : isImage ? (
              <div className="flex items-center justify-center">
                <img
                  src={document.file_url}
                  alt={document.file_name}
                  style={{ transform: `scale(${zoom / 100})` }}
                  className="max-w-full transition-transform"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Preview not available for this file type</p>
                <a
                  href={document.file_url}
                  download
                  className="mt-4 inline-block px-6 py-3 bg-[#0B67FF] text-white rounded-lg"
                >
                  Download to View
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

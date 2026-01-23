import { useState, useEffect, useRef } from 'react';
import { Dropzone } from './components/Dropzone';
import { FileList } from './components/FileList';
import { SplitterModal } from './components/SplitterModal';
import { PageOrganizerModal } from './components/PageOrganizerModal';
import { ImageToPdfModal } from './components/ImageToPdfModal';
import { PdfToImagesModal } from './components/PdfToImagesModal';
import { CompressModal } from './components/CompressModal';
import { ProtectModal } from './components/ProtectModal';
import { WatermarkModal } from './components/WatermarkModal';
import { ArrowRight, FileStack, Loader2, Download, Image, FileImage, Lock, FileDown, Stamp } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

// Configure Axios base URL - use environment variable for production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


// Generate a unique session ID
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface FileItem {
  id: string;
  name: string;
  original_name?: string; // from server
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);

  // Session ID for file cleanup
  const sessionIdRef = useRef<string>(generateSessionId());

  // Modals State
  const [splittingFile, setSplittingFile] = useState<FileItem | null>(null);
  const [organizingFile, setOrganizingFile] = useState<FileItem | null>(null);
  const [showImageToPdf, setShowImageToPdf] = useState(false);
  const [showPdfToImages, setShowPdfToImages] = useState(false);
  const [showCompress, setShowCompress] = useState(false);
  const [showProtect, setShowProtect] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);

  // Cleanup files when user leaves the page
  useEffect(() => {
    const cleanup = () => {
      const filesToClean = files.map(f => f.original_name).filter(Boolean);
      if (filesToClean.length > 0) {
        // Use sendBeacon for reliable cleanup on page close
        const data = JSON.stringify({
          session_id: sessionIdRef.current,
          files: filesToClean
        });
        navigator.sendBeacon(`${API_URL}/cleanup`, new Blob([data], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup(); // Also cleanup on unmount
    };
  }, [files]);

  const handleFilesDropped = async (newFiles: File[]) => {
    setIsUploading(true);
    setMergedUrl(null); // Reset previous merge
    try {
      // Upload files one by one (or parallel)
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_id', sessionIdRef.current);
        const response = await axios.post(`${API_URL}/upload`, formData);
        return {
          id: response.data.id,
          name: file.name,
          original_name: response.data.original_name // Use server's filename for merging
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFiles((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload files. Ensure backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setMergedUrl(null);
  };


  const handleReorder = (newFiles: FileItem[]) => {
    setFiles(newFiles);
  };

  const handleSplitClick = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) setSplittingFile(file);
  };

  const handleOrganizeClick = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) setOrganizingFile(file);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsMerging(true);
    try {
      const payload = {
        files: files.map(f => f.original_name || f.id) // Assuming server needs stored filenames
      };

      const response = await axios.post(`${API_URL}/merge`, payload);
      setMergedUrl(`${API_URL}${response.data.url}`);
    } catch (error) {
      console.error("Merge failed", error);
      alert("Merge failed.");
    } finally {
      setIsMerging(false);
    }
  };

  // Tool buttons for the toolbar
  const tools = [
    { icon: Image, label: 'Images to PDF', color: 'text-green-500', bg: 'bg-green-50 hover:bg-green-100', onClick: () => setShowImageToPdf(true) },
    { icon: FileImage, label: 'PDF to Images', color: 'text-purple-500', bg: 'bg-purple-50 hover:bg-purple-100', onClick: () => setShowPdfToImages(true) },
    { icon: FileDown, label: 'Compress', color: 'text-orange-500', bg: 'bg-orange-50 hover:bg-orange-100', onClick: () => setShowCompress(true) },
    { icon: Lock, label: 'Protect', color: 'text-red-500', bg: 'bg-red-50 hover:bg-red-100', onClick: () => setShowProtect(true) },
    { icon: Stamp, label: 'Watermark', color: 'text-amber-500', bg: 'bg-amber-50 hover:bg-amber-100', onClick: () => setShowWatermark(true) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans selection:bg-primary-100 selection:text-primary-700">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">

        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-lg shadow-blue-900/5 mb-4 border border-gray-100">
            <FileStack className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Simple PDF
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            Merge, split, convert, and transform your PDF files. Fast, secure, and running locally.
          </p>
        </div>

        {/* Tools Toolbar */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tools.map((tool, i) => (
            <button
              key={i}
              onClick={tool.onClick}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border border-transparent ${tool.bg} ${tool.color} hover:border-current/20 active:scale-95`}
            >
              <tool.icon className="w-4 h-4" />
              {tool.label}
            </button>
          ))}
        </div>

        {/* Main Interface */}
        <div className="space-y-8">
          <Dropzone onFilesDropped={handleFilesDropped} />

          {isUploading && (
            <div className="flex items-center justify-center py-4 text-primary-600 animate-pulse gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium text-sm">Uploading files...</span>
            </div>
          )}

          <FileList
            files={files}
            onReorder={handleReorder}
            onRemove={handleRemove}
            onSplit={handleSplitClick}
            onOrganize={handleOrganizeClick}
          />

          {/* Action Bar */}
          <div className="flex flex-col items-center gap-4 pt-4">
            {files.length > 0 && (
              <button
                onClick={handleMerge}
                disabled={files.length < 2 || isMerging}
                className={
                  "flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed " +
                  (files.length < 2
                    ? "bg-gray-200 text-gray-400"
                    : "bg-primary-600 hover:bg-primary-700 text-white hover:shadow-primary-600/30")
                }
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Merging...
                  </>
                ) : (
                  <>
                    Merge PDFs <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}

            {mergedUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <a
                  href={mergedUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Download className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Download Merged PDF</div>
                    <div className="text-xs text-emerald-600/80">Click to save your file</div>
                  </div>
                </a>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {splittingFile && (
        <SplitterModal
          isOpen={true}
          filename={splittingFile.original_name || splittingFile.id}
          originalName={splittingFile.name}
          onClose={() => setSplittingFile(null)}
          onSplitComplete={(url) => {
            window.open(url, '_blank');
          }}
        />
      )}

      {organizingFile && (
        <PageOrganizerModal
          isOpen={true}
          fileId={organizingFile.id}
          fileName={organizingFile.original_name || organizingFile.id}
          originalName={organizingFile.name}
          fileUrl={null}
          onClose={() => setOrganizingFile(null)}
          onOrganizeComplete={(url) => {
            window.open(url, '_blank');
          }}
        />
      )}

      <ImageToPdfModal
        isOpen={showImageToPdf}
        onClose={() => setShowImageToPdf(false)}
      />

      <PdfToImagesModal
        isOpen={showPdfToImages}
        onClose={() => setShowPdfToImages(false)}
      />

      <CompressModal
        isOpen={showCompress}
        onClose={() => setShowCompress(false)}
      />

      <ProtectModal
        isOpen={showProtect}
        onClose={() => setShowProtect(false)}
      />

      <WatermarkModal
        isOpen={showWatermark}
        onClose={() => setShowWatermark(false)}
      />
    </div>
  );
}

export default App;

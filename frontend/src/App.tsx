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
import { RemovePagesModal } from './components/RemovePagesModal';
import { ExtractPagesModal } from './components/ExtractPagesModal';
import { RotateModal } from './components/RotateModal';
import { PageNumbersModal } from './components/PageNumbersModal';
import { CropModal } from './components/CropModal';
import { EditPdfModal } from './components/EditPdfModal';
import { RepairModal } from './components/RepairModal';
import { OcrModal } from './components/OcrModal';
import { WordToPdfModal } from './components/WordToPdfModal';
import { PptxToPdfModal } from './components/PptxToPdfModal';
import { ExcelToPdfModal } from './components/ExcelToPdfModal';
import { HtmlToPdfModal } from './components/HtmlToPdfModal';
import { PdfToWordModal } from './components/PdfToWordModal';
import { PdfToPptxModal } from './components/PdfToPptxModal';
import { PdfToExcelModal } from './components/PdfToExcelModal';
import { PdfToPdfaModal } from './components/PdfToPdfaModal';
import {
  ArrowRight, FileStack, Loader2, Download,
  Merge, Scissors, Trash2, FileOutput, GripVertical, ScanLine,
  FileDown, Wrench, ScanText,
  Image, FileText, Presentation, Sheet, Code,
  FileImage, Archive,
  RotateCw, Hash, Stamp, Crop, Pencil,
  type LucideIcon
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_URL } from './lib/config';

// Generate a unique session ID
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface FileItem {
  id: string;
  name: string;
  original_name?: string;
}

interface ToolItem {
  icon: LucideIcon;
  label: string;
  color: string;
  onClick: () => void;
}

interface ToolCategory {
  title: string;
  color: string;
  tools: ToolItem[];
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [showMergeSection, setShowMergeSection] = useState(false);

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
  const [showRemovePages, setShowRemovePages] = useState(false);
  const [showExtractPages, setShowExtractPages] = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [showEditPdf, setShowEditPdf] = useState(false);
  const [showRepair, setShowRepair] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [showWordToPdf, setShowWordToPdf] = useState(false);
  const [showPptxToPdf, setShowPptxToPdf] = useState(false);
  const [showExcelToPdf, setShowExcelToPdf] = useState(false);
  const [showHtmlToPdf, setShowHtmlToPdf] = useState(false);
  const [showPdfToWord, setShowPdfToWord] = useState(false);
  const [showPdfToPptx, setShowPdfToPptx] = useState(false);
  const [showPdfToExcel, setShowPdfToExcel] = useState(false);
  const [showPdfToPdfa, setShowPdfToPdfa] = useState(false);

  // Cleanup files when user leaves the page
  useEffect(() => {
    const cleanup = () => {
      const filesToClean = files.map(f => f.original_name).filter(Boolean);
      if (filesToClean.length > 0) {
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
      cleanup();
    };
  }, [files]);

  const handleFilesDropped = async (newFiles: File[]) => {
    setIsUploading(true);
    setMergedUrl(null);
    try {
      const uploadPromises = newFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_id', sessionIdRef.current);
        const response = await axios.post(`${API_URL}/upload`, formData);
        return {
          id: response.data.id,
          name: file.name,
          original_name: response.data.original_name
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

  const handleRemove = (id: string) => { setFiles((prev) => prev.filter((f) => f.id !== id)); setMergedUrl(null); };
  const handleReorder = (newFiles: FileItem[]) => { setFiles(newFiles); };
  const handleSplitClick = (id: string) => { const file = files.find(f => f.id === id); if (file) setSplittingFile(file); };
  const handleOrganizeClick = (id: string) => { const file = files.find(f => f.id === id); if (file) setOrganizingFile(file); };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsMerging(true);
    try {
      const payload = { files: files.map(f => f.original_name || f.id) };
      const response = await axios.post(`${API_URL}/merge`, payload);
      setMergedUrl(`${API_URL}${response.data.url}`);
    } catch (error) {
      console.error("Merge failed", error);
      alert("Merge failed.");
    } finally {
      setIsMerging(false);
    }
  };

  // Tool categories matching the reference design
  const toolCategories: ToolCategory[] = [
    {
      title: 'ORGANIZE PDF',
      color: 'text-gray-700',
      tools: [
        { icon: Merge, label: 'Merge PDF', color: 'text-amber-600', onClick: () => setShowMergeSection(true) },
        { icon: Scissors, label: 'Split PDF', color: 'text-amber-600', onClick: () => setShowMergeSection(true) },
        { icon: Trash2, label: 'Remove pages', color: 'text-red-500', onClick: () => setShowRemovePages(true) },
        { icon: FileOutput, label: 'Extract pages', color: 'text-indigo-500', onClick: () => setShowExtractPages(true) },
        { icon: GripVertical, label: 'Organize PDF', color: 'text-purple-500', onClick: () => setShowMergeSection(true) },
        { icon: ScanLine, label: 'Scan to PDF', color: 'text-gray-600', onClick: () => setShowImageToPdf(true) },
      ]
    },
    {
      title: 'OPTIMIZE PDF',
      color: 'text-gray-700',
      tools: [
        { icon: FileDown, label: 'Compress PDF', color: 'text-orange-500', onClick: () => setShowCompress(true) },
        { icon: Wrench, label: 'Repair PDF', color: 'text-yellow-500', onClick: () => setShowRepair(true) },
        { icon: ScanText, label: 'OCR PDF', color: 'text-cyan-500', onClick: () => setShowOcr(true) },
      ]
    },
    {
      title: 'CONVERT TO PDF',
      color: 'text-gray-700',
      tools: [
        { icon: Image, label: 'JPG to PDF', color: 'text-yellow-500', onClick: () => setShowImageToPdf(true) },
        { icon: FileText, label: 'WORD to PDF', color: 'text-blue-600', onClick: () => setShowWordToPdf(true) },
        { icon: Presentation, label: 'POWERPOINT to PDF', color: 'text-orange-500', onClick: () => setShowPptxToPdf(true) },
        { icon: Sheet, label: 'EXCEL to PDF', color: 'text-green-600', onClick: () => setShowExcelToPdf(true) },
        { icon: Code, label: 'HTML to PDF', color: 'text-emerald-500', onClick: () => setShowHtmlToPdf(true) },
      ]
    },
    {
      title: 'CONVERT FROM PDF',
      color: 'text-gray-700',
      tools: [
        { icon: FileImage, label: 'PDF to JPG', color: 'text-yellow-500', onClick: () => setShowPdfToImages(true) },
        { icon: FileText, label: 'PDF to WORD', color: 'text-blue-600', onClick: () => setShowPdfToWord(true) },
        { icon: Presentation, label: 'PDF to POWERPOINT', color: 'text-orange-500', onClick: () => setShowPdfToPptx(true) },
        { icon: Sheet, label: 'PDF to EXCEL', color: 'text-green-600', onClick: () => setShowPdfToExcel(true) },
        { icon: Archive, label: 'PDF to PDF/A', color: 'text-amber-600', onClick: () => setShowPdfToPdfa(true) },
      ]
    },
    {
      title: 'EDIT PDF',
      color: 'text-gray-700',
      tools: [
        { icon: RotateCw, label: 'Rotate PDF', color: 'text-teal-500', onClick: () => setShowRotate(true) },
        { icon: Hash, label: 'Add page numbers', color: 'text-blue-500', onClick: () => setShowPageNumbers(true) },
        { icon: Stamp, label: 'Add watermark', color: 'text-amber-500', onClick: () => setShowWatermark(true) },
        { icon: Crop, label: 'Crop PDF', color: 'text-pink-500', onClick: () => setShowCrop(true) },
        { icon: Pencil, label: 'Edit PDF', color: 'text-violet-500', onClick: () => setShowEditPdf(true) },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans selection:bg-primary-100 selection:text-primary-700">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">

        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-lg shadow-blue-900/5 mb-4 border border-gray-100">
            <FileStack className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Simple PDF
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
            Every tool you need to work with PDFs in one place. Fast, secure, and running locally.
          </p>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {toolCategories.map((category, catIdx) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
              className="space-y-3"
            >
              <h3 className={`text-xs font-bold tracking-wider uppercase ${category.color} px-1`}>
                {category.title}
              </h3>
              <div className="space-y-1">
                {category.tools.map((tool, toolIdx) => (
                  <motion.button
                    key={tool.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: catIdx * 0.1 + toolIdx * 0.05 }}
                    onClick={tool.onClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md hover:shadow-gray-200/50 transition-all duration-200 group active:scale-[0.98] border border-transparent hover:border-gray-100"
                  >
                    <div className={`p-1.5 rounded-lg bg-white shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow ${tool.color}`}>
                      <tool.icon className="w-4 h-4" />
                    </div>
                    <span className="group-hover:text-gray-900 transition-colors">{tool.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Merge Section (expandable) */}
        {showMergeSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Merge className="w-5 h-5 text-primary-500" /> Merge, Split & Organize PDFs
              </h2>
              <button onClick={() => { setShowMergeSection(false); setFiles([]); setMergedUrl(null); }}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                Close ✕
              </button>
            </div>

            <Dropzone onFilesDropped={handleFilesDropped} />

            {isUploading && (
              <div className="flex items-center justify-center py-4 text-primary-600 animate-pulse gap-2 mt-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium text-sm">Uploading files...</span>
              </div>
            )}

            <div className="mt-4">
              <FileList
                files={files}
                onReorder={handleReorder}
                onRemove={handleRemove}
                onSplit={handleSplitClick}
                onOrganize={handleOrganizeClick}
              />
            </div>

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
                    <><Loader2 className="w-5 h-5 animate-spin" /> Merging...</>
                  ) : (
                    <>Merge PDFs <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              )}

              {mergedUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <a href={mergedUrl} download target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm">
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
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-12 pt-8 border-t border-gray-200">
          <p>Simple PDF — All processing happens locally. Your files are never uploaded to external servers.</p>
        </div>
      </div>

      {/* All Modals */}
      {splittingFile && (
        <SplitterModal
          isOpen={true}
          filename={splittingFile.original_name || splittingFile.id}
          originalName={splittingFile.name}
          onClose={() => setSplittingFile(null)}
          onSplitComplete={(url) => { window.open(url, '_blank'); }}
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
          onOrganizeComplete={(result) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === organizingFile.id
                  ? { ...f, name: result.displayName, original_name: result.newFileName }
                  : f
              )
            );
            setMergedUrl(null);
          }}
        />
      )}

      <ImageToPdfModal isOpen={showImageToPdf} onClose={() => setShowImageToPdf(false)} />
      <PdfToImagesModal isOpen={showPdfToImages} onClose={() => setShowPdfToImages(false)} />
      <CompressModal isOpen={showCompress} onClose={() => setShowCompress(false)} />
      <ProtectModal isOpen={showProtect} onClose={() => setShowProtect(false)} />
      <WatermarkModal isOpen={showWatermark} onClose={() => setShowWatermark(false)} />
      <RemovePagesModal isOpen={showRemovePages} onClose={() => setShowRemovePages(false)} />
      <ExtractPagesModal isOpen={showExtractPages} onClose={() => setShowExtractPages(false)} />
      <RotateModal isOpen={showRotate} onClose={() => setShowRotate(false)} />
      <PageNumbersModal isOpen={showPageNumbers} onClose={() => setShowPageNumbers(false)} />
      <CropModal isOpen={showCrop} onClose={() => setShowCrop(false)} />
      <EditPdfModal isOpen={showEditPdf} onClose={() => setShowEditPdf(false)} />
      <RepairModal isOpen={showRepair} onClose={() => setShowRepair(false)} />
      <OcrModal isOpen={showOcr} onClose={() => setShowOcr(false)} />
      <WordToPdfModal isOpen={showWordToPdf} onClose={() => setShowWordToPdf(false)} />
      <PptxToPdfModal isOpen={showPptxToPdf} onClose={() => setShowPptxToPdf(false)} />
      <ExcelToPdfModal isOpen={showExcelToPdf} onClose={() => setShowExcelToPdf(false)} />
      <HtmlToPdfModal isOpen={showHtmlToPdf} onClose={() => setShowHtmlToPdf(false)} />
      <PdfToWordModal isOpen={showPdfToWord} onClose={() => setShowPdfToWord(false)} />
      <PdfToPptxModal isOpen={showPdfToPptx} onClose={() => setShowPdfToPptx(false)} />
      <PdfToExcelModal isOpen={showPdfToExcel} onClose={() => setShowPdfToExcel(false)} />
      <PdfToPdfaModal isOpen={showPdfToPdfa} onClose={() => setShowPdfToPdfa(false)} />
    </div>
  );
}

export default App;

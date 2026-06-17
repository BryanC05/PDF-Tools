import { useState } from 'react';
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
import { PdfToPdfaModal } from './components/PdfToPdfaModal';
import { GrayscaleModal } from './components/GrayscaleModal';
import { MetadataModal } from './components/MetadataModal';
import { FormFillerModal } from './components/FormFillerModal';
import { SignPdfModal } from './components/SignPdfModal';
import {
  ArrowRight, FileStack, Loader2, Download,
  Merge, Scissors, Trash2, FileOutput, GripVertical, ScanLine,
  FileDown, Wrench, ScanText,
  Image,
  FileImage, Archive,
  RotateCw, Hash, Stamp, Crop, Pencil,
  Palette, FileText, ClipboardList, PenTool,
  type LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FileItem {
  id: string;
  name: string;
  file?: File;
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
  const [showPdfToPdfa, setShowPdfToPdfa] = useState(false);
  const [showGrayscale, setShowGrayscale] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showFormFiller, setShowFormFiller] = useState(false);
  const [showSignPdf, setShowSignPdf] = useState(false);

  const handleOpenMergeSection = () => {
    setShowMergeSection(true);
    setTimeout(() => {
      document.getElementById('merge-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFilesDropped = async (newFiles: File[]) => {
    setIsUploading(true);
    setMergedUrl(null);
    try {
      const uploadedFiles = newFiles.map((file) => ({
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        file: file
      }));
      setFiles((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error("File processing failed", error);
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
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();
      
      for (const fileItem of files) {
        if (!fileItem.file) continue;
        const fileBytes = await fileItem.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);
    } catch (error) {
      console.error("Merge failed", error);
      alert("Merge failed client-side. Make sure all files are valid PDFs.");
    } finally {
      setIsMerging(false);
    }
  };

  // Tool categories matching the reference design
  const toolCategories: ToolCategory[] = [
    {
      title: 'ORGANIZE PDF',
      color: 'text-dr-pink',
      tools: [
        { icon: Merge, label: 'Merge PDF', color: 'text-dr-pink', onClick: handleOpenMergeSection },
        { icon: Scissors, label: 'Split PDF', color: 'text-dr-pink', onClick: handleOpenMergeSection },
        { icon: Trash2, label: 'Remove pages', color: 'text-dr-pink', onClick: () => setShowRemovePages(true) },
        { icon: FileOutput, label: 'Extract pages', color: 'text-dr-pink', onClick: () => setShowExtractPages(true) },
        { icon: GripVertical, label: 'Organize PDF', color: 'text-dr-pink', onClick: handleOpenMergeSection },
        { icon: ScanLine, label: 'Scan to PDF', color: 'text-dr-pink', onClick: () => setShowImageToPdf(true) },
      ]
    },
    {
      title: 'OPTIMIZE PDF',
      color: 'text-dr-cyan',
      tools: [
        { icon: FileDown, label: 'Compress PDF', color: 'text-dr-cyan', onClick: () => setShowCompress(true) },
        { icon: Wrench, label: 'Repair PDF', color: 'text-dr-cyan', onClick: () => setShowRepair(true) },
        { icon: ScanText, label: 'OCR PDF', color: 'text-dr-cyan', onClick: () => setShowOcr(true) },
        { icon: Palette, label: 'Grayscale', color: 'text-dr-cyan', onClick: () => setShowGrayscale(true) },
      ]
    },
    {
      title: 'CONVERT TO PDF',
      color: 'text-dr-yellow',
      tools: [
        { icon: Image, label: 'JPG to PDF', color: 'text-dr-yellow', onClick: () => setShowImageToPdf(true) },
      ]
    },
    {
      title: 'CONVERT FROM PDF',
      color: 'text-dr-teal',
      tools: [
        { icon: FileImage, label: 'PDF to JPG', color: 'text-dr-teal', onClick: () => setShowPdfToImages(true) },
        { icon: Archive, label: 'PDF to PDF/A', color: 'text-dr-teal', onClick: () => setShowPdfToPdfa(true) },
      ]
    },
    {
      title: 'EDIT PDF',
      color: 'text-dr-pink',
      tools: [
        { icon: RotateCw, label: 'Rotate PDF', color: 'text-dr-pink', onClick: () => setShowRotate(true) },
        { icon: Hash, label: 'Add page numbers', color: 'text-dr-pink', onClick: () => setShowPageNumbers(true) },
        { icon: Stamp, label: 'Add watermark', color: 'text-dr-pink', onClick: () => setShowWatermark(true) },
        { icon: Crop, label: 'Crop PDF', color: 'text-dr-pink', onClick: () => setShowCrop(true) },
        { icon: Pencil, label: 'Edit PDF', color: 'text-dr-pink', onClick: () => setShowEditPdf(true) },
        { icon: PenTool, label: 'Sign PDF', color: 'text-dr-pink', onClick: () => setShowSignPdf(true) },
        { icon: FileText, label: 'Edit metadata', color: 'text-dr-pink', onClick: () => setShowMetadata(true) },
        { icon: ClipboardList, label: 'Fill forms', color: 'text-dr-pink', onClick: () => setShowFormFiller(true) },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-tr from-dr-teal via-dr-pink to-dr-yellow p-6 md:p-12 relative bg-halftone bg-scanline bg-palm-silhouette selection:bg-dr-cyan selection:text-dr-black">
      <div className="max-w-6xl mx-auto py-12 md:py-20">

        {/* Header */}
        <div className="text-center space-y-4 mb-16 relative">
          <div className="inline-flex items-center justify-center p-4 bg-dr-black border-4 border-dr-black text-dr-pink shadow-[4px_4px_0px_#00f3ff] dr-skew mb-4">
            <FileStack className="w-10 h-10 dr-skew-reverse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-dr-black dr-title dr-skew uppercase mb-3">
            Simple PDF
          </h1>
          <div className="dr-skew bg-dr-yellow border-4 border-dr-black px-6 py-2 inline-block shadow-[4px_4px_0px_#111111] mb-6">
            <p className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-dr-black dr-skew-reverse">
              Offline Client-Side PDF Suite
            </p>
          </div>
          <p className="text-sm font-bold text-dr-black max-w-lg mx-auto leading-relaxed bg-dr-white border-4 border-dr-black p-4 shadow-[5px_5px_0px_#111111] dr-skew">
            <span className="block dr-skew-reverse">
              Every tool you need to merge, split, and edit PDFs. 100% local inside your browser. Your files never leave your device.
            </span>
          </p>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 mb-16">
          {toolCategories.map((category, catIdx) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1 }}
              className="space-y-4 p-5 bg-dr-white border-4 border-dr-black shadow-[6px_6px_0px_#111111] dr-skew flex flex-col justify-between"
            >
              <div className="dr-skew-reverse">
                <h3 className={`text-xs font-black tracking-wider uppercase bg-dr-black text-white px-3 py-1.5 inline-block border-2 border-dr-black mb-3 ${category.color}`}>
                  {category.title}
                </h3>
              </div>
              <div className="space-y-2 dr-skew-reverse">
                {category.tools.map((tool, toolIdx) => (
                  <motion.button
                    key={tool.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: catIdx * 0.1 + toolIdx * 0.05 }}
                    onClick={tool.onClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-dr-white border-2 border-dr-black hover:bg-dr-cyan text-sm font-extrabold text-dr-black active:scale-[0.98] shadow-[2px_2px_0px_#111111] hover:shadow-[4px_4px_0px_#ff007f] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-100 group"
                  >
                    <div className={`p-1 border border-dr-black bg-dr-white shadow-sm group-hover:shadow transition-shadow ${tool.color}`}>
                      <tool.icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{tool.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Merge Section (expandable) */}
        {showMergeSection && (
          <motion.div
            id="merge-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dr-white border-4 border-dr-black shadow-[8px_8px_0px_#ff007f] p-8 mb-8 dr-skew"
          >
            <div className="flex items-center justify-between mb-6 dr-skew-reverse">
              <h2 className="text-2xl font-black text-dr-black flex items-center gap-2 uppercase tracking-wide">
                <Merge className="w-6 h-6 text-dr-pink" /> Merge, Split & Organize
              </h2>
              <button onClick={() => { setShowMergeSection(false); setFiles([]); setMergedUrl(null); }}
                className="text-dr-black hover:text-dr-pink font-extrabold text-sm uppercase px-3 py-1 border-2 border-dr-black bg-dr-white shadow-[2px_2px_0px_#111111] hover:shadow-[4px_4px_0px_#00f3ff] transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px]">
                Close ✕
              </button>
            </div>

            <div className="dr-skew-reverse">
              <Dropzone onFilesDropped={handleFilesDropped} />

              {isUploading && (
                <div className="flex items-center justify-center py-4 text-dr-pink animate-pulse gap-2 mt-4 font-bold uppercase text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading files...</span>
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

              <div className="flex flex-col items-center gap-4 pt-6">
                {files.length > 0 && (
                  <button
                    onClick={handleMerge}
                    disabled={files.length < 2 || isMerging}
                    className={
                      "dr-btn dr-btn-pink text-lg px-8 py-3.5 flex items-center gap-2 " +
                      (files.length < 2 ? "opacity-50 cursor-not-allowed" : "")
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
                      className="flex items-center gap-3 px-6 py-4 bg-dr-teal text-dr-white border-4 border-dr-black shadow-[4px_4px_0px_#ffea00] hover:shadow-[6px_6px_0px_#ff007f] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]">
                      <div className="p-2 bg-dr-white text-dr-black border-2 border-dr-black">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="text-left font-sans">
                        <div className="font-extrabold text-sm uppercase tracking-wide">Download Merged PDF</div>
                        <div className="text-xs opacity-90">Click to claim your file</div>
                      </div>
                    </a>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-xs font-bold text-dr-black/60 mt-16 pt-8 border-t-4 border-dashed border-dr-black/20">
          <p>Simple PDF — All processing happens locally in your browser. Your files never leave your device.</p>
        </div>
      </div>

      {/* All Modals */}
      {splittingFile && splittingFile.file && (
        <SplitterModal
          isOpen={true}
          file={splittingFile.file}
          onClose={() => setSplittingFile(null)}
          onSplitComplete={(url) => { window.open(url, '_blank'); }}
        />
      )}

      {organizingFile && organizingFile.file && (
        <PageOrganizerModal
          isOpen={true}
          file={organizingFile.file}
          onClose={() => setOrganizingFile(null)}
          onOrganizeComplete={(updatedFile) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === organizingFile.id
                  ? { ...f, name: updatedFile.name, file: updatedFile }
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
      <PdfToPdfaModal isOpen={showPdfToPdfa} onClose={() => setShowPdfToPdfa(false)} />
      <GrayscaleModal isOpen={showGrayscale} onClose={() => setShowGrayscale(false)} />
      <MetadataModal isOpen={showMetadata} onClose={() => setShowMetadata(false)} />
      <FormFillerModal isOpen={showFormFiller} onClose={() => setShowFormFiller(false)} />
      <SignPdfModal isOpen={showSignPdf} onClose={() => setShowSignPdf(false)} />
    </div>
  );
}

export default App;

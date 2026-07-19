import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Stamp, Upload, Loader2, Download, X, RotateCw, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import { addWatermark } from '../lib/pdfUtilsClient';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface WatermarkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const POSITION_OPTIONS = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'tiled', label: 'Tiled (Repeat)' },
];

const PRESET_COLORS = [
    '#808080', '#FF0000', '#0000FF', '#000000', '#FF6B00', '#800080',
];

export function WatermarkModal({ isOpen, onClose }: WatermarkModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState(0.3);
    const [fontSize, setFontSize] = useState(60);
    const [rotation, setRotation] = useState(45);
    const [position, setPosition] = useState('center');
    const [color, setColor] = useState('#808080');
    const [repeatX, setRepeatX] = useState(3);
    const [repeatY, setRepeatY] = useState(4);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(1);
    const [pageWidth] = useState(400);
    const containerRef = useRef<HTMLDivElement>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const pdf = acceptedFiles.find(f => f.type === 'application/pdf');
        if (pdf) {
            setPdfFile(pdf);
            setResultUrl(null);
            setNumPages(1);
            // Create object URL for preview
            const url = URL.createObjectURL(pdf);
            setPdfUrl(url);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const handleWatermark = async () => {
        if (!pdfFile || !watermarkText) return;
        setIsProcessing(true);
        setResultUrl(null);

        try {
            const blob = await addWatermark(pdfFile, watermarkText, {
                opacity,
                fontSize,
                rotation,
                position: position as 'center' | 'tile',
                color: {
                    r: parseInt(color.slice(1, 3), 16) / 255,
                    g: parseInt(color.slice(3, 5), 16) / 255,
                    b: parseInt(color.slice(5, 7), 16) / 255,
                }
            });
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
        } catch (error) {
            console.error('Watermarking failed', error);
            alert('Failed to add watermark.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setPdfFile(null);
        setPdfUrl(null);
        setWatermarkText('CONFIDENTIAL');
        setOpacity(0.3);
        setFontSize(60);
        setRotation(45);
        setPosition('center');
        setColor('#808080');
        setRepeatX(3);
        setRepeatY(4);
        setResultUrl(null);
        setNumPages(1);
        onClose();
    };

    const getPositionStyles = () => {
        if (position === 'center') return { inset: 0 };
        if (position === 'top-left') return { top: '5%', left: '5%' };
        if (position === 'top-right') return { top: '5%', right: '5%' };
        if (position === 'bottom-left') return { bottom: '5%', left: '5%' };
        if (position === 'bottom-right') return { bottom: '5%', right: '5%' };
        return {};
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden border border-gray-100 my-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Stamp className="w-5 h-5 text-amber-500" />
                                Add Watermark
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col md:flex-row">
                            {/* Left Panel - Controls */}
                            <div className="w-full md:w-1/2 p-6 space-y-4 max-h-[75vh] overflow-y-auto border-r border-gray-100">
                                {/* Dropzone */}
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${isDragActive ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                                    {pdfFile ? (
                                        <p className="text-gray-700 font-medium text-sm">{pdfFile.name}</p>
                                    ) : (
                                        <p className="text-gray-500 text-sm">Drag & drop a PDF</p>
                                    )}
                                </div>

                                {/* Watermark Text */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Watermark Text</label>
                                    <input
                                        type="text"
                                        value={watermarkText}
                                        onChange={(e) => setWatermarkText(e.target.value)}
                                        placeholder="Enter watermark text"
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                    />
                                </div>

                                {/* Position */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Position</label>
                                    <select
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
                                    >
                                        {POSITION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Color</label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-amber-500 scale-110' : 'border-gray-200'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-7 h-7 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Tiled Options */}
                                {position === 'tiled' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="p-4 bg-amber-50 rounded-xl space-y-3 border border-amber-100"
                                    >
                                        <div className="flex items-center gap-2 text-amber-700">
                                            <Grid3X3 className="w-4 h-4" />
                                            <span className="font-medium text-sm">Tile Settings</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-600">Columns</label>
                                                <input type="number" min="1" max="10" value={repeatX}
                                                    onChange={(e) => setRepeatX(parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-center" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-600">Rows</label>
                                                <input type="number" min="1" max="10" value={repeatY}
                                                    onChange={(e) => setRepeatY(parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-center" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Sliders */}
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex justify-between">
                                            <span>Font Size</span>
                                            <span className="text-amber-600">{fontSize}px</span>
                                        </label>
                                        <input type="range" min="20" max="150" step="5" value={fontSize}
                                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                                            className="w-full accent-amber-500" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex justify-between">
                                            <span className="flex items-center gap-1">
                                                <RotateCw className="w-3 h-3" /> Rotation
                                            </span>
                                            <span className="text-amber-600">{rotation}°</span>
                                        </label>
                                        <input type="range" min="-90" max="90" step="5" value={rotation}
                                            onChange={(e) => setRotation(parseInt(e.target.value))}
                                            className="w-full accent-amber-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 flex justify-between">
                                            <span>Opacity</span>
                                            <span className="text-amber-600">{Math.round(opacity * 100)}%</span>
                                        </label>
                                        <input type="range" min="0.1" max="1" step="0.05" value={opacity}
                                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                            className="w-full accent-amber-500" />
                                    </div>
                                </div>

                                {/* Result */}
                                {resultUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
                                    >
                                        <a href={resultUrl} target="_blank" rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">
                                            <Download className="w-4 h-4" /> Download Watermarked PDF
                                        </a>
                                    </motion.div>
                                )}
                            </div>

                            {/* Right Panel - PDF Preview */}
                            <div className="w-full md:w-1/2 p-6 bg-gray-50 flex flex-col items-center justify-center min-h-[500px]" ref={containerRef}>
                                {pdfUrl ? (
                                    <div className="relative">
                                        <Document
                                            file={pdfUrl}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            loading={
                                                <div className="flex items-center justify-center h-96">
                                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                                    <span className="ml-3 text-gray-600">Loading PDF...</span>
                                                </div>
                                            }
                                            error={
                                                <div className="text-red-500 text-center p-4">
                                                    Failed to load PDF preview
                                                </div>
                                            }
                                        >
                                            <div className="relative">
                                                <Page
                                                    pageNumber={1}
                                                    width={pageWidth}
                                                    renderAnnotationLayer={false}
                                                    renderTextLayer={false}
                                                />
                                                {/* Watermark Overlay */}
                                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                                    {position === 'tiled' ? (
                                                        Array.from({ length: repeatX * repeatY }).map((_, i) => {
                                                            const col = i % repeatX;
                                                            const row = Math.floor(i / repeatX);
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className="absolute flex items-center justify-center"
                                                                    style={{
                                                                        width: `${100 / repeatX}%`,
                                                                        height: `${100 / repeatY}%`,
                                                                        left: `${(col * 100) / repeatX}%`,
                                                                        top: `${(row * 100) / repeatY}%`,
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            color: color,
                                                                            opacity: opacity,
                                                                            fontSize: `${fontSize / 3}px`,
                                                                            fontWeight: 'bold',
                                                                            transform: `rotate(${rotation}deg)`,
                                                                            whiteSpace: 'nowrap',
                                                                            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                                        }}
                                                                    >
                                                                        {watermarkText || 'WATERMARK'}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div
                                                            className="absolute pointer-events-none"
                                                            style={getPositionStyles()}
                                                        >
                                                            <span
                                                                style={{
                                                                    color: color,
                                                                    opacity: opacity,
                                                                    fontSize: `${fontSize / 2}px`,
                                                                    fontWeight: 'bold',
                                                                    transform: `rotate(${rotation}deg)`,
                                                                    whiteSpace: 'nowrap',
                                                                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                                }}
                                                            >
                                                                {watermarkText || 'WATERMARK'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Document>
                                        <div className="mt-4 text-center text-sm text-gray-500">
                                            Page 1 of {numPages} • Preview (watermark shown for illustration)
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Upload a PDF to preview</p>
                                        <p className="text-sm mt-2">See how your watermark will look</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleWatermark}
                                disabled={!pdfFile || !watermarkText || isProcessing}
                                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <Stamp className="w-4 h-4" /> Add Watermark
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

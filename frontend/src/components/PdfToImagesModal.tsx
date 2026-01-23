import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileImage, Upload, Loader2, X, ImageDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

interface PdfToImagesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PdfToImagesModal({ isOpen, onClose }: PdfToImagesModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const pdf = acceptedFiles.find(f => f.type === 'application/pdf');
        if (pdf) {
            setPdfFile(pdf);
            setResultUrl(null);
            setError(null);
            setProgress(0);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleConvert = async () => {
        if (!pdfFile) return;
        setIsConverting(true);
        setResultUrl(null);
        setError(null);
        setProgress(0);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            const zip = new JSZip();
            const totalPages = pdf.numPages;

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 }); // High quality

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                        canvas: canvas
                    } as any).promise;

                    // Convert to blob
                    const blob = await new Promise<Blob>((resolve) => {
                        canvas.toBlob((b) => resolve(b!), 'image/png');
                    });

                    zip.file(`page_${i}.png`, blob);
                }

                setProgress(Math.round((i / totalPages) * 100));
            }

            // Generate zip
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            setResultUrl(url);

        } catch (err: any) {
            console.error('Conversion failed', err);
            setError(err?.message || 'Failed to convert PDF to images.');
        } finally {
            setIsConverting(false);
        }
    };

    const handleClose = () => {
        if (resultUrl) {
            URL.revokeObjectURL(resultUrl);
        }
        setPdfFile(null);
        setResultUrl(null);
        setError(null);
        setProgress(0);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <FileImage className="w-5 h-5 text-purple-500" />
                                PDF to Images
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Dropzone */}
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                {pdfFile ? (
                                    <p className="text-gray-700 font-medium">{pdfFile.name}</p>
                                ) : (
                                    <p className="text-gray-500">
                                        {isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF, or click to select'}
                                    </p>
                                )}
                            </div>

                            {/* Progress */}
                            {isConverting && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Converting pages...</span>
                                        <span className="text-purple-600 font-medium">{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Result */}
                            {resultUrl && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-purple-50 border border-purple-200 rounded-xl"
                                >
                                    <a
                                        href={resultUrl}
                                        download={`${pdfFile?.name.replace('.pdf', '')}_images.zip`}
                                        className="flex items-center gap-3 text-purple-700 hover:text-purple-800"
                                    >
                                        <ImageDown className="w-5 h-5" />
                                        <span className="font-medium">Download Images (ZIP)</span>
                                    </a>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleConvert}
                                disabled={!pdfFile || isConverting}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isConverting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Converting...
                                    </>
                                ) : (
                                    <>
                                        Convert to Images
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

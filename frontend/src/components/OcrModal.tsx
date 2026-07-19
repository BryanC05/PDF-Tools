import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ScanText, Upload, X, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callBackend } from '../lib/apiConfig';


interface OcrModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OcrModal({ isOpen, onClose }: OcrModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const pdf = acceptedFiles.find(f => f.type === 'application/pdf');
        if (pdf) {
            setPdfFile(pdf);
            setResultUrl(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleOcr = async () => {
        if (!pdfFile) return;
        
        setIsProcessing(true);
        setResultUrl(null);
        
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            
            const blob = await callBackend('/ocr', formData);
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
        } catch (error) {
            console.error('OCR failed:', error);
            alert('OCR failed. Make sure the backend is running.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        setPdfFile(null);
        setResultUrl(null);
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
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <ScanText className="w-5 h-5 text-cyan-500" />
                                OCR PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-cyan-300 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10'}`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                {pdfFile ? (
                                    <p className="text-gray-700 dark:text-gray-200 font-medium text-sm">{pdfFile.name}</p>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        {isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF'}
                                    </p>
                                )}
                            </div>

                            {resultUrl && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl"
                                >
                                    <a href={resultUrl} download={`ocr_${pdfFile?.name}`}
                                        className="flex items-center justify-center gap-2 w-full py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium">
                                        <Download className="w-4 h-4" /> Download OCR PDF
                                    </a>
                                </motion.div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium">
                                Close
                            </button>
                            <button
                                onClick={handleOcr}
                                disabled={!pdfFile || isProcessing}
                                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProcessing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing</>
                                ) : (
                                    <><ScanText className="w-4 h-4" /> OCR</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Code, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackendRequiredBanner } from './BackendRequiredBanner';

interface HtmlToPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HtmlToPdfModal({ isOpen, onClose }: HtmlToPdfModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setPdfFile(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/html': ['.html', '.htm'] },
        maxFiles: 1
    });

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
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Code className="w-5 h-5 text-emerald-500" />
                                HTML to PDF
                            </h3>
                            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                {pdfFile ? (
                                    <p className="text-gray-700 font-medium text-sm">{pdfFile.name}</p>
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        {isDragActive ? 'Drop HTML file here...' : 'Drag & drop an HTML file'}
                                    </p>
                                )}
                            </div>

                            <BackendRequiredBanner
                                featureName="HTML to PDF Conversion"
                                description="Converting HTML pages to PDF requires server-side rendering."
                            />
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

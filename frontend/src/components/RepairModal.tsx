import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Download, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callBackend } from '../lib/apiConfig';

interface RepairModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RepairModal({ isOpen, onClose }: RepairModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isRepairing, setIsRepairing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const pdf = acceptedFiles[0];
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

    const handleRepair = async () => {
        if (!pdfFile) return;
        
        setIsRepairing(true);
        setResultUrl(null);
        
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            
            const blob = await callBackend('/repair', formData);
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
        } catch (error) {
            console.error('Repair failed:', error);
            alert('Repair failed. Make sure the backend is running.');
        } finally {
            setIsRepairing(false);
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
                                <Wrench className="w-5 h-5 text-yellow-500" />
                                Repair PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10'}`}
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
                                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
                                >
                                    <a href={resultUrl} download={`repaired_${pdfFile?.name}`}
                                        className="flex items-center justify-center gap-2 w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium">
                                        <Download className="w-4 h-4" /> Download Repaired PDF
                                    </a>
                                </motion.div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium">
                                Close
                            </button>
                            <button
                                onClick={handleRepair}
                                disabled={!pdfFile || isRepairing}
                                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isRepairing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Repairing...</>
                                ) : (
                                    <><Wrench className="w-4 h-4" /> Repair</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

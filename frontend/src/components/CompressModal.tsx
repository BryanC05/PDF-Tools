import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Archive, Upload, X, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { callBackend } from '../lib/apiConfig';

interface CompressModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CompressModal({ isOpen, onClose }: CompressModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [compressionLevel, setCompressionLevel] = useState('medium');

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

    const handleCompress = async () => {
        if (!pdfFile) return;
        
        setIsCompressing(true);
        setResultUrl(null);
        
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            formData.append('compression_level', compressionLevel);
            
            const blob = await callBackend('/compress-pdf', formData);
            const url = URL.createObjectURL(blob);
            setResultUrl(url);
        } catch (error) {
            console.error('Compression failed:', error);
            alert('Compression failed. Make sure the backend is running.');
        } finally {
            setIsCompressing(false);
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
                                <Archive className="w-5 h-5 text-orange-500" />
                                Compress PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-900/10'}`}
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

                            {pdfFile && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Compression Level</label>
                                    <select
                                        value={compressionLevel}
                                        onChange={(e) => setCompressionLevel(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                                    >
                                        <option value="low">Low (Minimal compression)</option>
                                        <option value="medium">Medium (Balanced)</option>
                                        <option value="high">High (Smallest file)</option>
                                    </select>
                                </div>
                            )}

                            {resultUrl && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl"
                                >
                                    <a href={resultUrl} download={`compressed_${pdfFile?.name}`}
                                        className="flex items-center justify-center gap-2 w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
                                        <Download className="w-4 h-4" /> Download Compressed PDF
                                    </a>
                                </motion.div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium">
                                Close
                            </button>
                            <button
                                onClick={handleCompress}
                                disabled={!pdfFile || isCompressing}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isCompressing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Compressing...</>
                                ) : (
                                    <><Archive className="w-4 h-4" /> Compress</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

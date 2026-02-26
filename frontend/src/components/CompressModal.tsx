import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileDown, Upload, Loader2, Download, X, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface CompressModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CompressModal({ isOpen, onClose }: CompressModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [result, setResult] = useState<{
        url: string;
        original_size: number;
        compressed_size: number;
        reduction_percent: number;
    } | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const pdf = acceptedFiles.find(f => f.type === 'application/pdf');
        if (pdf) {
            setPdfFile(pdf);
            setResult(null);
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
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', pdfFile);

            const response = await axios.post(`${API_URL}/compress`, formData);
            setResult({
                url: `${API_URL}${response.data.url}`,
                original_size: response.data.original_size,
                compressed_size: response.data.compressed_size,
                reduction_percent: response.data.reduction_percent
            });
        } catch (error) {
            console.error('Compression failed', error);
            alert('Failed to compress PDF.');
        } finally {
            setIsCompressing(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleClose = () => {
        setPdfFile(null);
        setResult(null);
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
                                <FileDown className="w-5 h-5 text-orange-500" />
                                Compress PDF
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
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
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

                            {/* Result */}
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3"
                                >
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Original:</span>
                                        <span className="font-medium">{formatSize(result.original_size)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Compressed:</span>
                                        <span className="font-medium text-orange-600">{formatSize(result.compressed_size)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-green-600 font-medium">
                                        <TrendingDown className="w-4 h-4" />
                                        {result.reduction_percent}% smaller
                                    </div>
                                    <a
                                        href={result.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                                    >
                                        <Download className="w-4 h-4" /> Download
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
                                onClick={handleCompress}
                                disabled={!pdfFile || isCompressing}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isCompressing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Compressing...
                                    </>
                                ) : (
                                    <>
                                        Compress
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

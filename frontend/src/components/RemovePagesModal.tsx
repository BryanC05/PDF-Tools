import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Trash2, Upload, Loader2, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface RemovePagesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RemovePagesModal({ isOpen, onClose }: RemovePagesModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pages, setPages] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ url: string; original_pages: number; remaining_pages: number } | null>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => {
            const pdf = files.find(f => f.type === 'application/pdf');
            if (pdf) { setPdfFile(pdf); setResult(null); }
        },
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleProcess = async () => {
        if (!pdfFile || !pages.trim()) return;
        setIsProcessing(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            formData.append('pages', pages);
            const response = await axios.post(`${API_URL}/remove-pages`, formData);
            setResult({
                url: `${API_URL}${response.data.url}`,
                original_pages: response.data.original_pages,
                remaining_pages: response.data.remaining_pages
            });
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Failed to remove pages.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => { setPdfFile(null); setPages(''); setResult(null); onClose(); };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-500" /> Remove Pages
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'}`}>
                                <input {...getInputProps()} />
                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                {pdfFile ? <p className="text-gray-700 font-medium">{pdfFile.name}</p> : <p className="text-gray-500">{isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF, or click to select'}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pages to remove (e.g., 1,3,5-7)</label>
                                <input type="text" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="1,3,5-7"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" />
                            </div>
                            {result && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Original pages:</span>
                                        <span className="font-medium">{result.original_pages}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Remaining pages:</span>
                                        <span className="font-medium text-red-600">{result.remaining_pages}</span>
                                    </div>
                                    <a href={result.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Download
                                    </a>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleProcess} disabled={!pdfFile || !pages.trim() || isProcessing}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Removing...</> : 'Remove Pages'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

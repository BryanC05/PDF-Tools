import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, Download, X, Sheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface PdfToExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PdfToExcelModal({ isOpen, onClose }: PdfToExcelModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ url: string; pages: number } | null>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => {
            const pdf = files.find(f => f.type === 'application/pdf');
            if (pdf) { setPdfFile(pdf); setResult(null); }
        },
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleProcess = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            const response = await axios.post(`${API_URL}/pdf-to-excel`, formData);
            setResult({ url: `${API_URL}${response.data.url}`, pages: response.data.pages });
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Conversion failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => { setPdfFile(null); setResult(null); onClose(); };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Sheet className="w-5 h-5 text-green-600" /> PDF to EXCEL
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'}`}>
                                <input {...getInputProps()} />
                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                {pdfFile ? <p className="text-gray-700 font-medium">{pdfFile.name}</p> : <p className="text-gray-500">{isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF, or click to select'}</p>}
                            </div>
                            <p className="text-xs text-gray-400 text-center">Extracts text from PDF pages into spreadsheet rows</p>
                            {result && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                                    <p className="text-sm text-gray-600">Extracted from <span className="font-medium text-green-600">{result.pages}</span> pages</p>
                                    <a href={result.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Download XLSX
                                    </a>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleProcess} disabled={!pdfFile || isProcessing}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</> : 'Convert to XLSX'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

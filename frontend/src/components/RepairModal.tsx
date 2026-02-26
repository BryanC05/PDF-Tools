import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Wrench, Upload, Loader2, Download, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface RepairModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RepairModal({ isOpen, onClose }: RepairModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => {
            const pdf = files.find(f => f.type === 'application/pdf');
            if (pdf) { setPdfFile(pdf); setResultUrl(null); }
        },
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    const handleProcess = async () => {
        if (!pdfFile) return;
        setIsProcessing(true);
        setResultUrl(null);
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            const response = await axios.post(`${API_URL}/repair`, formData);
            setResultUrl(`${API_URL}${response.data.url}`);
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Failed to repair PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => { setPdfFile(null); setResultUrl(null); onClose(); };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-yellow-500" /> Repair PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'}`}>
                                <input {...getInputProps()} />
                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                {pdfFile ? <p className="text-gray-700 font-medium">{pdfFile.name}</p> : <p className="text-gray-500">{isDragActive ? 'Drop PDF here...' : 'Drag & drop a corrupted PDF, or click to select'}</p>}
                            </div>
                            <p className="text-xs text-gray-400 text-center">Attempts to fix common PDF corruption issues using advanced parsing</p>
                            {resultUrl && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2 text-green-700 font-medium">
                                        <CheckCircle className="w-4 h-4" /> PDF repaired successfully
                                    </div>
                                    <a href={resultUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Download Repaired PDF
                                    </a>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleProcess} disabled={!pdfFile || isProcessing}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Repairing...</> : 'Repair'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

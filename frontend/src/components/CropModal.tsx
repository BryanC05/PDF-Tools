import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Crop, Upload, Loader2, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface CropModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CropModal({ isOpen, onClose }: CropModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [top, setTop] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [left, setLeft] = useState(0);
    const [right, setRight] = useState(0);
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
            formData.append('top', top.toString());
            formData.append('bottom', bottom.toString());
            formData.append('left', left.toString());
            formData.append('right', right.toString());
            const response = await axios.post(`${API_URL}/crop`, formData);
            setResultUrl(`${API_URL}${response.data.url}`);
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Failed to crop PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => { setPdfFile(null); setTop(0); setBottom(0); setLeft(0); setRight(0); setResultUrl(null); onClose(); };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Crop className="w-5 h-5 text-pink-500" /> Crop PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'}`}>
                                <input {...getInputProps()} />
                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                {pdfFile ? <p className="text-gray-700 font-medium">{pdfFile.name}</p> : <p className="text-gray-500">{isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF, or click to select'}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Margins to crop (in points, 72pt = 1 inch)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Top</label>
                                        <input type="number" value={top} onChange={(e) => setTop(Number(e.target.value))} min={0}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Bottom</label>
                                        <input type="number" value={bottom} onChange={(e) => setBottom(Number(e.target.value))} min={0}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Left</label>
                                        <input type="number" value={left} onChange={(e) => setLeft(Number(e.target.value))} min={0}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Right</label>
                                        <input type="number" value={right} onChange={(e) => setRight(Number(e.target.value))} min={0}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" />
                                    </div>
                                </div>
                            </div>
                            {resultUrl && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-pink-50 border border-pink-200 rounded-xl">
                                    <a href={resultUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Download Cropped PDF
                                    </a>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleProcess} disabled={!pdfFile || isProcessing}
                                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Cropping...</> : 'Crop'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

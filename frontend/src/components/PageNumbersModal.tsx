import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Hash, Upload, Loader2, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface PageNumbersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PageNumbersModal({ isOpen, onClose }: PageNumbersModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [position, setPosition] = useState('bottom-center');
    const [fontSize, setFontSize] = useState(12);
    const [formatStr, setFormatStr] = useState('{n}');
    const [startNumber, setStartNumber] = useState(1);
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
            formData.append('position', position);
            formData.append('font_size', fontSize.toString());
            formData.append('format_str', formatStr);
            formData.append('start_number', startNumber.toString());
            const response = await axios.post(`${API_URL}/add-page-numbers`, formData);
            setResultUrl(`${API_URL}${response.data.url}`);
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Failed to add page numbers.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => { setPdfFile(null); setResultUrl(null); onClose(); };

    const positions = [
        { value: 'bottom-left', label: '↙ Bottom Left' },
        { value: 'bottom-center', label: '↓ Bottom Center' },
        { value: 'bottom-right', label: '↘ Bottom Right' },
        { value: 'top-left', label: '↖ Top Left' },
        { value: 'top-center', label: '↑ Top Center' },
        { value: 'top-right', label: '↗ Top Right' },
    ];

    const formats = [
        { value: '{n}', label: '1, 2, 3...' },
        { value: 'Page {n}', label: 'Page 1, Page 2...' },
        { value: '{n} / {total}', label: '1 / 10, 2 / 10...' },
        { value: '- {n} -', label: '- 1 -, - 2 -...' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100 max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Hash className="w-5 h-5 text-blue-500" /> Add Page Numbers
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                                <input {...getInputProps()} />
                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                {pdfFile ? <p className="text-gray-700 font-medium">{pdfFile.name}</p> : <p className="text-gray-500">{isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF, or click to select'}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {positions.map(p => (
                                        <button key={p.value} onClick={() => setPosition(p.value)}
                                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${position === p.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {formats.map(f => (
                                        <button key={f.value} onClick={() => setFormatStr(f.value)}
                                            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${formatStr === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                                    <input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} min={6} max={72}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Number</label>
                                    <input type="number" value={startNumber} onChange={(e) => setStartNumber(Number(e.target.value))} min={1}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                                </div>
                            </div>
                            {resultUrl && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <a href={resultUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Download
                                    </a>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleProcess} disabled={!pdfFile || isProcessing}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Numbers'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

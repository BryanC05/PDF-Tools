import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, Download, X, Globe, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface HtmlToPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HtmlToPdfModal({ isOpen, onClose }: HtmlToPdfModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => { if (files[0]) { setFile(files[0]); setResultUrl(null); } },
        accept: { 'text/html': ['.html', '.htm'] },
        maxFiles: 1
    });

    const handleProcess = async () => {
        setIsProcessing(true);
        setResultUrl(null);
        try {
            const formData = new FormData();
            if (mode === 'file' && file) {
                formData.append('file', file);
            } else if (mode === 'url' && url.trim()) {
                formData.append('url', url.trim());
            } else {
                alert('Please provide a file or URL.'); setIsProcessing(false); return;
            }
            const response = await axios.post(`${API_URL}/html-to-pdf`, formData);
            setResultUrl(`${API_URL}${response.data.url}`);
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Conversion failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => { setFile(null); setUrl(''); setResultUrl(null); onClose(); };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Code className="w-5 h-5 text-emerald-500" /> HTML to PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Mode Toggle */}
                            <div className="flex gap-2">
                                <button onClick={() => setMode('file')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${mode === 'file' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    <Upload className="w-4 h-4" /> Upload File
                                </button>
                                <button onClick={() => setMode('url')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${mode === 'url' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    <Globe className="w-4 h-4" /> From URL
                                </button>
                            </div>

                            {mode === 'file' ? (
                                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}>
                                    <input {...getInputProps()} />
                                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    {file ? <p className="text-gray-700 font-medium">{file.name}</p> : <p className="text-gray-500">{isDragActive ? 'Drop HTML file here...' : 'Drag & drop an .html file, or click to select'}</p>}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
                                </div>
                            )}

                            {resultUrl && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <a href={resultUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Download PDF
                                    </a>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleProcess} disabled={isProcessing || (mode === 'file' ? !file : !url.trim())}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</> : 'Convert to PDF'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

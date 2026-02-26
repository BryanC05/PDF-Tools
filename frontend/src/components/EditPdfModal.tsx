import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Pencil, Upload, Loader2, Download, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface Annotation {
    text: string;
    x: number;
    y: number;
    page: number;
    fontSize: number;
    color: string;
}

interface EditPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EditPdfModal({ isOpen, onClose }: EditPdfModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([
        { text: '', x: 100, y: 700, page: 1, fontSize: 12, color: '#000000' }
    ]);
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

    const addAnnotation = () => {
        setAnnotations([...annotations, { text: '', x: 100, y: 700, page: 1, fontSize: 12, color: '#000000' }]);
    };

    const removeAnnotation = (index: number) => {
        setAnnotations(annotations.filter((_, i) => i !== index));
    };

    const updateAnnotation = (index: number, field: keyof Annotation, value: string | number) => {
        const updated = [...annotations];
        (updated[index] as any)[field] = value;
        setAnnotations(updated);
    };

    const handleProcess = async () => {
        if (!pdfFile) return;
        const validAnnotations = annotations.filter(a => a.text.trim());
        if (validAnnotations.length === 0) { alert('Add at least one text annotation.'); return; }

        setIsProcessing(true);
        setResultUrl(null);
        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            formData.append('annotations', JSON.stringify(validAnnotations));
            const response = await axios.post(`${API_URL}/edit-pdf`, formData);
            setResultUrl(`${API_URL}${response.data.url}`);
        } catch (error: any) {
            alert(error?.response?.data?.detail || 'Failed to edit PDF.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setPdfFile(null);
        setAnnotations([{ text: '', x: 100, y: 700, page: 1, fontSize: 12, color: '#000000' }]);
        setResultUrl(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col overflow-hidden border border-gray-100 max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-violet-500" /> Edit PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'}`}>
                                <input {...getInputProps()} />
                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                {pdfFile ? <p className="text-gray-700 font-medium text-sm">{pdfFile.name}</p> : <p className="text-gray-500 text-sm">{isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF, or click to select'}</p>}
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">Text Annotations</label>
                                    <button onClick={addAnnotation} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium">
                                        <Plus className="w-3 h-3" /> Add
                                    </button>
                                </div>
                                {annotations.map((ann, i) => (
                                    <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <input type="text" value={ann.text} onChange={(e) => updateAnnotation(i, 'text', e.target.value)}
                                                placeholder="Enter text..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none" />
                                            <button onClick={() => removeAnnotation(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-500">Page</label>
                                                <input type="number" value={ann.page} onChange={(e) => updateAnnotation(i, 'page', Number(e.target.value))} min={1}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-violet-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">X</label>
                                                <input type="number" value={ann.x} onChange={(e) => updateAnnotation(i, 'x', Number(e.target.value))}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-violet-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Y</label>
                                                <input type="number" value={ann.y} onChange={(e) => updateAnnotation(i, 'y', Number(e.target.value))}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-violet-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Size</label>
                                                <input type="number" value={ann.fontSize} onChange={(e) => updateAnnotation(i, 'fontSize', Number(e.target.value))} min={6} max={72}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-violet-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Color</label>
                                                <input type="color" value={ann.color} onChange={(e) => updateAnnotation(i, 'color', e.target.value)}
                                                    className="w-full h-7 border border-gray-200 rounded cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {resultUrl && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                                    <a href={resultUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Download Edited PDF
                                    </a>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleProcess} disabled={!pdfFile || isProcessing}
                                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</> : 'Apply Changes'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

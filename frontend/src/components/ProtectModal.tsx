import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Lock, Upload, Loader2, Download, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface ProtectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProtectModal({ isOpen, onClose }: ProtectModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isProtecting, setIsProtecting] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

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

    const handleProtect = async () => {
        if (!pdfFile || !password) return;
        setIsProtecting(true);
        setResultUrl(null);

        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            formData.append('password', password);

            const response = await axios.post('http://localhost:8000/protect', formData);
            setResultUrl(`http://localhost:8000${response.data.url}`);
        } catch (error) {
            console.error('Protection failed', error);
            alert('Failed to protect PDF.');
        } finally {
            setIsProtecting(false);
        }
    };

    const handleClose = () => {
        setPdfFile(null);
        setPassword('');
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
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-red-500" />
                                Password Protect PDF
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
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                {pdfFile ? (
                                    <p className="text-gray-700 font-medium text-sm">{pdfFile.name}</p>
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        {isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF'}
                                    </p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Result */}
                            {resultUrl && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 border border-red-200 rounded-xl"
                                >
                                    <a
                                        href={resultUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 text-red-700 hover:text-red-800"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span className="font-medium">Download Protected PDF</span>
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
                                onClick={handleProtect}
                                disabled={!pdfFile || !password || isProtecting}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProtecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Protecting...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" /> Protect
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

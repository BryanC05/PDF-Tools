import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, Upload, Loader2, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface ImageToPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ImageToPdfModal({ isOpen, onClose }: ImageToPdfModalProps) {
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const imageFiles = acceptedFiles.filter(f => f.type.startsWith('image/'));
        setImages(prev => [...prev, ...imageFiles]);

        // Generate previews
        imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
        setResultUrl(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
        }
    });

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleConvert = async () => {
        if (images.length === 0) return;
        setIsConverting(true);
        setResultUrl(null);

        try {
            const formData = new FormData();
            images.forEach(img => formData.append('files', img));

            const response = await axios.post('http://localhost:8000/images-to-pdf', formData);
            setResultUrl(`http://localhost:8000${response.data.url}`);
        } catch (error) {
            console.error('Conversion failed', error);
            alert('Failed to convert images to PDF.');
        } finally {
            setIsConverting(false);
        }
    };

    const handleClose = () => {
        setImages([]);
        setPreviews([]);
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
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Image className="w-5 h-5 text-green-500" />
                                Images to PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Dropzone */}
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">
                                    {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to select'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, BMP, WebP</p>
                            </div>

                            {/* Image Previews */}
                            {previews.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                            <img src={src} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 p-1 bg-white/80 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">
                                                {i + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Result */}
                            {resultUrl && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl"
                                >
                                    <a
                                        href={resultUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 text-emerald-700 hover:text-emerald-800"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span className="font-medium">Download PDF</span>
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
                                onClick={handleConvert}
                                disabled={images.length === 0 || isConverting}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isConverting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Converting...
                                    </>
                                ) : (
                                    <>
                                        Convert to PDF
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

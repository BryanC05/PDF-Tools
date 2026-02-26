import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Stamp, Upload, Loader2, Download, X, RotateCw, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../lib/config';

interface WatermarkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const POSITION_OPTIONS = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'tiled', label: 'Tiled (Repeat)' },
];

const PRESET_COLORS = [
    '#808080', // Gray
    '#FF0000', // Red
    '#0000FF', // Blue
    '#000000', // Black
    '#FF6B00', // Orange
    '#800080', // Purple
];

export function WatermarkModal({ isOpen, onClose }: WatermarkModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState(0.3);
    const [fontSize, setFontSize] = useState(60);
    const [rotation, setRotation] = useState(45);
    const [position, setPosition] = useState('center');
    const [color, setColor] = useState('#808080');
    const [repeatX, setRepeatX] = useState(3);
    const [repeatY, setRepeatY] = useState(4);
    const [isProcessing, setIsProcessing] = useState(false);
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

    const handleWatermark = async () => {
        if (!pdfFile || !watermarkText) return;
        setIsProcessing(true);
        setResultUrl(null);

        try {
            const formData = new FormData();
            formData.append('file', pdfFile);
            formData.append('text', watermarkText);
            formData.append('opacity', opacity.toString());
            formData.append('font_size', fontSize.toString());
            formData.append('rotation', rotation.toString());
            formData.append('position', position);
            formData.append('color', color);
            formData.append('repeat_x', repeatX.toString());
            formData.append('repeat_y', repeatY.toString());

            const response = await axios.post(`${API_URL}/watermark`, formData);
            setResultUrl(`${API_URL}${response.data.url}`);
        } catch (error) {
            console.error('Watermarking failed', error);
            alert('Failed to add watermark.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setPdfFile(null);
        setWatermarkText('CONFIDENTIAL');
        setOpacity(0.3);
        setFontSize(60);
        setRotation(45);
        setPosition('center');
        setColor('#808080');
        setRepeatX(3);
        setRepeatY(4);
        setResultUrl(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col overflow-hidden border border-gray-100 my-8"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Stamp className="w-5 h-5 text-amber-500" />
                                Add Watermark
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Dropzone */}
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                {pdfFile ? (
                                    <p className="text-gray-700 font-medium text-sm">{pdfFile.name}</p>
                                ) : (
                                    <p className="text-gray-500 text-sm">Drag & drop a PDF</p>
                                )}
                            </div>

                            {/* Watermark Text Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Watermark Text</label>
                                <input
                                    type="text"
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                    placeholder="Enter watermark text"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {/* Position & Color Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Position */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Position</label>
                                    <select
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
                                    >
                                        {POSITION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Color</label>
                                    <div className="flex items-center gap-2">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-amber-500 scale-110' : 'border-gray-200'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-7 h-7 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tiled Options */}
                            {position === 'tiled' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-4 bg-amber-50 rounded-xl space-y-3 border border-amber-100"
                                >
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <Grid3X3 className="w-4 h-4" />
                                        <span className="font-medium text-sm">Tile Settings</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-600">Columns</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={repeatX}
                                                onChange={(e) => setRepeatX(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-600">Rows</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={repeatY}
                                                onChange={(e) => setRepeatY(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-center"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Font Size & Rotation Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Font Size */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex justify-between">
                                        <span>Font Size</span>
                                        <span className="text-amber-600">{fontSize}px</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="20"
                                        max="150"
                                        step="5"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        className="w-full accent-amber-500"
                                    />
                                </div>

                                {/* Rotation */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex justify-between">
                                        <span className="flex items-center gap-1">
                                            <RotateCw className="w-3 h-3" /> Rotation
                                        </span>
                                        <span className="text-amber-600">{rotation}°</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="-90"
                                        max="90"
                                        step="5"
                                        value={rotation}
                                        onChange={(e) => setRotation(parseInt(e.target.value))}
                                        className="w-full accent-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Opacity Slider */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex justify-between">
                                    <span>Opacity</span>
                                    <span className="text-amber-600">{Math.round(opacity * 100)}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.05"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    className="w-full accent-amber-500"
                                />
                            </div>

                            {/* Live Preview */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Preview</label>
                                <div
                                    className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-inner"
                                    style={{ height: '180px' }}
                                >
                                    {/* Grid lines for reference */}
                                    <div className="absolute inset-0 opacity-10" style={{
                                        backgroundImage: 'linear-gradient(to right, #ccc 1px, transparent 1px), linear-gradient(to bottom, #ccc 1px, transparent 1px)',
                                        backgroundSize: '20px 20px'
                                    }} />

                                    {/* Watermark preview */}
                                    {position === 'tiled' ? (
                                        <div className="absolute inset-0 flex flex-wrap items-center justify-center">
                                            {Array.from({ length: repeatX * repeatY }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-center"
                                                    style={{
                                                        width: `${100 / repeatX}%`,
                                                        height: `${100 / repeatY}%`,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: color,
                                                            opacity: opacity,
                                                            fontSize: `${Math.min(fontSize / 4, 16)}px`,
                                                            fontWeight: 'bold',
                                                            transform: `rotate(${rotation}deg)`,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {watermarkText || 'WATERMARK'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            className="absolute flex items-center justify-center"
                                            style={{
                                                ...(position === 'center' && { inset: 0 }),
                                                ...(position === 'top-left' && { top: '10px', left: '10px' }),
                                                ...(position === 'top-right' && { top: '10px', right: '10px' }),
                                                ...(position === 'bottom-left' && { bottom: '10px', left: '10px' }),
                                                ...(position === 'bottom-right' && { bottom: '10px', right: '10px' }),
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: color,
                                                    opacity: opacity,
                                                    fontSize: `${Math.min(fontSize / 3, 28)}px`,
                                                    fontWeight: 'bold',
                                                    transform: `rotate(${rotation}deg)`,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {watermarkText || 'WATERMARK'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Sample page indicator */}
                                    <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded">
                                        Preview
                                    </div>
                                </div>
                            </div>

                            {/* Result */}
                            {resultUrl && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
                                >
                                    <a
                                        href={resultUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-3 text-amber-700 hover:text-amber-800"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span className="font-medium">Download Watermarked PDF</span>
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
                                onClick={handleWatermark}
                                disabled={!pdfFile || !watermarkText || isProcessing}
                                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <Stamp className="w-4 h-4" /> Add Watermark
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

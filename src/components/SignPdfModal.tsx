import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PenTool, Upload, Loader2, Download, X, Trash2, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

interface SignPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SignPdfModal({ isOpen, onClose }: SignPdfModalProps) {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pageNum, setPageNum] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    // Signature state
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [sigX, setSigX] = useState(50);
    const [sigY, setSigY] = useState(50);
    const [sigWidth, setSigWidth] = useState(200);
    const [sigHeight, setSigHeight] = useState(80);

    // Drawing canvas
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showDrawPad, setShowDrawPad] = useState(false);

    // PDF preview canvas
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [previewScale, setPreviewScale] = useState(1);
    const [_pageWidth, setPageWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);
    
    // Signature drag and resize state
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    
    // Handle mouse and touch events for dragging and resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                e.preventDefault();
                const previewRect = previewCanvasRef.current?.getBoundingClientRect();
                if (!previewRect) return;
                
                const newX = e.clientX - previewRect.left - startPos.x;
                const newY = e.clientY - previewRect.top - startPos.y;
                
                setSigX(Math.max(0, Math.min(newX, previewRect.width - sigWidth)));
                setSigY(Math.max(0, Math.min(newY, previewRect.height - sigHeight)));
            }
            
            if (isResizing && resizeHandle) {
                e.preventDefault();
                const previewRect = previewCanvasRef.current?.getBoundingClientRect();
                if (!previewRect) return;
                
                const deltaX = e.clientX - previewRect.left - (sigX + sigWidth);
                const deltaY = e.clientY - previewRect.top - (sigY + sigHeight);
                
                if (resizeHandle.includes('e')) {
                    setSigWidth(Math.max(20, sigWidth + deltaX));
                }
                if (resizeHandle.includes('w')) {
                    const newX = sigX + deltaX;
                    setSigX(Math.max(0, newX));
                    setSigWidth(Math.max(20, sigWidth - deltaX));
                }
                if (resizeHandle.includes('s')) {
                    setSigHeight(Math.max(20, sigHeight + deltaY));
                }
                if (resizeHandle.includes('n')) {
                    const newY = sigY + deltaY;
                    setSigY(Math.max(0, newY));
                    setSigHeight(Math.max(20, sigHeight - deltaY));
                }
            }
        };
        
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging || isResizing) {
                e.preventDefault();
                const touch = e.touches[0];
                const previewRect = previewCanvasRef.current?.getBoundingClientRect();
                if (!previewRect) return;
                
                if (isDragging) {
                    const newX = touch.clientX - previewRect.left - startPos.x;
                    const newY = touch.clientY - previewRect.top - startPos.y;
                    
                    setSigX(Math.max(0, Math.min(newX, previewRect.width - sigWidth)));
                    setSigY(Math.max(0, Math.min(newY, previewRect.height - sigHeight)));
                }
                
                if (isResizing && resizeHandle) {
                    const deltaX = touch.clientX - previewRect.left - (sigX + sigWidth);
                    const deltaY = touch.clientY - previewRect.top - (sigY + sigHeight);
                    
                    if (resizeHandle.includes('e')) {
                        setSigWidth(Math.max(20, sigWidth + deltaX));
                    }
                    if (resizeHandle.includes('w')) {
                        const newX = sigX + deltaX;
                        setSigX(Math.max(0, newX));
                        setSigWidth(Math.max(20, sigWidth - deltaX));
                    }
                    if (resizeHandle.includes('s')) {
                        setSigHeight(Math.max(20, sigHeight + deltaY));
                    }
                    if (resizeHandle.includes('n')) {
                        const newY = sigY + deltaY;
                        setSigY(Math.max(0, newY));
                        setSigHeight(Math.max(20, sigHeight - deltaY));
                    }
                }
            }
        };
        
        const handleEnd = () => {
            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle(null);
        };
        
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchend', handleEnd);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, isResizing, resizeHandle, sigX, sigY, sigWidth, sigHeight, startPos, previewScale]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: async (files) => {
            const pdf = files.find(f => f.type === 'application/pdf');
            if (pdf) {
                setPdfFile(pdf);
                setResultUrl(null);
                setPageNum(1);
                try {
                    const ab = await pdf.arrayBuffer();
                    const doc = await pdfjsLib.getDocument({ data: ab }).promise;
                    setTotalPages(doc.numPages);
                } catch { /* ignore */ }
            }
        },
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    });

    // Render PDF preview whenever pdfFile or pageNum changes
    useEffect(() => {
        if (!pdfFile || !previewCanvasRef.current) return;
        (async () => {
            const ab = await pdfFile.arrayBuffer();
            const doc = await pdfjsLib.getDocument({ data: ab }).promise;
            const page = await doc.getPage(pageNum);
            const vp = page.getViewport({ scale: 1 });
            const maxW = 500;
            const scale = maxW / vp.width;
            setPreviewScale(scale);
            setPageWidth(vp.width);
            setPageHeight(vp.height);

            const viewport = page.getViewport({ scale });
            const canvas = previewCanvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        })();
    }, [pdfFile, pageNum]);

    const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        
        // Use device pixel ratio for better precision on retina displays
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        if ('touches' in e) {
            // Touch event
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            // Mouse event
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        ctx.moveTo(
            Math.round((clientX - rect.left) * scaleX),
            Math.round((clientY - rect.top) * scaleY)
        );
        setIsDrawing(true);
    }, []);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const rect = canvas.getBoundingClientRect();
        
        // Use device pixel ratio for better precision on retina displays
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX, clientY;
        if ('touches' in e) {
            // Touch event
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            // Mouse event
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111';
        ctx.lineTo(
            Math.round((clientX - rect.left) * scaleX),
            Math.round((clientY - rect.top) * scaleY)
        );
        ctx.stroke();
    }, [isDrawing]);

    const endDraw = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const clearDrawing = () => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const confirmDrawing = () => {
        const canvas = drawCanvasRef.current;
        if (!canvas) return;
        setSignatureDataUrl(canvas.toDataURL('image/png'));
        setShowDrawPad(false);
    };

    const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setSignatureDataUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleApply = async () => {
        if (!pdfFile || !signatureDataUrl) return;
        setIsProcessing(true);
        setResultUrl(null);
        try {
            const { PDFDocument } = await import('pdf-lib');
            const bytes = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(bytes);

            // Convert data URL to bytes
            const base64 = signatureDataUrl.split(',')[1];
            const sigBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

            const sigImage = await pdfDoc.embedPng(sigBytes);
            const pages = pdfDoc.getPages();
            const page = pages[pageNum - 1];
            if (!page) throw new Error('Page not found');

            // Convert screen coords (relative to preview) to PDF page coords
            const pdfX = sigX / previewScale;
            // PDF Y is bottom-up, preview Y is top-down
            const pdfY = pageHeight - (sigY / previewScale) - (sigHeight / previewScale);
            const pdfW = sigWidth / previewScale;
            const pdfH = sigHeight / previewScale;

            page.drawImage(sigImage, {
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH,
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            setResultUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error('Failed to sign PDF', error);
            alert('Failed to apply signature.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setPdfFile(null); setResultUrl(null); setSignatureDataUrl(null);
        setShowDrawPad(false); setPageNum(1); setTotalPages(0);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden border border-gray-100 max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <PenTool className="w-5 h-5 text-amber-500" /> Sign PDF
                            </h3>
                            <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Step 1: Upload PDF */}
                            {!pdfFile && (
                                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'}`}>
                                    <input {...getInputProps()} />
                                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">{isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF to sign, or click to select'}</p>
                                </div>
                            )}

                            {/* Step 2: Create signature */}
                            {pdfFile && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button onClick={() => setShowDrawPad(!showDrawPad)}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors">
                                            <PenTool className="w-4 h-4" /> Draw Signature
                                        </button>
                                        <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                                            <Image className="w-4 h-4" /> Upload Image
                                            <input type="file" accept="image/*" className="hidden" onChange={handleUploadSignature} />
                                        </label>
                                        {signatureDataUrl && (
                                            <button onClick={() => setSignatureDataUrl(null)}
                                                className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                                                <Trash2 className="w-4 h-4" /> Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* Drawing pad */}
                                    {showDrawPad && (
                                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                                            <p className="text-xs text-gray-500">Draw your signature below:</p>
                                                    <canvas
                                                ref={drawCanvasRef}
                                                width={460}
                                                height={150}
                                                className="w-full bg-white border border-gray-200 rounded-lg cursor-crosshair touch-none"
                                                onMouseDown={startDraw}
                                                onMouseMove={draw}
                                                onMouseUp={endDraw}
                                                onMouseLeave={endDraw}
                                                onTouchStart={(e) => {
                                                    e.preventDefault();
                                                    startDraw(e as any);
                                                }}
                                                onTouchMove={(e) => {
                                                    e.preventDefault();
                                                    draw(e as any);
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.preventDefault();
                                                    endDraw();
                                                }}
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={clearDrawing} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100">Clear</button>
                                                <button onClick={confirmDrawing} className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Use This Signature</button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Signature preview */}
                                    {signatureDataUrl && (
                                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                            <img src={signatureDataUrl} alt="Signature" className="h-12 object-contain" />
                                            <span className="text-sm text-amber-800 font-medium">Signature loaded</span>
                                        </div>
                                    )}

                                    {/* PDF page preview with position controls */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-gray-700">Page:</label>
                                            <select value={pageNum} onChange={e => setPageNum(Number(e.target.value))}
                                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500">
                                                {Array.from({ length: totalPages }, (_, i) => (
                                                    <option key={i + 1} value={i + 1}>Page {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="relative inline-block border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                                            <canvas ref={previewCanvasRef} className="block" />
                                            {signatureDataUrl && (
                                                <img
                                                    src={signatureDataUrl}
                                                    alt="Placed signature"
                                                    style={{
                                                        position: 'absolute',
                                                        left: sigX,
                                                        top: sigY,
                                                        width: sigWidth,
                                                        height: sigHeight,
                                                        opacity: 0.85,
                                                        border: '2px dashed #d97706',
                                                        cursor: isDragging ? 'grabbing' : 'grab',
                                                        touchAction: 'none',
                                                        userSelect: 'none',
                                                    }}
                                                    onMouseDown={(e) => {
                                                        if (!isDragging && !isResizing) {
                                                            setIsDragging(true);
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setStartPos({
                                                                x: e.clientX - rect.left,
                                                                y: e.clientY - rect.top
                                                            });
                                                        }
                                                    }}
                                                    onTouchStart={(e) => {
                                                        if (!isDragging && !isResizing) {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                            const touch = e.touches[0];
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setStartPos({
                                                                x: touch.clientX - rect.left,
                                                                y: touch.clientY - rect.top
                                                            });
                                                        }
                                                    }}
                                                />
                                            )}
                                            {signatureDataUrl && (
                                                <div
                                                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-500 border-2 border-white rounded-full cursor-se-resize pointer-events-auto"
                                                    style={{ zIndex: 10 }}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        setIsResizing(true);
                                                        setResizeHandle('se');
                                                    }}
                                                    onTouchStart={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setIsResizing(true);
                                                        setResizeHandle('se');
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {signatureDataUrl && (
                                            <div className="grid grid-cols-4 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">X Position</label>
                                                    <input type="number" value={sigX} onChange={e => setSigX(Number(e.target.value))} min={0}
                                                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Y Position</label>
                                                    <input type="number" value={sigY} onChange={e => setSigY(Number(e.target.value))} min={0}
                                                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Width</label>
                                                    <input type="number" value={sigWidth} onChange={e => setSigWidth(Number(e.target.value))} min={20}
                                                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Height</label>
                                                    <input type="number" value={sigHeight} onChange={e => setSigHeight(Number(e.target.value))} min={20}
                                                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {resultUrl && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <a href={resultUrl} download={`signed_${pdfFile?.name}`} className="flex items-center justify-center gap-2 w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium">
                                        <Download className="w-4 h-4" /> Download Signed PDF
                                    </a>
                                </motion.div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={handleClose} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleApply} disabled={!pdfFile || !signatureDataUrl || isProcessing}
                                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</> : 'Apply Signature'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

import { useState, useEffect } from 'react';
import { Loader2, LayoutGrid, X, Save, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortablePage } from './SortablePage';

// PDF.js import
import * as pdfjsLib from 'pdfjs-dist';

// Set worker using Vite's URL pattern for local node_modules file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

interface OrganizeResult {
    newFileName: string;  // Server's stored filename for the organized PDF
    displayName: string;  // Original display name
}

interface PageOrganizerModalProps {
    fileUrl: string | null;
    fileId: string;
    fileName: string;
    originalName: string;
    isOpen: boolean;
    onClose: () => void;
    onOrganizeComplete: (result: OrganizeResult) => void;
}

interface PageItem {
    id: string;
    originalIndex: number;
    image: string;
}

// Configure Axios base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function PageOrganizerModal({ fileName, originalName, isOpen, onClose, onOrganizeComplete }: PageOrganizerModalProps) {
    const [pages, setPages] = useState<PageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!isOpen || !fileName) return;

        const loadPages = async () => {
            setIsLoading(true);
            setError(null);
            setPages([]);

            // Determine correct directory based on filename prefix
            // Files starting with organized_, split_, compressed_, etc. are in /merged
            const isProcessedFile = fileName.startsWith('organized_') ||
                fileName.startsWith('split_') ||
                fileName.startsWith('compressed_') ||
                fileName.startsWith('protected_') ||
                fileName.startsWith('watermarked_') ||
                fileName.startsWith('images_');
            const directory = isProcessedFile ? 'merged' : 'uploads';
            const fileUrl = `${API_URL}/${directory}/${fileName}`;
            console.log(`[PageOrganizer] Loading PDF from: ${fileUrl}`);
            console.log(`[PageOrganizer] PDF.js Version: ${pdfjsLib.version}`);

            try {
                const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                console.log(`[PageOrganizer] File fetched. Size: ${response.data.byteLength} bytes`);

                const pdf = await pdfjsLib.getDocument({ data: response.data }).promise;
                console.log(`[PageOrganizer] PDF Loaded. Pages: ${pdf.numPages}`);

                const loadedPages: PageItem[] = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    if (context) {
                        await page.render({
                            canvasContext: context,
                            viewport: viewport,
                            canvas: canvas
                        } as any).promise;

                        loadedPages.push({
                            id: `page-${i - 1}`,
                            originalIndex: i - 1,
                            image: canvas.toDataURL('image/jpeg', 0.8)
                        });
                    }
                }
                setPages(loadedPages);
            } catch (err: any) {
                console.error("[PageOrganizer] Error loading PDF pages", err);
                let msg = "Could not load PDF pages.";
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    msg = "File not found on server (404).";
                } else if (err?.message) {
                    msg += ` ${err.message}`;
                }
                setError(msg);
            } finally {
                setIsLoading(false);
            }
        };

        loadPages();
    }, [isOpen, fileName]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleRemovePage = (id: string) => {
        setPages(prev => prev.filter(p => p.id !== id));
    };

    const handleSave = async () => {
        if (!fileName) return;
        setIsSaving(true);
        try {
            const pageIndices = pages.map(p => p.originalIndex);
            const response = await axios.post(`${API_URL}/organize`, {
                filename: fileName,
                page_indices: pageIndices
            });
            // Extract the new filename from the URL (e.g., "/download/organized_xxx.pdf" -> "organized_xxx.pdf")
            const newFileName = response.data.url.split('/').pop() || response.data.url;
            onOrganizeComplete({
                newFileName: newFileName,
                displayName: originalName.replace('.pdf', '') + ' (organized).pdf'
            });
            onClose();
        } catch (err) {
            console.error("Failed to save organized PDF", err);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!fileName) return;
        setIsDownloading(true);
        try {
            const pageIndices = pages.map(p => p.originalIndex);
            const response = await axios.post(`${API_URL}/organize`, {
                filename: fileName,
                page_indices: pageIndices
            });
            // Open the download URL in a new tab
            window.open(`${API_URL}${response.data.url}`, '_blank');
            onClose();
        } catch (err) {
            console.error("Failed to download organized PDF", err);
            alert("Failed to download.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-100"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-primary-500" />
                                Organize Pages
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                    <p>Rendering pages...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center h-full text-red-500 gap-3">
                                    <p className="font-medium text-lg">{error}</p>
                                    <p className="text-sm text-gray-400">Check browser console for details.</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={pages}
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {pages.map((page) => (
                                                <SortablePage
                                                    key={page.id}
                                                    id={page.id}
                                                    image={page.image}
                                                    pageNumber={page.originalIndex + 1}
                                                    onRemove={handleRemovePage}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={isLoading || isDownloading || isSaving || pages.length === 0}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Downloading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" /> Download
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading || isSaving || isDownloading || pages.length === 0}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" /> Save for Merge
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

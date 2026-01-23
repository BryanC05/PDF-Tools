import { useState } from 'react';
import { Loader2, Scissors, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface SplitterModalProps {
    filename: string;
    originalName: string;
    isOpen: boolean;
    onClose: () => void;
    onSplitComplete: (url: string) => void;
}

export function SplitterModal({ filename, originalName, isOpen, onClose, onSplitComplete }: SplitterModalProps) {
    const [pageRanges, setPageRanges] = useState('');
    const [isSplitting, setIsSplitting] = useState(false);

    const handleSplit = async () => {
        setIsSplitting(true);
        try {
            const response = await axios.post('http://localhost:8000/split', {
                filename: filename,
                page_ranges: pageRanges
            });
            onSplitComplete(`http://localhost:8000${response.data.url}`);
            onClose();
        } catch (error) {
            console.error("Split failed", error);
            alert("Split failed. Check page ranges format.");
        } finally {
            setIsSplitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Scissors className="w-5 h-5 text-primary-500" />
                                Split PDF
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Target File
                                </label>
                                <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 font-mono truncate">
                                    {originalName}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Page Ranges
                                </label>
                                <input
                                    type="text"
                                    value={pageRanges}
                                    onChange={(e) => setPageRanges(e.target.value)}
                                    placeholder="e.g. 1, 3-5, 8"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Enter page numbers (1-based) to extract. Use comma to separate and hyphen for ranges.
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleSplit}
                                    disabled={!pageRanges || isSplitting}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSplitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Splitting...
                                        </>
                                    ) : (
                                        "Extract Pages"
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

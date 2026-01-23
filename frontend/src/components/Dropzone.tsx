import { useCallback, useRef, useState } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { cn } from '../lib/utils';


interface DropzoneProps {
    onFilesDropped: (files: File[]) => void;
}

export function Dropzone({ onFilesDropped }: DropzoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);

        if (e.dataTransfer.files?.length) {
            const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
            onFilesDropped(files);
        }
    }, [onFilesDropped]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
            onFilesDropped(files);
            // Reset input
            e.target.value = '';
        }
    }, [onFilesDropped]);

    return (
        <div
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "relative group cursor-pointer w-full rounded-3xl border-2 border-dashed transition-all duration-300 ease-out overflow-hidden bg-white/50 backdrop-blur-sm",
                isDragActive
                    ? "border-primary-500 bg-primary-50/50 scale-[1.01] shadow-xl"
                    : "border-gray-200 hover:border-primary-400 hover:bg-gray-50 shadow-sm hover:shadow-md"
            )}
        >
            <input
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                ref={inputRef}
                onChange={handleChange}
            />

            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
                <div className={cn(
                    "p-4 rounded-full bg-gray-100 text-gray-400 transition-all duration-300 group-hover:bg-primary-100 group-hover:text-primary-600",
                    isDragActive && "bg-primary-100 text-primary-600 scale-110"
                )}>
                    {isDragActive ? <FileUp className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-gray-700 group-hover:text-primary-700 transition-colors">
                        {isDragActive ? "Drop PDFs here" : "Upload your PDFs"}
                    </h3>
                    <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto group-hover:text-gray-600">
                        Drag and drop your PDF files here, or click to browse.
                    </p>
                </div>
            </div>
        </div>
    );
}

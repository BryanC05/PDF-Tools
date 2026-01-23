import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';

interface SortablePageProps {
    id: string; // This is basically the original page index as string
    image: string;
    pageNumber: number; // Original page number (1-based)
    onRemove: (id: string) => void;
}

export function SortablePage({ id, image, pageNumber, onRemove }: SortablePageProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative group bg-white rounded-lg shadow-sm border overflow-hidden cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'ring-2 ring-primary-500 shadow-xl scale-105 opacity-90' : 'border-gray-200 hover:border-primary-200'
                }`}
        >
            <div className="aspect-[3/4] bg-gray-100 relative">
                <img
                    src={image}
                    alt={`Page ${pageNumber}`}
                    className="w-full h-full object-contain pointer-events-none"
                />
            </div>

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start
                        onRemove(id);
                    }}
                    className="p-1 bg-white/90 text-red-500 rounded-md shadow-sm hover:bg-red-50"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded-md backdrop-blur-sm pointer-events-none">
                Page {pageNumber}
            </div>
        </div>
    );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, X, Scissors, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

interface SortableFileProps {
    id: string;
    name: string;
    onRemove: (id: string) => void;
    onSplit: (id: string) => void;
    onOrganize: (id: string) => void;
}

export function SortableFile({ id, name, onRemove, onSplit, onOrganize }: SortableFileProps) {
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
            className={cn(
                "relative flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm group hover:border-primary-200 transition-all select-none touch-none",
                isDragging && "shadow-xl ring-2 ring-primary-500 ring-offset-2 opacity-90 scale-105"
            )}
        >
            <div
                {...attributes}
                {...listeners}
                className="p-1 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <FileText className="w-5 h-5" />
            </div>

            <span className="flex-1 truncate font-medium text-gray-700 text-sm">{name}</span>

            <button
                onClick={() => onOrganize(id)}
                title="Organize Pages (Reorder/Delete)"
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>

            <button
                onClick={() => onSplit(id)}
                title="Split / Extract Pages"
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
                <Scissors className="w-4 h-4" />
            </button>

            <button
                onClick={() => onRemove(id)}
                title="Remove"
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

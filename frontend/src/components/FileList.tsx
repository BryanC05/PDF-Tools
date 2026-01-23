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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableFile } from './SortableFile';

interface FileItem {
    id: string;
    name: string;
    file?: File; // Optional if we just display uploaded files
}

interface FileListProps {
    files: FileItem[];
    onReorder: (files: FileItem[]) => void;
    onRemove: (id: string) => void;
    onSplit: (id: string) => void;
    onOrganize: (id: string) => void;
}

export function FileList({ files, onReorder, onRemove, onSplit, onOrganize }: FileListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = files.findIndex((f) => f.id === active.id);
            const newIndex = files.findIndex((f) => f.id === over.id);
            onReorder(arrayMove(files, oldIndex, newIndex));
        }
    }

    if (files.length === 0) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={files}
                strategy={verticalListSortingStrategy}
            >
                <div className="grid grid-cols-1 gap-3 w-full max-w-2xl mx-auto">
                    {files.map((file) => (
                        <SortableFile
                            key={file.id}
                            id={file.id}
                            name={file.name}
                            onRemove={onRemove}
                            onSplit={onSplit}
                            onOrganize={onOrganize}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

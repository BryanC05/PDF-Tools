export interface FileListProps {
  files: any[];
  onReorder: (newFiles: any[]) => void;
  onRemove: (id: string) => void;
  onSplit: (id: string) => void;
  onOrganize: (id: string) => void;
}

export function FileList(_props: FileListProps) {
  return null;
}
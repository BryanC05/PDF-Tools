export interface EditPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: File;
  onSplitComplete?: (url: string) => void;
  onOrganizeComplete?: (file: File) => void;
}

export function EditPdfModal(_props: EditPdfModalProps) {
  return null;
}

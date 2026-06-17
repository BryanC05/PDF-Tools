export interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: File;
  onSplitComplete?: (url: string) => void;
  onOrganizeComplete?: (file: File) => void;
}

export function CropModal(_props: CropModalProps) {
  return null;
}

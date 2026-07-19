import { PDFDocument, StandardFonts, rgb, RotationTypes } from 'pdf-lib';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Merge multiple PDF files into a single PDF
 */
export async function mergePdfs(files: File[]): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  const mergedBytes = await mergedPdf.save();
  return new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' });
}

/**
 * Split PDF by page ranges (e.g., "1, 3-5, 8")
 */
export async function splitPdf(file: File, pageRanges: string): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  const ranges = pageRanges.split(',').map(r => r.trim());
  const pagesToExtract: number[] = [];
  
  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) {
          pagesToExtract.push(i - 1); // Convert to 0-based index
        }
      }
    } else {
      const pageNum = parseInt(range, 10);
      if (pageNum >= 1 && pageNum <= totalPages) {
        pagesToExtract.push(pageNum - 1);
      }
    }
  }
  
  const resultBlobs: Blob[] = [];
  for (const pageIndex of pagesToExtract) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [pageIndex]);
    newPdf.addPage(copiedPage);
    const bytes = await newPdf.save();
    resultBlobs.push(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
  }
  
  return resultBlobs;
}

/**
 * Rotate PDF pages by specified angle
 */
export async function rotatePdf(file: File, angle: number, pages?: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const allPages = pdf.getPages();
  
  let pagesToRotate: number[] = [];
  if (pages) {
    const rangeStrs = pages.split(',').map(r => r.trim());
    for (const range of rangeStrs) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
        for (let i = start; i <= end; i++) {
          pagesToRotate.push(i - 1);
        }
      } else {
        pagesToRotate.push(parseInt(range, 10) - 1);
      }
    }
  } else {
    pagesToRotate = allPages.map((_, i) => i);
  }
  
  pagesToRotate.forEach((pageIndex) => {
    if (pageIndex >= 0 && pageIndex < allPages.length) {
      const currentPage = allPages[pageIndex];
      const currentRotation = currentPage.getRotation().angle;
      currentPage.setRotation({ type: RotationTypes.Degrees, angle: currentRotation + angle });
    }
  });
  
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/**
 * Add text watermark to PDF
 */
export async function addWatermark(
  file: File,
  text: string,
  options: {
    opacity?: number;
    fontSize?: number;
    rotation?: number;
    color?: { r: number; g: number; b: number };
    position?: 'center' | 'tile';
  } = {}
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  
  const {
    opacity = 0.3,
    fontSize = 48,
    rotation = 45,
    color = { r: 0, g: 0, b: 0 },
    position = 'center',
  } = options;
  
  const pages = pdf.getPages();
  
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    
    if (position === 'center') {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);
      const x = (width - textWidth) / 2;
      const y = (height - textHeight) / 2;
      
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        opacity,
        rotate: { type: RotationTypes.Degrees, angle: rotation },
        color: rgb(color.r, color.g, color.b),
      });
    } else if (position === 'tile') {
      // Tile watermark across page
      const spacing = 200;
      for (let x = -width; x < width * 2; x += spacing) {
        for (let y = -height; y < height * 2; y += spacing) {
          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            opacity: opacity * 0.5,
            rotate: { type: RotationTypes.Degrees, angle: rotation },
            color: rgb(color.r, color.g, color.b),
          });
        }
      }
    }
  });
  
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/**
 * Remove specified pages from PDF
 */
export async function removePages(file: File, pagesToRemove: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  const rangeStrs = pagesToRemove.split(',').map(r => r.trim());
  const pagesToRemoveSet = new Set<number>();
  
  for (const range of rangeStrs) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) {
          pagesToRemoveSet.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(range, 10);
      if (pageNum >= 1 && pageNum <= totalPages) {
        pagesToRemoveSet.add(pageNum - 1);
      }
    }
  }
  
  const pagesToKeep: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (!pagesToRemoveSet.has(i)) {
      pagesToKeep.push(i);
    }
  }
  
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, pagesToKeep);
  copiedPages.forEach((page) => newPdf.addPage(page));
  
  const bytes = await newPdf.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/**
 * Extract specified pages from PDF
 */
export async function extractPages(file: File, pages: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const totalPages = pdf.getPageCount();
  
  const rangeStrs = pages.split(',').map(r => r.trim());
  const pagesToExtract: number[] = [];
  
  for (const range of rangeStrs) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(n => parseInt(n.trim(), 10));
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= totalPages) {
          pagesToExtract.push(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(range, 10);
      if (pageNum >= 1 && pageNum <= totalPages) {
        pagesToExtract.push(pageNum - 1);
      }
    }
  }
  
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
  copiedPages.forEach((page) => newPdf.addPage(page));
  
  const bytes = await newPdf.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/**
 * Add page numbers to PDF
 */
export async function addPageNumbers(
  file: File,
  options: {
    position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
    fontSize?: number;
    startNumber?: number;
    format?: '{n}' | 'Page {n}' | '{n} of {total}';
    margin?: number;
  } = {}
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  const {
    position = 'bottom-center',
    fontSize = 12,
    startNumber = 1,
    format = '{n}',
    margin = 30,
  } = options;
  
  const pages = pdf.getPages();
  const totalPages = pages.length;
  
  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    const pageNum = startNumber + idx;
    const totalStr = format.replace('{n}', String(pageNum)).replace('{total}', String(totalPages));
    const textWidth = font.widthOfTextAtSize(totalStr, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    
    let x = margin;
    let y = margin;
    
    if (position.includes('bottom')) {
      y = height - margin - textHeight;
    } else {
      y = height - margin - textHeight * 2;
    }
    
    if (position.includes('center')) {
      x = (width - textWidth) / 2;
    } else if (position.includes('right')) {
      x = width - textWidth - margin;
    }
    
    page.drawText(totalStr, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  });
  
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/**
 * Convert images to PDF
 */
export async function imagesToPdf(files: File[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    let image;
    
    if (file.type === 'image/jpeg') {
      image = await pdfDoc.embedJpg(arrayBuffer);
    } else if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(arrayBuffer);
    } else {
      continue;
    }
    
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }
  
  const bytes = await pdfDoc.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/**
 * Crop PDF by margins
 */
export async function cropPdf(
  file: File,
  margins: { top: number; bottom: number; left: number; right: number }
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  
  pages.forEach((page) => {
    const { width, height } = page.getSize();
    page.setCropBox(
      margins.left,
      margins.bottom,
      width - margins.left - margins.right,
      height - margins.top - margins.bottom
    );
  });
  
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/**
 * Protect PDF with password - placeholder (pdf-lib browser doesn't support encryption)
 */
export async function protectPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  
  // Note: pdf-lib doesn't support password protection in the browser-only version
  // This is a placeholder - actual encryption would need a backend
  const bytes = await pdf.save();
  
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename);
}

/**
 * Download multiple files as a ZIP
 */
export async function downloadAsZip(blobs: { blob: Blob; name: string }[], zipName: string): Promise<void> {
  const zip = new JSZip();
  
  blobs.forEach(({ blob, name }) => {
    zip.file(name, blob);
  });
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, zipName);
}

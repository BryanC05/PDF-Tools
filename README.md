# PDF-Tools - Simple PDF Manipulation Suite

A comprehensive client-side PDF manipulation suite with merge, split, OCR, conversion, and editing capabilities.

## Overview

PDF-Tools provides a complete offline PDF toolkit with features like:
- Merge, split, and organize PDF files
- OCR PDF and image processing
- Format conversion (JPG to PDF, PDF to JPG, PDF to PDF/A)
- PDF editing (rotate, crop, add watermarks, fill forms)
- Image to PDF and PDF to image conversion
- PDF protection and encryption

All processing happens client-side in the browser. Your files never leave your device.

## Technologies

Built with React + TypeScript + Vite for optimal performance and type safety.

## Key Features

### Organize PDF
- Merge multiple PDFs
- Split PDF pages
- Remove PDF pages
- Extract PDF pages
- Organize PDF page order
- Scan images to PDF

### Optimize PDF
- Compress PDF files
- Repair corrupted PDFs
- OCR (Optical Character Recognition)
- Convert to grayscale

### Convert to PDF
- JPG to PDF conversion

### Convert from PDF
- PDF to JPG conversion
- PDF to PDF/A conversion

### Edit PDF
- Rotate PDF pages
- Add page numbers
- Add watermarks
- Crop PDF pages
- Edit PDF content
- Sign PDF documents
- Edit PDF metadata
- Fill PDF forms

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Development

This project uses a grid-based layout for the tool categories:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns
- Large Desktop: 3 columns

The layout ensures better distribution of categories, especially those with fewer features, reducing visual gaps and improving the user experience.

## Signature Drawing Improvements

The signature drawing feature has been enhanced with:
- Device pixel ratio scaling for retina displays
- Unified mouse and touch event handling
- Precise coordinate calculation and rounding
- Touch action prevention for better mobile experience
- Free movement and resizing capabilities

## License

This project is built as a demonstration of modern web development practices using React, TypeScript, and Vite.

> **Note:** This project focuses on demonstrating advanced web development techniques including responsive design, type safety, and client-side processing of PDF files.

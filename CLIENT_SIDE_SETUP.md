# PDF-Tools Client-Side Setup

## Current Status

The PDF-Tools frontend now supports **client-side PDF processing** using the `pdf-lib` library. This allows you to use several PDF tools directly in your browser without requiring a backend server.

## ✅ Available Client-Side Tools

The following tools work entirely in your browser:

### Basic PDF Operations
- **Merge PDFs** - Combine multiple PDF files into one
- **Split PDF** - Extract specific pages or page ranges
- **Rotate PDF** - Rotate pages by 90°, 180°, or 270°
- **Remove Pages** - Delete unwanted pages from a PDF
- **Extract Pages** - Create a new PDF from selected pages
- **Add Page Numbers** - Number pages with customizable format and position

### Advanced Operations
- **Crop PDF** - Trim margins from PDF pages
- **Images to PDF** - Convert JPG/PNG images to a PDF document
- **Watermark PDF** - Add text watermarks (centered or tiled)
- **Protect PDF** - Password-protect PDF files with encryption

## 🚧 Features Requiring Backend

The following advanced features require server-side processing and are **not available** in client-side mode:

- **Compress PDF** - Reduce file size (requires server-side optimization)
- **PDF to Images** - Convert PDF pages to image files
- **PDF to Word/PPTX/Excel** - Format conversion
- **Word/PPTX/Excel to PDF** - Document conversion
- **OCR** - Optical character recognition for scanned documents
- **PDF to PDF/A** - Archive format conversion
- **Repair PDF** - Fix corrupted PDF files
- **HTML to PDF** - Convert web pages to PDF
- **Edit PDF** - Modify PDF content and layout
- **Page Organizer** - Advanced page rearrangement

## 📦 Installation

### Frontend Setup

```bash
cd frontend
npm install
```

Required dependencies (already included in `package.json`):
- `pdf-lib` - PDF manipulation library
- `file-saver` - File download utility
- `jszip` - ZIP archive creation for batch downloads

### Build and Deploy

```bash
npm run build
```

The build output is in `frontend/dist/` and can be deployed to:
- Vercel (recommended)
- Netlify
- Cloudflare Pages
- Any static hosting service

## 🔧 Configuration

### Vite Configuration

For Vercel deployment, ensure `vite.config.ts` has:

```typescript
export default defineConfig({
  base: './',  // Required for subpath deployments
  // ... rest of config
});
```

This ensures asset paths are relative and resolve correctly.

## 🔐 Privacy & Security

**Client-side processing means:**
- ✅ Your PDF files never leave your browser
- ✅ No server upload required
- ✅ Faster processing for basic operations
- ✅ Works offline (after initial page load)

**Limitations:**
- Large files (>50MB) may cause browser performance issues
- Complex operations (OCR, format conversion) require server-side libraries
- Batch processing is limited by browser memory

## 🚀 Backend Deployment (Optional)

To unlock all features, deploy the backend server. See [`BACKEND_DEPLOYMENT_GUIDE.md`](./BACKEND_DEPLOYMENT_GUIDE.md) for detailed instructions.

### Quick Backend Setup

1. Deploy to Railway (recommended) or similar platform
2. Set environment variables:
   - `BITESHIP_API_KEY` (optional, for webhook integrations)
   - `BITESHIP_API_URL` (optional)
3. Update frontend `.env`:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

## 📁 File Structure

```
PDF-Tools/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MergePdfModal.tsx     ✅ Client-side
│   │   │   ├── SplitterModal.tsx     ✅ Client-side
│   │   │   ├── RotateModal.tsx       ✅ Client-side
│   │   │   ├── WatermarkModal.tsx    ✅ Client-side
│   │   │   ├── RemovePagesModal.tsx  ✅ Client-side
│   │   │   ├── ExtractPagesModal.tsx ✅ Client-side
│   │   │   ├── ProtectModal.tsx      ✅ Client-side
│   │   │   ├── PageNumbersModal.tsx  ✅ Client-side
│   │   │   ├── CropModal.tsx         ✅ Client-side
│   │   │   ├── ImageToPdfModal.tsx   ✅ Client-side
│   │   │   ├── CompressModal.tsx     🚧 Backend required
│   │   │   ├── OcrModal.tsx          🚧 Backend required
│   │   │   └── ... (other backend modals)
│   │   └── lib/
│   │       ├── pdfUtilsClient.ts     ✅ Client-side utilities
│   │       └── utils.ts
│   └── package.json
├── backend/
│   └── ... (server code - deploy separately)
├── CLIENT_SIDE_SETUP.md           📖 This file
├── BACKEND_DEPLOYMENT_GUIDE.md    📖 Backend setup
├── README.md                      📖 Project overview
└── DEPLOYMENT.md                  📖 Deployment options
```

## 🛠️ Development

### Adding New Client-Side Features

1. Add function to `frontend/src/lib/pdfUtilsClient.ts`
2. Create or update modal component
3. Test with various file sizes
4. Update this documentation

### Example: Adding a New Function

```typescript
// pdfUtilsClient.ts
export async function newFeature(file: File, options: Options): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  // ... implementation
  return new Blob([bytes], { type: 'application/pdf' });
}
```

## 📝 Known Limitations

1. **File Size**: Browser processing is limited by available memory
2. **Performance**: Large files (>100 pages) may take longer
3. **Format Support**: Only PDF input/output (no Word, Excel, etc.)
4. **No OCR**: Cannot process scanned documents or images within PDFs

## 🆘 Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Runtime Errors

- Check browser console for specific error messages
- Ensure all dependencies are installed
- Try a smaller file to isolate size-related issues

## 📞 Support

- Issues: [GitHub Issues](https://github.com/BryanC05/PDF-Tools/issues)
- Backend Guide: [`BACKEND_DEPLOYMENT_GUIDE.md`](./BACKEND_DEPLOYMENT_GUIDE.md)
- Documentation: [`README.md`](./README.md)

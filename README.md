# Simple PDF 📄✂️

A powerful, open-source web application for manipulating PDF files. Merge, split, organize, compress, and more - all in your browser with a privacy-focused backend.

![Simple PDF Screenshot](frontend/src/assets/react.svg) <!-- Replace with actual screenshot later -->

## Features 🚀

- **Merge PDFs**: Combine multiple PDF files into one.
- **Split PDF**: Extract specific pages or ranges from a PDF.
- **Organize Pages**: Reorder, rotate, or delete pages using a drag-and-drop interface.
- **Images to PDF**: Convert JPG/PNG images into a single PDF document.
- **PDF to Images**: Convert PDF pages into high-quality images (ZIP download).
- **Compress PDF**: Reduce file size while maintaining quality.
- **Protect PDF**: Encrypt your PDF with a password.
- **Watermark**: Add customizable text watermarks to every page.

## Tech Stack 🛠️

### Frontend
- **React** (Vite)
- **TypeScript**
- **Tailwind CSS** (Styling)
- **Framer Motion** (Animations)
- **dnd-kit** (Drag and drop interactions)

### Backend
- **Python** (FastAPI)
- **pypdf** (PDF manipulation)
- **img2pdf** & **Pillow** (Image processing)
- **ReportLab** (Watermarking)

## Getting Started 🏁

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BryanC05/PDF-Tools.git
   cd PDF-Tools
   ```

2. **Backend Setup**
   The backend requires LibreOffice, Tesseract OCR, and Poppler to be installed on your system for all features to work (or use the provided Dockerfile).
   ```bash
   cd backend
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Mac/Linux
   # source venv/bin/activate
   
   pip install -r requirements.txt
   python main.py # Runs on http://localhost:8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will run at `http://localhost:5173`.

## Deployment 🌍

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to Vercel (Frontend) and Railway (Backend).

## Contributing 🤝
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License 📄
[MIT](https://choosealicense.com/licenses/mit/)

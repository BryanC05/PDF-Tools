from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pypdf import PdfWriter
import os
import uuid
import io
from typing import List, Dict, Set
import shutil
import time
from contextlib import asynccontextmanager

# Session tracking: session_id -> set of file paths
session_files: Dict[str, Set[str]] = {}

# Cleanup old files on startup (older than 1 hour)
def cleanup_old_files():
    """Delete files in uploads and merged directories that are older than 1 hour."""
    now = time.time()
    cutoff = now - 3600  # 1 hour ago
    
    for directory in [UPLOAD_DIR, MERGED_DIR]:
        if os.path.exists(directory):
            for filename in os.listdir(directory):
                file_path = os.path.join(directory, filename)
                try:
                    if os.path.isfile(file_path):
                        creation_time = os.path.getctime(file_path)
                        if creation_time < cutoff:
                            os.unlink(file_path)
                            print(f"Deleted old file: {filename}")
                except Exception as e:
                    print(f"Error deleting {file_path}: {e}")

UPLOAD_DIR = "uploads"
MERGED_DIR = "merged"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MERGED_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: clean old files
    cleanup_old_files()
    print("✓ Cleaned up old files (>1h) on startup")
    yield
    # Shutdown: do nothing (preserve files for dev)
    print("Request finished")

app = FastAPI(lifespan=lifespan)

# CORS configuration - use environment variable for production
import os
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads so frontend can fetch PDFs for previews
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

from pydantic import BaseModel

# Session cleanup endpoint
class CleanupRequest(BaseModel):
    session_id: str
    files: List[str]

@app.post("/cleanup")
async def cleanup_session(request: CleanupRequest):
    """Delete files associated with a session when user leaves."""
    deleted = 0
    for filename in request.files:
        # Try to delete from both directories
        for directory in [UPLOAD_DIR, MERGED_DIR]:
            file_path = os.path.join(directory, filename)
            if os.path.exists(file_path):
                try:
                    os.unlink(file_path)
                    deleted += 1
                except Exception as e:
                    print(f"Error deleting {file_path}: {e}")
    
    # Clean up session tracking
    if request.session_id in session_files:
        del session_files[request.session_id]
    
    return {"deleted": deleted, "session_id": request.session_id}

@app.post("/upload")
def upload_file(file: UploadFile = File(...), session_id: str = Form(None)):
    file_id = str(uuid.uuid4())
    stored_name = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Track file for session cleanup
    if session_id:
        if session_id not in session_files:
            session_files[session_id] = set()
        session_files[session_id].add(stored_name)
        
    return {"id": file_id, "filename": file.filename, "original_name": stored_name}


from pydantic import BaseModel

class MergeRequest(BaseModel):
    files: List[str] # List of original_names

@app.post("/merge")
def merge_pdfs(request: MergeRequest):
    pdf_writer = PdfWriter()
    
    for filename in request.files:
        file_path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
        
        pdf_writer.append(file_path)
    
    merged_filename = f"merged_{uuid.uuid4()}.pdf"
    merged_path = os.path.join(MERGED_DIR, merged_filename)
    
    with open(merged_path, "wb") as output_pdf:
        pdf_writer.write(output_pdf)
        
    return {"url": f"/download/{merged_filename}"}

class SplitRequest(BaseModel):
    filename: str
    page_ranges: str # e.g., "1,3-5,7" (1-based)

def parse_page_ranges(range_str: str, max_pages: int) -> List[int]:
    pages = set()
    parts = range_str.split(',')
    for part in parts:
        part = part.strip()
        if '-' in part:
            start, end = map(int, part.split('-'))
            for i in range(start, end + 1):
                pages.add(i - 1) # 0-based
        else:
            pages.add(int(part) - 1)
    return sorted(list(pages))

@app.post("/split")
def split_pdf(request: SplitRequest):
    file_path = os.path.join(UPLOAD_DIR, request.filename)
    if not os.path.exists(file_path):
        # Also check merged dir just in case user wants to split a result
        file_path = os.path.join(MERGED_DIR, request.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
            
    reader = PdfWriter() # Can act as reader too loosely, but better use PdfReader
    from pypdf import PdfReader
    
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()
        total_pages = len(reader.pages)
        
        try:
            selected_pages = parse_page_ranges(request.page_ranges, total_pages)
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid page ranges format")

        for p_idx in selected_pages:
            if 0 <= p_idx < total_pages:
                writer.add_page(reader.pages[p_idx])
        
        output_filename = f"split_{uuid.uuid4()}.pdf"
        output_path = os.path.join(MERGED_DIR, output_filename)
        
        with open(output_path, "wb") as out_f:
            writer.write(out_f)
            
        return {"url": f"/download/{output_filename}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class OrganizeRequest(BaseModel):
    filename: str
    page_indices: List[int] # Exact 0-based indices in desired order

@app.post("/organize")
def organize_pdf(request: OrganizeRequest):
    file_path = os.path.join(UPLOAD_DIR, request.filename)
    if not os.path.exists(file_path):
        file_path = os.path.join(MERGED_DIR, request.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
            
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()
        total_pages = len(reader.pages)
        
        for p_idx in request.page_indices:
            if 0 <= p_idx < total_pages:
                writer.add_page(reader.pages[p_idx])
            else:
                print(f"Warning: Page index {p_idx} out of range (total {total_pages})")

        output_filename = f"organized_{uuid.uuid4()}.pdf"
        output_path = os.path.join(MERGED_DIR, output_filename)
        
        with open(output_path, "wb") as out_f:
            writer.write(out_f)
            
        return {"url": f"/download/{output_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(MERGED_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

# ============== CONVERSION FEATURES ==============

@app.post("/images-to-pdf")
def images_to_pdf(files: List[UploadFile] = File(...)):
    """Convert multiple images to a single PDF."""
    import img2pdf
    from PIL import Image
    import io
    
    if not files:
        raise HTTPException(status_code=400, detail="No images provided")
    
    try:
        image_bytes_list = []
        for f in files:
            content = f.file.read()
            # Validate it's an image
            try:
                img = Image.open(io.BytesIO(content))
                # Convert RGBA to RGB if needed (img2pdf doesn't support RGBA)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                    buf = io.BytesIO()
                    img.save(buf, format='JPEG', quality=95)
                    content = buf.getvalue()
                image_bytes_list.append(content)
            except Exception:
                raise HTTPException(status_code=400, detail=f"Invalid image file: {f.filename}")
        
        # Convert to PDF
        pdf_bytes = img2pdf.convert(image_bytes_list)
        
        output_filename = f"images_{uuid.uuid4()}.pdf"
        output_path = os.path.join(MERGED_DIR, output_filename)
        
        with open(output_path, "wb") as out_f:
            out_f.write(pdf_bytes)
        
        return {"url": f"/download/{output_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf-to-images")
def pdf_to_images(file: UploadFile = File(...)):
    """Convert a PDF to images (returns zip of PNGs)."""
    import zipfile
    from pypdf import PdfReader
    # Note: pypdf alone cannot render images. We need pdf2image which requires poppler.
    # For simplicity, we'll use a try/except and inform user if not available.
    try:
        from pdf2image import convert_from_bytes
    except ImportError:
        raise HTTPException(status_code=501, detail="pdf2image not installed. Run: pip install pdf2image (requires poppler)")
    
    try:
        content = file.file.read()
        images = convert_from_bytes(content, dpi=150)
        
        zip_filename = f"pdf_images_{uuid.uuid4()}.zip"
        zip_path = os.path.join(MERGED_DIR, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w') as zf:
            for i, img in enumerate(images):
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='PNG')
                img_bytes.seek(0)
                zf.writestr(f"page_{i+1}.png", img_bytes.read())
        
        return {"url": f"/download/{zip_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== OPTIMIZATION & SECURITY ==============

@app.post("/compress")
def compress_pdf(file: UploadFile = File(...)):
    """Compress a PDF to reduce file size."""
    from pypdf import PdfReader, PdfWriter
    
    try:
        content = file.file.read()
        reader = PdfReader(io.BytesIO(content))
        writer = PdfWriter()
        
        for page in reader.pages:
            page.compress_content_streams()
            writer.add_page(page)
        
        # Remove metadata to save space
        writer.add_metadata({})
        
        output_filename = f"compressed_{uuid.uuid4()}.pdf"
        output_path = os.path.join(MERGED_DIR, output_filename)
        
        with open(output_path, "wb") as out_f:
            writer.write(out_f)
        
        original_size = len(content)
        compressed_size = os.path.getsize(output_path)
        
        return {
            "url": f"/download/{output_filename}",
            "original_size": original_size,
            "compressed_size": compressed_size,
            "reduction_percent": round((1 - compressed_size / original_size) * 100, 1)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ProtectRequest(BaseModel):
    password: str

@app.post("/protect")
def protect_pdf(file: UploadFile = File(...), password: str = Form(...)):
    """Add password protection to a PDF."""
    from pypdf import PdfReader, PdfWriter
    
    try:
        content = file.file.read()
        reader = PdfReader(io.BytesIO(content))
        writer = PdfWriter()
        
        for page in reader.pages:
            writer.add_page(page)
        
        # Encrypt with password
        writer.encrypt(password)
        
        output_filename = f"protected_{uuid.uuid4()}.pdf"
        output_path = os.path.join(MERGED_DIR, output_filename)
        
        with open(output_path, "wb") as out_f:
            writer.write(out_f)
        
        return {"url": f"/download/{output_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/watermark")
def watermark_pdf(
    file: UploadFile = File(...), 
    text: str = Form("CONFIDENTIAL"),
    opacity: float = Form(0.3),
    font_size: int = Form(60),
    rotation: int = Form(45),
    position: str = Form("center"),  # center, top-left, top-right, bottom-left, bottom-right, tiled
    color: str = Form("#808080"),  # Hex color
    repeat_x: int = Form(1),  # For tiled mode
    repeat_y: int = Form(1)   # For tiled mode
):
    """Add a customizable text watermark to each page of a PDF."""
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.colors import HexColor
    
    try:
        content = file.file.read()
        reader = PdfReader(io.BytesIO(content))
        writer = PdfWriter()
        
        # Parse hex color
        try:
            fill_color = HexColor(color)
            fill_color.alpha = opacity
        except:
            fill_color = HexColor("#808080")
            fill_color.alpha = opacity
        
        # Get page dimensions from first page
        first_page = reader.pages[0]
        page_width = float(first_page.mediabox.width)
        page_height = float(first_page.mediabox.height)
        
        # Create watermark PDF in memory
        watermark_buffer = io.BytesIO()
        c = canvas.Canvas(watermark_buffer, pagesize=(page_width, page_height))
        c.setFont("Helvetica-Bold", font_size)
        c.setFillColor(fill_color)
        
        # Position mapping
        positions = {
            "center": [(page_width / 2, page_height / 2)],
            "top-left": [(100, page_height - 100)],
            "top-right": [(page_width - 100, page_height - 100)],
            "bottom-left": [(100, 100)],
            "bottom-right": [(page_width - 100, 100)],
        }
        
        if position == "tiled":
            # Calculate tiled positions
            coords = []
            spacing_x = page_width / (repeat_x + 1)
            spacing_y = page_height / (repeat_y + 1)
            for i in range(1, repeat_x + 1):
                for j in range(1, repeat_y + 1):
                    coords.append((spacing_x * i, spacing_y * j))
        else:
            coords = positions.get(position, positions["center"])
        
        # Draw watermarks at all positions
        for (x, y) in coords:
            c.saveState()
            c.translate(x, y)
            c.rotate(rotation)
            c.drawCentredString(0, 0, text)
            c.restoreState()
        
        c.save()
        watermark_buffer.seek(0)
        
        watermark_reader = PdfReader(watermark_buffer)
        watermark_page = watermark_reader.pages[0]
        
        for page in reader.pages:
            page.merge_page(watermark_page)
            writer.add_page(page)
        
        output_filename = f"watermarked_{uuid.uuid4()}.pdf"
        output_path = os.path.join(MERGED_DIR, output_filename)
        
        with open(output_path, "wb") as out_f:
            writer.write(out_f)
        
        return {"url": f"/download/{output_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def read_root():
    return {"message": "PDF Combiner Backend Ready"}

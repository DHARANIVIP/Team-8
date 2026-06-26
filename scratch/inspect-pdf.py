import os
import sys

print("Python version:", sys.version)

libraries = ['pypdf', 'PyPDF2', 'pdfplumber', 'fitz', 'pdfminer', 'reportlab']
available = []
for lib in libraries:
    try:
        __import__(lib)
        available.append(lib)
    except ImportError:
        pass

print("Available PDF libraries:", available)

# Check PDF files in public folder
files = ['frontend.pdf', 'backend.pdf']
for f in files:
    path = os.path.join('..', 'apps', 'frontend', 'public', f)
    abs_path = os.path.abspath(path)
    exists = os.path.exists(abs_path)
    print(f"File: {f} | Exists: {exists} | Size: {os.path.getsize(abs_path) if exists else 'N/A'} bytes")

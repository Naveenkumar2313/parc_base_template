import sys

def extract():
    try:
        try:
            import fitz
            doc = fitz.open('Virtual lab.pdf')
            text = chr(10).join([page.get_text() for page in doc])
            with open('pdf_out.txt', 'w', encoding='utf-8') as f:
                f.write(text)
            print("PyMuPDF success")
            return
        except ImportError:
            pass
            
        try:
            from pypdf import PdfReader
        except ImportError:
            from PyPDF2 import PdfReader

        reader = PdfReader('Virtual lab.pdf')
        text = chr(10).join([page.extract_text() or '' for page in reader.pages])
        with open('pdf_out.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print("PyPDF2 success")
    except Exception as e:
        print(f"Failed extraction: {str(e)}")

extract()

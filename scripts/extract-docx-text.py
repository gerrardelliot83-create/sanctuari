#!/usr/bin/env python3
"""Extract text from .docx files without external dependencies"""

import sys
import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text_from_docx(docx_path):
    """Extract text from a .docx file"""
    try:
        # Open the .docx file as a zip
        with zipfile.ZipFile(docx_path, 'r') as docx:
            # Read the main document XML
            xml_content = docx.read('word/document.xml')

            # Parse XML
            tree = ET.XML(xml_content)

            # Define namespace
            namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

            # Extract all text elements
            texts = []
            for text_elem in tree.findall('.//w:t', namespace):
                if text_elem.text:
                    texts.append(text_elem.text)

            return ''.join(texts)
    except Exception as e:
        return f"Error reading {docx_path}: {str(e)}"

def main():
    resources_dir = "/mnt/c/Users/DELL/Desktop/sanctuari/Resources"

    files = [
        "component-library-and-user-stories.docx",
        "initial-prompt.docx",
        "technical-specifications.docx"
    ]

    for filename in files:
        filepath = os.path.join(resources_dir, filename)

        print(f"\n{'='*80}")
        print(f"FILE: {filename}")
        print(f"{'='*80}\n")

        if os.path.exists(filepath):
            text = extract_text_from_docx(filepath)
            print(text)
        else:
            print(f"File not found: {filepath}")

if __name__ == "__main__":
    main()

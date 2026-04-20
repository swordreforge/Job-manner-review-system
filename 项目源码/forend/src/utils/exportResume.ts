import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import type { Student } from '../types';

export async function exportResumeToPDF(htmlContent: string): Promise<void> {
  const container = document.createElement('div');
  container.className = 'resume-export-container';
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    const xOffset = (pdfWidth - scaledWidth) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight);

    const timestamp = new Date().toISOString().slice(0, 10);
    pdf.save(`简历_${timestamp}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportResumeToDOCX(profile: Student | null, htmlContent: string): Promise<void> {
  const sections: Paragraph[] = [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const name = doc.querySelector('h1')?.textContent || profile?.name || '未命名';
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: name, bold: true, size: 48 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  const subtitle = doc.querySelector('h1 + p');
  if (subtitle?.textContent) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: subtitle.textContent, size: 24, color: '666666' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  const h2Elements = doc.querySelectorAll('h2');
  h2Elements.forEach((h2) => {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: h2.textContent || '', bold: true, size: 32, color: '1a73e8' })],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '1a73e8' },
        },
      })
    );

    let sibling = h2.nextElementSibling;
    while (sibling && sibling.tagName !== 'H2') {
      if (sibling.tagName === 'P' || sibling.tagName === 'H3') {
        const isH3 = sibling.tagName === 'H3';
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: sibling.textContent || '',
                bold: isH3,
                size: isH3 ? 28 : 24,
              }),
            ],
            spacing: { before: isH3 ? 100 : 40, after: 40 },
          })
        );
      } else if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
        const items = sibling.querySelectorAll('li');
        items.forEach((li) => {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `• ${li.textContent || ''}`, size: 24 })],
              spacing: { before: 20, after: 20 },
              indent: { left: 400 },
            })
          );
        });
      } else if (sibling.tagName === 'DIV') {
        const h3 = sibling.querySelector('h3');
        if (h3) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: h3.textContent || '', bold: true, size: 28 })],
              spacing: { before: 100, after: 40 },
            })
          );
        }
        const ps = sibling.querySelectorAll('p');
        ps.forEach((p) => {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: p.textContent || '', size: 24 })],
              spacing: { before: 20, after: 20 },
            })
          );
        });
      }

      sibling = sibling.nextElementSibling;
    }
  });

  if (profile?.suggestions && profile.suggestions.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: '', size: 24 })],
        spacing: { before: 200 },
      })
    );
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: '优化建议', bold: true, size: 32, color: '1a73e8' })],
        spacing: { before: 200, after: 100 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '1a73e8' },
        },
      })
    );
    profile.suggestions.forEach((suggestion) => {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${suggestion}`, size: 24 })],
          spacing: { before: 20, after: 20 },
          indent: { left: 400 },
        })
      );
    });
  }

  const docxDoc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(docxDoc);
  const timestamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `简历_${timestamp}.docx`);
}
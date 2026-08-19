import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun } from 'docx';
import jsPDF from 'jspdf';
import type { Story, Chapter, ExportFormat, ExportMode } from '../../types/manuscript';

function stripHtml(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Convert HTML paragraphs to plain text lines
function parseHtmlParagraphs(html: string): string[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  const ps = container.querySelectorAll('p, h1, h2, h3, blockquote, li');
  if (ps.length === 0) return [stripHtml(html)];
  
  const result: string[] = [];
  ps.forEach((el) => {
    const text = el.textContent?.trim();
    if (text) result.push(text);
  });
  return result;
}

export async function exportManuscript(
  story: Story,
  chapters: Chapter[],
  format: ExportFormat,
  mode: ExportMode
): Promise<void> {
  const filename = `${story.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${mode}`;

  if (format === 'md') {
    let mdContent = `# ${story.title}\n\n`;

    if (story.coverImage) {
      mdContent += `![Story Cover](${story.coverImage})\n\n`;
    }

    if (mode === 'annotated') {
      if (story.storyIdea) {
        mdContent += `> **Logline / Story Idea**: ${story.storyIdea}\n\n`;
      }
      if (story.storyOverview) {
        mdContent += `## Story Overview & Arc\n\n${story.storyOverview}\n\n---\n\n`;
      }
    }

    chapters.forEach((chapter) => {
      mdContent += `## ${chapter.title}\n\n`;

      if (chapter.chapterImage) {
        mdContent += `![Chapter Illustration](${chapter.chapterImage})\n\n`;
      }

      if (mode === 'annotated' && chapter.overview) {
        mdContent += `*Chapter Overview:*\n> ${chapter.overview.replace(/\n/g, '\n> ')}\n\n`;
      }
      const paragraphs = parseHtmlParagraphs(chapter.content);
      paragraphs.forEach((p) => {
        mdContent += `${p}\n\n`;
      });
      mdContent += `\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${filename}.md`);
  } 
  else if (format === 'docx') {
    const docParagraphs: Paragraph[] = [];

    // Title
    docParagraphs.push(
      new Paragraph({
        text: story.title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 300 },
      })
    );

    if (mode === 'annotated') {
      if (story.storyIdea) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Logline: ', bold: true }),
              new TextRun({ text: story.storyIdea, italics: true }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (story.storyOverview) {
        docParagraphs.push(
          new Paragraph({
            text: 'Story Overview',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
          })
        );
        story.storyOverview.split('\n').forEach((line) => {
          if (line.trim()) {
            docParagraphs.push(
              new Paragraph({
                text: line,
                spacing: { after: 100 },
              })
            );
          }
        });
      }
    }

    // Chapters
    chapters.forEach((chapter) => {
      docParagraphs.push(
        new Paragraph({
          text: chapter.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          pageBreakBefore: true,
        })
      );

      if (mode === 'annotated' && chapter.overview) {
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Chapter Overview: ', bold: true, italics: true }),
              new TextRun({ text: chapter.overview, italics: true }),
            ],
            spacing: { after: 200 },
          })
        );
      }

      const pTexts = parseHtmlParagraphs(chapter.content);
      pTexts.forEach((pText) => {
        docParagraphs.push(
          new Paragraph({
            text: pText,
            spacing: { after: 150, line: 360 },
          })
        );
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docParagraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  } 
  else if (format === 'pdf') {
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 50;
    const maxLineWidth = pageWidth - margin * 2;
    let y = 60;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        y = 60;
      }
    };

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text(story.title, margin, y);
    y += 40;

    if (mode === 'annotated') {
      if (story.storyIdea) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(11);
        const ideaLines = pdf.splitTextToSize(`Logline: ${story.storyIdea}`, maxLineWidth);
        checkPageBreak(ideaLines.length * 15 + 20);
        pdf.text(ideaLines, margin, y);
        y += ideaLines.length * 15 + 20;
      }
    }

    // Chapters
    chapters.forEach((chapter) => {
      checkPageBreak(40);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(chapter.title, margin, y);
      y += 25;

      if (mode === 'annotated' && chapter.overview) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        const ovLines = pdf.splitTextToSize(`Overview: ${chapter.overview}`, maxLineWidth);
        checkPageBreak(ovLines.length * 14 + 15);
        pdf.text(ovLines, margin, y);
        y += ovLines.length * 14 + 15;
        pdf.setTextColor(0, 0, 0);
      }

      pdf.setFont('times', 'normal');
      pdf.setFontSize(12);
      const paragraphs = parseHtmlParagraphs(chapter.content);
      
      paragraphs.forEach((pText) => {
        const lines = pdf.splitTextToSize(pText, maxLineWidth);
        checkPageBreak(lines.length * 16 + 10);
        pdf.text(lines, margin, y);
        y += lines.length * 16 + 12;
      });

      y += 20;
    });

    pdf.save(`${filename}.pdf`);
  }
}

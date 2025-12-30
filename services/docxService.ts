import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { ExtractedDocument, ElementType } from "../types";

export const generateAndDownloadDocx = async (data: ExtractedDocument) => {
  const docElements = [];

  // Add Title
  docElements.push(
    new Paragraph({
      text: data.title || "Untitled Document",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  );

  // Process elements
  data.elements.forEach((element) => {
    switch (element.type) {
      case ElementType.HEADING_1:
        if (element.content) {
          docElements.push(
            new Paragraph({
              text: element.content,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
            })
          );
        }
        break;

      case ElementType.HEADING_2:
        if (element.content) {
          docElements.push(
            new Paragraph({
              text: element.content,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            })
          );
        }
        break;

      case ElementType.PARAGRAPH:
        if (element.content) {
          docElements.push(
            new Paragraph({
              children: [new TextRun(element.content)],
              spacing: { after: 200 },
            })
          );
        }
        break;

      case ElementType.BULLET_LIST:
        if (element.items && Array.isArray(element.items)) {
          element.items.forEach((itemText) => {
            docElements.push(
              new Paragraph({
                children: [new TextRun(itemText)],
                bullet: {
                  level: 0,
                },
              })
            );
          });
        }
        break;
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'converted_document'}.docx`);
};

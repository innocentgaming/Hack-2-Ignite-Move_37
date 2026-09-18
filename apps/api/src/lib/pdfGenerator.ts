/**
 * Minimal Compliant Binary PDF Generator
 * Generates valid binary PDF-1.4 files with proper xref tables, object offsets,
 * font resources, and text streams that render cleanly in Adobe Acrobat,
 * Chrome, Firefox, Edge, and iOS/Android PDF readers.
 */

export interface PDFDocumentOptions {
  title: string;
  subtitle?: string;
  institutionName?: string;
  recipientName?: string;
  referenceNumber?: string;
  date?: string;
  sections?: Array<{
    heading: string;
    body: string | string[];
  }>;
}

export function generateValidPDF(options: PDFDocumentOptions): Buffer {
  const lines: string[] = [];

  // Construct text display stream
  const textCommands: string[] = [];

  // Header Title
  textCommands.push('BT');
  textCommands.push('/F1 18 Tf');
  textCommands.push('50 730 Td');
  textCommands.push(`(${escapePdfString(options.title)}) Tj`);
  textCommands.push('ET');

  let currentY = 705;

  if (options.institutionName) {
    textCommands.push('BT');
    textCommands.push('/F1 12 Tf');
    textCommands.push(`50 ${currentY} Td`);
    textCommands.push(`(${escapePdfString(options.institutionName)}) Tj`);
    textCommands.push('ET');
    currentY -= 18;
  }

  if (options.subtitle) {
    textCommands.push('BT');
    textCommands.push('/F1 10 Tf');
    textCommands.push(`50 ${currentY} Td`);
    textCommands.push(`(${escapePdfString(options.subtitle)}) Tj`);
    textCommands.push('ET');
    currentY -= 20;
  }

  // Divider line
  textCommands.push(`50 ${currentY} m 560 ${currentY} l S`);
  currentY -= 25;

  if (options.referenceNumber || options.date) {
    textCommands.push('BT');
    textCommands.push('/F1 9 Tf');
    textCommands.push(`50 ${currentY} Td`);
    const meta = [
      options.referenceNumber ? `Ref: ${options.referenceNumber}` : '',
      options.date ? `Date: ${options.date}` : `Date: ${new Date().toISOString().split('T')[0]}`,
    ]
      .filter(Boolean)
      .join('    |    ');
    textCommands.push(`(${escapePdfString(meta)}) Tj`);
    textCommands.push('ET');
    currentY -= 25;
  }

  if (options.recipientName) {
    textCommands.push('BT');
    textCommands.push('/F1 11 Tf');
    textCommands.push(`50 ${currentY} Td`);
    textCommands.push(`(Dear ${escapePdfString(options.recipientName)},) Tj`);
    textCommands.push('ET');
    currentY -= 22;
  }

  const sections = options.sections || [
    {
      heading: 'Official Institutional Verification',
      body: [
        'This official document confirms the authentic internship records registered under InternOS.',
        'All work submissions, developmental milestones, and outcome evaluations are verified.',
        'Governed under strict institutional multi-tenant compliance policies.',
      ],
    },
  ];

  for (const sec of sections) {
    if (currentY < 120) break; // Keep within single page boundaries

    textCommands.push('BT');
    textCommands.push('/F1 12 Tf');
    textCommands.push(`50 ${currentY} Td`);
    textCommands.push(`(${escapePdfString(sec.heading)}) Tj`);
    textCommands.push('ET');
    currentY -= 18;

    const bodyLines = Array.isArray(sec.body) ? sec.body : [sec.body];
    textCommands.push('BT');
    textCommands.push('/F1 10 Tf');
    for (const line of bodyLines) {
      if (currentY < 100) break;
      textCommands.push(`50 ${currentY} Td`);
      textCommands.push(`(${escapePdfString(line)}) Tj`);
      textCommands.push('ET');
      textCommands.push('BT');
      textCommands.push('/F1 10 Tf');
      currentY -= 15;
    }
    textCommands.push('ET');
    currentY -= 12;
  }

  // Footer
  textCommands.push('BT');
  textCommands.push('/F1 8 Tf');
  textCommands.push('50 50 Td');
  textCommands.push('(Digitally generated and verified by InternOS Multi-Tenant Governance Platform) Tj');
  textCommands.push('ET');

  const streamContent = textCommands.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'ascii');

  // Object 1: Catalog
  // Object 2: Pages
  // Object 3: Page
  // Object 4: Font
  // Object 5: Content Stream

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj5 = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';

  let offset = Buffer.byteLength(header, 'ascii');
  const offsets: number[] = [offset];

  offset += Buffer.byteLength(obj1, 'ascii');
  offsets.push(offset);

  offset += Buffer.byteLength(obj2, 'ascii');
  offsets.push(offset);

  offset += Buffer.byteLength(obj3, 'ascii');
  offsets.push(offset);

  offset += Buffer.byteLength(obj4, 'ascii');
  offsets.push(offset);

  const xrefOffset = offset + Buffer.byteLength(obj5, 'ascii');

  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (const off of offsets) {
    xref += off.toString().padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return Buffer.from(fullPdf, 'binary');
}

function escapePdfString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

import { jsPDF } from 'jspdf';

export type PlanInvoiceData = {
  invoiceNo?: string; storeName?: string; storeEmail?: string; storePhone?: string;
  storeSlug?: string; plan?: string; packageName?: string; packageLabel?: string;
  amount?: number; discountAmt?: number; couponCode?: string; paymentId?: string;
  type?: string; status?: string; note?: string; created_at?: string;
};
export type PlanInvoiceOptions = {
  logoUrl?: string; siteName?: string; primaryColor?: string;
  supportEmail?: string; supportPhone?: string; companyName?: string;
};

/** Vector text stays crisp when printed; long content flows onto additional A4 pages. */
export async function createPlanInvoicePdf(invoice: PlanInvoiceData, options: PlanInvoiceOptions = {}): Promise<jsPDF> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const brand = options.siteName?.trim() || 'Storsee';
  const reference = invoice.invoiceNo?.trim() || 'Invoice';
  const primary = /^#[0-9a-f]{6}$/i.test(options.primaryColor || '') ? options.primaryColor! : '#2563eb';
  const ink = '#20252d', muted = '#737b87', lineColor = '#e6e9ee';
  const amount = finiteAmount(invoice.amount), discount = finiteAmount(invoice.discountAmt);
  const paid = ['paid', 'completed'].includes(String(invoice.status || '').toLowerCase());
  const status = invoice.status || 'Not specified';
  const navy = '#142443';
  let y = 24;
  const logo = await loadLogo(options.logoUrl || 'assets/img/storsee-invoice-logo.png')
    || await loadLogo('assets/img/storsee-invoice-logo.png');
  if (!logo) throw new Error('The invoice logo could not be loaded.');
  pdf.setProperties({ title: `${reference} | ${brand}`, subject: 'Subscription invoice', author: brand, creator: brand });

  function text(value: unknown, x: number, top: number, size = 10, color = ink, bold = false, align: 'left' | 'right' = 'left') {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(color);
    pdf.text(String(value ?? ''), x, top, { align });
  }
  function rule(top: number) { pdf.setDrawColor(lineColor); pdf.setLineWidth(.25); pdf.line(18, top, 192, top); }
  function polygon(points: number[][], color: string) {
    pdf.setFillColor(color);
    pdf.lines(points.slice(1).map((point, i) => [point[0] - points[i][0], point[1] - points[i][1]]), points[0][0], points[0][1], [1, 1], 'F', true);
  }
  function placeLogo(x: number, top: number, maxWidth = 56, maxHeight = 16) {
    const width = Math.min(maxWidth, maxHeight * logo!.width / logo!.height);
    pdf.addImage(logo!.data, 'PNG', x, top, width, width * logo!.height / logo!.width);
  }
  function nextPage() {
    pdf.addPage(); y = 29;
    placeLogo(18, 10, 38, 10); text(reference, 192, 17, 9, muted, false, 'right'); rule(23);
  }
  function room(height: number) { if (y + height > 266) nextPage(); }
  function wrapped(value: unknown, x: number, width: number, size = 10, color = ink, bold = false): number {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(value ?? ''), width) as string[];
    for (const part of lines) { room(5); text(part, x, y, size, color, bold); y += size * .45 + 1; }
    return lines.length;
  }
  function field(label: string, value: unknown) {
    room(17); text(label.toUpperCase(), 18, y, 7.5, muted, true); y += 5;
    wrapped(value || 'Not provided', 18, 174, 9.5); y += 5;
  }

  // White logo area and contrasting angular navy/blue banner, in the brand palette.
  polygon([[119, 0], [210, 0], [210, 45], [140, 45]], navy);
  polygon([[113, 0], [117, 0], [138, 45], [134, 45]], primary);
  polygon([[0, 0], [105, 0], [108, 3], [0, 3]], primary);
  placeLogo(18, 16, 62, 17);
  text('INVOICE', 192, 25, 25, '#ffffff', true, 'right');
  text('SUBSCRIPTION BILLING', 192, 33, 7.5, '#d7e5ff', false, 'right');
  y = 40;
  wrapped(options.companyName || brand, 18, 94, 9, ink, true);
  // Configured company contacts also appear on every page in the footer.
  y = Math.max(y + 5, 56); rule(y); y += 8;

  text('INVOICE NUMBER', 18, y, 7.5, muted, true);
  text('ISSUED ON', 112, y, 7.5, muted, true); y += 6;
  const top = y;
  wrapped(reference, 18, 85, 11, ink, true);
  const refBottom = y; y = top;
  wrapped(invoiceDate(invoice.created_at), 112, 80, 10);
  y = Math.max(y, refBottom) + 10;

  const statusColor = paid ? '#167647' : '#965331';
  pdf.setFillColor(paid ? '#edf8f1' : '#fff4e9'); pdf.roundedRect(18, y - 4, 174, 19, 2, 2, 'F');
  text('PAYMENT STATUS', 23, y + 2, 7.5, statusColor, true);
  text(status.toUpperCase(), 23, y + 8, 10, statusColor, true);
  text(paid ? 'Payment received' : 'Payment not confirmed', 187, y + 5, 9, statusColor, false, 'right'); y += 24;

  const billingTop = y;
  text('BILLED TO', 18, y, 7.5, muted, true); y += 5;
  wrapped(invoice.storeName || 'Store', 18, 80, 10, ink, true); y += 3;
  if (invoice.storeEmail) { wrapped(invoice.storeEmail, 18, 80, 9, muted); }
  if (invoice.storePhone) { wrapped(invoice.storePhone, 18, 80, 9, muted); }
  if (invoice.storeSlug) { wrapped(`Store /${invoice.storeSlug}`, 18, 80, 9, muted); }
  const billingBottom = y;
  y = billingTop;
  text('PAYMENT DETAILS', 112, y, 7.5, muted, true); y += 6;
  if (invoice.type) wrapped(invoice.type, 112, 80, 9.5);
  if (invoice.paymentId) wrapped(invoice.paymentId, 112, 80, 8.5, muted);
  if (invoice.couponCode) wrapped('Coupon: ' + invoice.couponCode, 112, 80, 8.5, muted);
  y = Math.max(y, billingBottom) + 8; room(40);
  pdf.setFillColor(navy); pdf.rect(18, y - 5, 174, 12, 'F');
  polygon([[18, y - 5], [24, y + 1], [18, y + 7]], primary);
  text('DESCRIPTION', 28, y + 2, 8, '#ffffff', true);
  text('QTY', 135, y + 2, 8, muted, true, 'right');
  text('AMOUNT (INR)', 188, y + 2, 8, muted, true, 'right'); y += 15;
  const itemTop = y;
  text('1', 135, itemTop, 10, ink, false, 'right');
  text(money(amount + discount), 188, itemTop, 10, ink, true, 'right');
  wrapped(invoice.plan || invoice.packageName || 'Subscription plan', 22, 100, 11, ink, true);
  if (invoice.packageLabel) wrapped(invoice.packageLabel, 22, 100, 9, muted);
  y += 6; rule(y); y += 8;

  room(discount > 0 ? 45 : 34);
  text('Subtotal', 113, y, 9, muted); text(money(amount + discount), 188, y, 10, ink, false, 'right'); y += 9;
  if (discount > 0) { text('Discount', 113, y, 9, muted); text(`- ${money(discount)}`, 188, y, 10, '#167647', false, 'right'); y += 9; }
  polygon([[108, y - 4], [192, y - 4], [192, y + 11], [102, y + 11]], primary);
  text(paid ? 'Total paid' : 'Invoice total', 113, y + 5, 10, '#ffffff', true);
  text(money(amount), 188, y + 5, 12, '#ffffff', true, 'right'); y += 19;

  if (invoice.note?.trim()) { room(20); rule(y); y += 7; field('Notes', invoice.note.trim()); }
  room(18); y += 4; text('Thank you for choosing ' + brand + '.', 18, y, 10, ink, true); y += 6;
  wrapped(paid ? 'Your payment has been recorded. Please retain this invoice for your records.' : 'This document does not confirm receipt of payment.', 18, 174, 9, muted);

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    polygon([[0, 277], [124, 277], [134, 297], [0, 297]], navy);
    polygon([[129, 277], [210, 277], [210, 290], [135, 290]], primary);
    text('THANK YOU FOR YOUR BUSINESS', 18, 284, 8, '#ffffff', true);
    const contact = [options.supportEmail, options.supportPhone].filter(Boolean).join('   |   ');
    pdf.setFontSize(7);
    const contactLines = pdf.splitTextToSize(contact, 106) as string[];
    contactLines.slice(0, 2).forEach((part, index) => text(part, 18, 289 + index * 3, 7, '#dbe6f8'));
    text('Computer-generated invoice', 204, 282, 7, '#ffffff', false, 'right');
    text('No signature required', 204, 286, 7, '#ffffff', false, 'right');
    text('Page ' + page + ' / ' + pages, 192, 295, 7, muted, false, 'right');
  }
  return pdf;
}

export async function downloadPlanInvoicePdf(invoice: PlanInvoiceData, options: PlanInvoiceOptions = {}): Promise<void> {
  const pdf = await createPlanInvoicePdf(invoice, options);
  const filename = (invoice.invoiceNo || 'Storsee-invoice').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 100);
  pdf.save(`${filename}.pdf`);
}

function finiteAmount(value: unknown): number { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function money(value: number): string {
  return `INR ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function invoiceDate(value?: string): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Rasterize the configured logo once, preserving its aspect ratio and transparency. */
async function loadLogo(url?: string): Promise<{data: string; width: number; height: number} | null> {
  if (!url || typeof document === 'undefined') return null;
  return new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 7000);
    image.onload = () => {
      clearTimeout(timer);
      try {
        if (!image.naturalWidth || !image.naturalHeight) return resolve(null);
        const canvas = document.createElement('canvas');
        const ratio = Math.min(1, 1000 / image.naturalWidth, 400 / image.naturalHeight);
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({data: canvas.toDataURL('image/png'), width: image.naturalWidth, height: image.naturalHeight});
      } catch { resolve(null); }
    };
    image.onerror = () => { clearTimeout(timer); resolve(null); };
    try { image.src = new URL(url, document.baseURI).href; } catch { clearTimeout(timer); resolve(null); }
  });
}

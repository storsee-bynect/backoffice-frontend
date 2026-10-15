import { createPlanInvoicePdf, PlanInvoiceData } from './plan-invoice.util';

describe('Subscription invoice PDF', () => {
  let logoUrl: string;
  const invoice: PlanInvoiceData = {
    invoiceNo: 'INV-2026-1042', storeName: 'Example Store', storeEmail: 'merchant@example.com',
    storePhone: '+91 9000000000', storeSlug: 'example-store', plan: 'Professional annual subscription',
    packageLabel: 'Annual billing', amount: 8999, discountAmt: 1000, couponCode: 'WELCOME',
    paymentId: 'pay_example_12345', type: 'Razorpay', status: 'Paid', created_at: '2026-10-15',
    note: 'Subscription payment received.'
  };
  beforeEach(() => {
    const canvas = document.createElement('canvas'); canvas.width = 120; canvas.height = 30;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#0b72e7'; ctx.fillRect(0, 0, 120, 30);
    logoUrl = canvas.toDataURL('image/png');
  });
  const content = (pdf: any) => pdf.internal.pages.flat().join('\n');

  it('creates an A4 invoice with embedded logo and actual company/payment details', async () => {
    const pdf = await createPlanInvoicePdf(invoice, {logoUrl, siteName: 'Storsee', supportEmail: 'billing@example.com', supportPhone: '+91 9999999999', companyName: 'Example Company'});
    expect(pdf.getNumberOfPages()).toBe(1);
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
    expect(pdf.output()).toContain('/Subtype /Image');
    for (const value of ['Example Store', 'pay_example_12345', 'billing@example.com', '+91 9999999999', 'Example Company', 'INR 9,999.00', 'INR 1,000.00', 'INR 8,999.00']) {
      expect(content(pdf)).toContain(value);
    }
  });

  it('keeps long notes across pages and repeats company contacts and page numbering', async () => {
    const pdf = await createPlanInvoicePdf({...invoice, note: 'A detailed subscription billing note. '.repeat(600)}, {logoUrl, supportEmail: 'billing@example.com'});
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
    for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
      const stream = (pdf as any).internal.pages[page].join('\n');
      expect(stream).toContain('billing@example.com');
      expect(stream).toContain('Page ' + page + ' / ' + pdf.getNumberOfPages());
    }
  });

  it('does not label cancelled transactions as paid', async () => {
    const pdf = await createPlanInvoicePdf({...invoice, status: 'Cancelled'}, {logoUrl});
    expect(content(pdf)).toContain('Invoice total');
    expect(content(pdf)).not.toContain('Total paid');
  });
});

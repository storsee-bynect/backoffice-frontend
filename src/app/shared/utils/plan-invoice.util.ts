import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export type PlanInvoiceData = {
  invoiceNo?: string;
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
  storeSlug?: string;
  plan?: string;
  packageName?: string;
  packageLabel?: string;
  amount?: number;
  discountAmt?: number;
  couponCode?: string;
  paymentId?: string;
  type?: string;
  status?: string;
  note?: string;
  created_at?: string;
};

export type PlanInvoiceOptions = {
  logoUrl?: string;
  siteName?: string;
  primaryColor?: string;
  supportEmail?: string;
  supportPhone?: string;
};

const BRAND = {
  primary: '#0b72e7',
  primaryDeep: '#0856b5',
  ink: '#111827',
  muted: '#6b7280',
  line: '#e5e7eb',
  soft: '#f8fafc',
  ok: '#047857',
  okBg: '#ecfdf5',
};

/** Professional Storsee subscription invoice PDF. */
export async function downloadPlanInvoicePdf(
  invoice: PlanInvoiceData,
  options: PlanInvoiceOptions = {}
): Promise<void> {
  const primary = options.primaryColor || BRAND.primary;
  const siteName = options.siteName || 'Storsee';
  const resolvedLogo = resolveAssetUrl(options.logoUrl);
  const logoUrl = (await toDataUrlSafe(resolvedLogo)) || resolvedLogo;
  const html = buildInvoiceHtml(invoice, { ...options, logoUrl, siteName, primaryColor: primary });

  const host = document.createElement('div');
  host.setAttribute('id', 'plan-invoice-render-host');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;';
  host.innerHTML = html;
  document.body.appendChild(host);

  try {
    const paper = host.querySelector('.pi-paper') as HTMLElement;
    await waitForImages(paper);

    const canvas = await html2canvas(paper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const invoiceNo = invoice.invoiceNo || `INV-${Date.now()}`;
    pdf.save(`${invoiceNo}.pdf`);
  } finally {
    host.remove();
  }
}

function buildInvoiceHtml(
  invoice: PlanInvoiceData,
  options: PlanInvoiceOptions & { logoUrl?: string; primaryColor: string; siteName: string }
): string {
  const p = options.primaryColor;
  const invoiceNo = esc(invoice.invoiceNo || `INV-${Date.now()}`);
  const dateLabel = esc(formatInvoiceDate(invoice.created_at));
  const storeName = esc(invoice.storeName || 'Store');
  const planName = esc(invoice.plan || invoice.packageName || 'Subscription plan');
  const planLabel = esc(invoice.packageLabel || invoice.type || 'Subscription');
  const status = esc(invoice.status || 'Paid');
  const isPaid = String(invoice.status || 'Paid').toLowerCase() === 'paid';

  const amount = Number(invoice.amount || 0);
  const discount = Number(invoice.discountAmt || 0);
  const subtotal = amount + discount;

  const logoBlock = options.logoUrl
    ? `<img class="pi-logo" src="${escAttr(options.logoUrl)}" alt="${escAttr(options.siteName)}" crossorigin="anonymous" />`
    : `<div class="pi-logo-fallback">${esc(options.siteName)}</div>`;

  const couponRow =
    discount > 0
      ? `<tr>
          <td>Discount${invoice.couponCode ? ` (${esc(invoice.couponCode)})` : ''}</td>
          <td class="pi-right pi-green">− ${money(discount)}</td>
        </tr>`
      : '';

  return `
  <div class="pi-root">
    <style>
      .pi-root, .pi-root * { box-sizing: border-box; font-family: Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      .pi-paper {
        width: 794px;
        background: #fff;
        color: ${BRAND.ink};
        position: relative;
        overflow: hidden;
      }
      .pi-accent {
        height: 8px;
        background: linear-gradient(90deg, ${p}, ${BRAND.primaryDeep});
      }
      .pi-pad { padding: 36px 40px 28px; }
      .pi-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 28px;
      }
      .pi-brand { min-width: 0; }
      .pi-logo {
        display: block;
        height: auto;
        width: auto;
        max-height: 56px;
        max-width: 220px;
        object-fit: contain;
        object-position: left center;
        margin-bottom: 12px;
      }
      .pi-logo-fallback {
        display: inline-flex;
        align-items: center;
        height: 48px;
        padding: 0 16px;
        border-radius: 10px;
        background: ${p};
        color: #fff;
        font-size: 20px;
        font-weight: 800;
        letter-spacing: 0.04em;
        margin-bottom: 12px;
      }
      .pi-issuer {
        font-size: 12px;
        color: ${BRAND.muted};
        line-height: 1.5;
      }
      .pi-issuer strong {
        display: block;
        color: ${BRAND.ink};
        font-size: 13px;
        margin-bottom: 2px;
      }
      .pi-inv-box { text-align: right; }
      .pi-inv-title {
        margin: 0 0 4px;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: ${p};
      }
      .pi-inv-sub {
        margin: 0 0 14px;
        font-size: 12px;
        color: ${BRAND.muted};
      }
      .pi-meta {
        display: inline-block;
        text-align: left;
        background: ${BRAND.soft};
        border: 1px solid ${BRAND.line};
        border-radius: 12px;
        padding: 12px 14px;
        min-width: 220px;
      }
      .pi-meta-row {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        font-size: 12px;
        margin-bottom: 6px;
      }
      .pi-meta-row:last-child { margin-bottom: 0; }
      .pi-meta-row span { color: ${BRAND.muted}; }
      .pi-meta-row strong { color: ${BRAND.ink}; font-weight: 700; }
      .pi-parties {
        width: 100%;
        border-collapse: separate;
        border-spacing: 12px 0;
        margin: 0 0 22px -12px;
      }
      .pi-party {
        width: 50%;
        vertical-align: top;
        background: #fff;
        border: 1px solid ${BRAND.line};
        border-radius: 12px;
        padding: 14px 16px;
      }
      .pi-party-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: ${BRAND.muted};
        margin-bottom: 8px;
      }
      .pi-party strong {
        display: block;
        font-size: 15px;
        margin-bottom: 4px;
        color: ${BRAND.ink};
      }
      .pi-party div {
        font-size: 12px;
        color: ${BRAND.muted};
        line-height: 1.45;
      }
      .pi-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 18px;
      }
      .pi-table th {
        text-align: left;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #fff;
        background: ${p};
        padding: 11px 12px;
      }
      .pi-table th:first-child { border-radius: 10px 0 0 0; }
      .pi-table th:last-child { border-radius: 0 10px 0 0; text-align: right; }
      .pi-table td {
        padding: 14px 12px;
        border-bottom: 1px solid ${BRAND.line};
        font-size: 13px;
        color: ${BRAND.ink};
        vertical-align: top;
      }
      .pi-table td.pi-right { text-align: right; font-weight: 650; font-variant-numeric: tabular-nums; }
      .pi-item-name { font-weight: 700; margin-bottom: 2px; }
      .pi-item-sub { font-size: 12px; color: ${BRAND.muted}; }
      .pi-bottom {
        width: 100%;
        border-collapse: separate;
        border-spacing: 16px 0;
        margin: 0 0 18px -16px;
      }
      .pi-notes {
        width: 54%;
        vertical-align: top;
        padding: 4px 0;
      }
      .pi-notes-title {
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 6px;
        color: ${BRAND.ink};
      }
      .pi-notes p {
        margin: 0;
        font-size: 12px;
        color: ${BRAND.muted};
        line-height: 1.5;
      }
      .pi-pill {
        display: inline-flex;
        margin-top: 10px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        background: ${isPaid ? BRAND.okBg : '#fef2f2'};
        color: ${isPaid ? BRAND.ok : '#b91c1c'};
      }
      .pi-totals {
        width: 46%;
        vertical-align: top;
      }
      .pi-totals-inner {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid ${BRAND.line};
        border-radius: 12px;
        overflow: hidden;
      }
      .pi-totals-inner td {
        padding: 10px 12px;
        font-size: 12px;
        border-bottom: 1px solid ${BRAND.line};
      }
      .pi-totals-inner tr:last-child td { border-bottom: 0; }
      .pi-totals-inner .pi-label { color: ${BRAND.muted}; }
      .pi-totals-inner .pi-right { text-align: right; font-weight: 650; color: ${BRAND.ink}; }
      .pi-green { color: ${BRAND.ok} !important; }
      .pi-totals-inner tr.grand td {
        background: ${p};
        color: #fff;
        font-weight: 800;
        font-size: 13px;
      }
      .pi-totals-inner tr.grand .pi-label,
      .pi-totals-inner tr.grand .pi-right { color: #fff; }
      .pi-foot {
        border-top: 1px solid ${BRAND.line};
        padding-top: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .pi-foot-left {
        font-size: 11px;
        color: #9ca3af;
        line-height: 1.45;
      }
      .pi-foot-brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 700;
        color: ${BRAND.ink};
      }
      .pi-foot-logo {
        height: 22px;
        width: auto;
        max-width: 96px;
        object-fit: contain;
      }
    </style>
    <div class="pi-paper">
      <div class="pi-accent"></div>
      <div class="pi-pad">
        <div class="pi-top">
          <div class="pi-brand">
            ${logoBlock}
            <div class="pi-issuer">
              <strong>${esc(options.siteName)}</strong>
              Subscription billing
              ${options.supportEmail ? `<div>${esc(options.supportEmail)}</div>` : ''}
              ${options.supportPhone ? `<div>${esc(options.supportPhone)}</div>` : ''}
            </div>
          </div>
          <div class="pi-inv-box">
            <h1 class="pi-inv-title">INVOICE</h1>
            <p class="pi-inv-sub">Official payment receipt</p>
            <div class="pi-meta">
              <div class="pi-meta-row"><span>Invoice</span><strong>${invoiceNo}</strong></div>
              <div class="pi-meta-row"><span>Date</span><strong>${dateLabel}</strong></div>
              <div class="pi-meta-row"><span>Status</span><strong>${status}</strong></div>
            </div>
          </div>
        </div>

        <table class="pi-parties">
          <tr>
            <td class="pi-party">
              <span class="pi-party-label">Billed to</span>
              <strong>${storeName}</strong>
              ${invoice.storeEmail ? `<div>${esc(invoice.storeEmail)}</div>` : ''}
              ${invoice.storePhone ? `<div>${esc(invoice.storePhone)}</div>` : ''}
              ${invoice.storeSlug ? `<div>/${esc(invoice.storeSlug)}</div>` : ''}
            </td>
            <td class="pi-party">
              <span class="pi-party-label">From</span>
              <strong>${esc(options.siteName)}</strong>
              <div>SaaS subscription platform</div>
              ${options.supportEmail ? `<div>${esc(options.supportEmail)}</div>` : ''}
            </td>
          </tr>
        </table>

        <table class="pi-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="pi-item-name">${planName}</div>
                <div class="pi-item-sub">${planLabel}${invoice.paymentId ? ` · ${esc(invoice.paymentId)}` : ''}</div>
              </td>
              <td class="pi-right">${money(subtotal)}</td>
            </tr>
          </tbody>
        </table>

        <table class="pi-bottom">
          <tr>
            <td class="pi-notes">
              <div class="pi-notes-title">Thank you for your business</div>
              <p>This invoice confirms your ${esc(options.siteName)} subscription payment. Retain it for your records. Unused plan days stack when you renew early.</p>
              <span class="pi-pill">${status}</span>
              ${invoice.note ? `<p style="margin-top:10px">${esc(String(invoice.note).slice(0, 140))}</p>` : ''}
            </td>
            <td class="pi-totals">
              <table class="pi-totals-inner">
                <tr>
                  <td class="pi-label">Subtotal</td>
                  <td class="pi-right">${money(subtotal)}</td>
                </tr>
                ${couponRow}
                <tr class="grand">
                  <td class="pi-label">Total paid</td>
                  <td class="pi-right">${money(amount)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div class="pi-foot">
          <div class="pi-foot-left">
            Computer-generated invoice · ${esc(options.siteName)}<br/>
            No signature required
          </div>
          <div class="pi-foot-brand">
            ${
              options.logoUrl
                ? `<img class="pi-foot-logo" src="${escAttr(options.logoUrl)}" alt="" crossorigin="anonymous" />`
                : ''
            }
            <span>${esc(options.siteName)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function money(n: number): string {
  return `₹${Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatInvoiceDate(value?: string): string {
  if (!value) return new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 16);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveAssetUrl(url?: string): string {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (typeof window === 'undefined') return raw;
  if (raw.startsWith('/')) return `${window.location.origin}${raw}`;
  return `${window.location.origin}/${raw.replace(/^\.\//, '')}`;
}

/** Prefer embedding logo as data URL so PDF export is not blocked by CORS. */
async function toDataUrlSafe(url?: string): Promise<string> {
  const src = String(url || '').trim();
  if (!src || src.startsWith('data:')) return src;
  try {
    const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return '';
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  if (!imgs.length) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  ).then(() => undefined);
}

function esc(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(value: any): string {
  return esc(value).replace(/'/g, '&#39;');
}

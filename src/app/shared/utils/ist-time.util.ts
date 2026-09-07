const IST_OFFSET_MIN = 330;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function parseHm(value: string | null | undefined): string | null {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${pad2(h)}:${pad2(min)}`;
}

export function istHmToUtcHm(hm: string): string | null {
  const parsed = parseHm(hm);
  if (!parsed) return null;
  const [h, min] = parsed.split(':').map(Number);
  let total = h * 60 + min - IST_OFFSET_MIN;
  if (total < 0) total += 1440;
  if (total >= 1440) total -= 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export function utcHmToIstHm(hm: string): string | null {
  const parsed = parseHm(hm);
  if (!parsed) return null;
  const [h, min] = parsed.split(':').map(Number);
  let total = h * 60 + min + IST_OFFSET_MIN;
  if (total < 0) total += 1440;
  if (total >= 1440) total -= 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

function parseAsUtc(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)) {
    const d = new Date(raw.replace(' ', 'T') + 'Z');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function shiftToIstParts(date: Date) {
  const ist = new Date(date.getTime() + IST_OFFSET_MIN * 60 * 1000);
  return {
    y: ist.getUTCFullYear(),
    m: pad2(ist.getUTCMonth() + 1),
    d: pad2(ist.getUTCDate()),
    h: pad2(ist.getUTCHours()),
    min: pad2(ist.getUTCMinutes())
  };
}

export function istDateTimeLocalToUtcIso(local: string): string | null {
  const m = String(local || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const utcMs = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) - IST_OFFSET_MIN * 60 * 1000;
  const d = new Date(utcMs);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function utcToIstDateTimeLocal(value: any): string {
  const d = parseAsUtc(value);
  if (!d) return '';
  const p = shiftToIstParts(d);
  return `${p.y}-${p.m}-${p.d}T${p.h}:${p.min}`;
}

export function istDateStartToUtcIso(dateStr: string): string | null {
  const day = String(dateStr || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return istDateTimeLocalToUtcIso(`${day}T00:00`);
}

export function istDateEndToUtcIso(dateStr: string): string | null {
  const day = String(dateStr || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return istDateTimeLocalToUtcIso(`${day}T23:59`);
}

export function utcToIstDate(value: any): string {
  return utcToIstDateTimeLocal(value).slice(0, 10);
}

export function formatIst(value: any): string {
  const local = utcToIstDateTimeLocal(value);
  if (!local) return '—';
  return `${local.replace('T', ' ')} IST`;
}

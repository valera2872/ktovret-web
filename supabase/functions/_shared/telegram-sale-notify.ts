const BOT_TOKEN = (Deno.env.get('TELEGRAM_SALES_BOT_TOKEN') || '').trim();
const CHAT_ID = (Deno.env.get('TELEGRAM_SALES_CHAT_ID') || '').trim();

const LABELS: Record<string,string> = {
  volume1: '«Кто врёт?» — полный архив',
  last_aria: '«Последняя ария»',
  solo_investigations_v1: 'Solo Investigations — Том I',
  partner_ne_publikovat: 'Premium Partner «Не публиковать»',
  kto_vret_bundle_v1: 'Mystery Logic — комплект',
};

const formatPaidAt = (value: unknown) => {
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', '') + ' МСК';
};

export const telegramSalesConfigured = () => Boolean(BOT_TOKEN && CHAT_ID);

export const notifySaleTelegram = async (order: any) => {
  if (!telegramSalesConfigured()) return { ok: false, skipped: true, reason: 'not_configured' };

  const productId = String(order?.product_id || '').trim();
  const label = LABELS[productId] || productId || 'Mystery Logic';
  const amount = Number(order?.amount_value || 0);
  const currency = String(order?.currency || 'RUB').trim().toUpperCase();
  const amountText = Number.isFinite(amount)
    ? `${amount.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${currency === 'RUB' ? '₽' : currency}`
    : '';
  const provider = String(order?.payment_provider || 'tbank').toLowerCase() === 'tbank' ? 'T-Bank' : String(order?.payment_provider || '');
  const time = formatPaidAt(order?.paid_at);
  const orderShort = String(order?.id || '').slice(0, 8);

  const text = [
    '💰 Mystery Logic — новая продажа',
    label,
    [amountText, provider].filter(Boolean).join(' · '),
    time,
    orderShort ? `Заказ: ${orderShort}` : '',
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) {
      console.warn('telegram_sale_notification_failed', response.status);
      return { ok: false, skipped: false, reason: `http_${response.status}` };
    }
    return { ok: true, skipped: false };
  } catch (error: any) {
    console.warn('telegram_sale_notification_failed', String(error?.name || 'Error'));
    return { ok: false, skipped: false, reason: 'network_error' };
  }
};

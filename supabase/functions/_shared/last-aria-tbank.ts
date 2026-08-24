import { formatAmount } from './last-aria-payment.ts';

export const TBANK_TERMINAL_KEY = (Deno.env.get('TBANK_TERMINAL_KEY') || '').trim();
export const TBANK_PASSWORD = Deno.env.get('TBANK_PASSWORD') || '';
const TBANK_API_BASE = 'https://securepay.tinkoff.ru/v2';

// T-Bank's current chain terminates at the Russian Trusted Root CA, which is
// not part of the default edge-runtime trust store. Keep this trust anchor
// local to Last Aria so the paid product does not depend on volume1 helpers.
const RUSSIAN_TRUSTED_ROOT_CA = `-----BEGIN CERTIFICATE-----
MIIFwjCCA6qgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwcDELMAkGA1UEBhMCUlUx
PzA9BgNVBAoMNlRoZSBNaW5pc3RyeSBvZiBEaWdpdGFsIERldmVsb3BtZW50IGFu
ZCBDb21tdW5pY2F0aW9uczEgMB4GA1UEAwwXUnVzc2lhbiBUcnVzdGVkIFJvb3Qg
Q0EwHhcNMjIwMzAxMjEwNDE1WhcNMzIwMjI3MjEwNDE1WjBwMQswCQYDVQQGEwJS
VTE/MD0GA1UECgw2VGhlIE1pbmlzdHJ5IG9mIERpZ2l0YWwgRGV2ZWxvcG1lbnQg
YW5kIENvbW11bmljYXRpb25zMSAwHgYDVQQDDBdSdXNzaWFuIFRydXN0ZWQgUm9v
dCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMfFOZ8pUAL3+r2n
qqE0Zp52selXsKGFYoG0GM5bwz1bSFtCt+AZQMhkWQheI3poZAToYJu69pHLKS6Q
XBiwBC1cvzYmUYKMYZC7jE5YhEU2bSL0mX7NaMxMDmH2/NwuOVRj8OImVa5s1F4U
zn4Kv3PFlDBjjSjXKVY9kmjUBsXQrIHeaqmUIsPIlNWUnimXS0I0abExqkbdrXbX
YwCOXhOO2pDUx3ckmJlCMUGacUTnylyQW2VsJIyIGA8V0xzdaeUXg0VZ6ZmNUr5Y
Ber/EAOLPb8NYpsAhJe2mXjMB/J9HNsoFMBFJ0lLOT/+dQvjbdRZoOT8eqJpWnVD
U+QL/qEZnz57N88OWM3rabJkRNdU/Z7x5SFIM9FrqtN8xewsiBWBI0K6XFuOBOTD
4V08o4TzJ8+Ccq5XlCUW2L48pZNCYuBDfBh7FxkB7qDgGDiaftEkZZfApRg2E+M9
G8wkNKTPLDc4wH0FDTijhgxR3Y4PiS1HL2Zhw7bD3CbslmEGgfnnZojNkJtcLeBH
BLa52/dSwNU4WWLubaYSiAmA9IUMX1/RpfpxOxd4Ykmhz97oFbUaDJFipIggx5sX
ePAlkTdWnv+RWBxlJwMQ25oEHmRguNYf4Zr/Rxr9cS93Y+mdXIZaBEE0KS2iLRqa
OiWBki9IMQU4phqPOBAaG7A+eP8PAgMBAAGjZjBkMB0GA1UdDgQWBBTh0YHlzlpf
BKrS6badZrHF+qwshzAfBgNVHSMEGDAWgBTh0YHlzlpfBKrS6badZrHF+qwshzAS
BgNVHRMBAf8ECDAGAQH/AgEEMA4GA1UdDwEB/wQEAwIBhjANBgkqhkiG9w0BAQsF
AAOCAgEAALIY1wkilt/urfEVM5vKzr6utOeDWCUczmWX/RX4ljpRdgF+5fAIS4vH
tmXkqpSCOVeWUrJV9QvZn6L227ZwuE15cWi8DCDal3Ue90WgAJJZMfTshN4OI8cq
W9E4EG9wglbEtMnObHlms8F3CHmrw3k6KmUkWGoa+/ENmcVl68u/cMRl1JbW2bM+
/3A+SAg2c6iPDlehczKx2oa95QW0SkPPWGuNA/CE8CpyANIhu9XFrj3RQ3EqeRcS
AQQod1RNuHpfETLU/A2gMmvn/w/sx7TB3W5BPs6rprOA37tutPq9u6FTZOcG1Oqj
C/B7yTqgI7rbyvox7DEXoX7rIiEqyNNUguTk/u3SZ4VXE2kmxdmSh3TQvybfbnXV
4JbCZVaqiZraqc7oZMnRoWrXRG3ztbnbes/9qhRGI7PqXqeKJBztxRTEVj8ONs1d
WN5szTwaPIvhkhO3CO5ErU2rVdUr89wKpNXbBODFKRtgxUT70YpmJ46VVaqdAhOZ
D9EUUn4YaeLaS8AjSF/h7UkjOibNc4qVDiPP+rkehFWM66PVnP1Msh93tc+taIfC
EYVMxjh8zNbFuoc7fzvvrFILLe7ifvEIUqSVIC/AzplM/Jxw7buXFeGP1qVCBEHq
391d/9RAfaZ12zkwFsl+IKwE/OZxW8AHa9i1p4GO0YSNuczzEm4=
-----END CERTIFICATE-----`;

export const amountToKopecks = (value: unknown) => {
  const formatted = formatAmount(value);
  if (!formatted) return 0;
  return Math.round(Number(formatted) * 100);
};

export const tbankConfigReady = () => Boolean(TBANK_TERMINAL_KEY && TBANK_PASSWORD);

const tokenEntries = (payload: Record<string, unknown>) => Object.entries(payload)
  .filter(([key, value]) => key !== 'Token'
    && value !== undefined
    && value !== null
    && typeof value !== 'object')
  .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

export const tbankToken = async (payload: Record<string, unknown>) => {
  const signed = { ...payload, Password: TBANK_PASSWORD };
  const source = tokenEntries(signed).map(([, value]) => String(value)).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
};

const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
};

export const verifyTbankToken = async (payload: Record<string, unknown>) => {
  const supplied = String(payload.Token || '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(supplied)) return false;
  const expected = await tbankToken(payload);
  return safeEqual(supplied, expected);
};

let tbankHttpClient: Deno.HttpClient | null = null;
const getTbankHttpClient = () => {
  if (!tbankHttpClient) tbankHttpClient = Deno.createHttpClient({ caCerts: [RUSSIAN_TRUSTED_ROOT_CA] });
  return tbankHttpClient;
};

export const tbankRequest = async (method: string, payload: Record<string, unknown>) => {
  if (!tbankConfigReady()) throw new Error('tbank_not_configured');
  const unsigned = { TerminalKey: TBANK_TERMINAL_KEY, ...payload };
  const body = { ...unsigned, Token: await tbankToken(unsigned) };
  const response = await fetch(`${TBANK_API_BASE}/${method.replace(/^\//, '')}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    client: getTbankHttpClient(),
  });
  let data: any = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error: any = new Error(`tbank_http_${response.status}`);
    error.status = response.status;
    error.body = data;
    throw error;
  }
  const errorCode = String(data?.ErrorCode ?? '0');
  if (data?.Success === false || (errorCode && errorCode !== '0')) {
    const error: any = new Error(String(data?.Message || data?.Details || `tbank_error_${errorCode}`));
    error.status = response.status;
    error.code = errorCode;
    error.body = data;
    throw error;
  }
  return data;
};

export const tbankPaymentMatchesOrder = (payment: any, order: any) => {
  if (!payment || !order) return false;
  const paymentId = String(order.provider_payment_id || '');
  if (!paymentId || String(payment.PaymentId || '') !== paymentId) return false;
  if (payment.OrderId != null && String(payment.OrderId) !== String(order.id)) return false;
  if (payment.TerminalKey != null && String(payment.TerminalKey) !== TBANK_TERMINAL_KEY) return false;
  const expectedAmount = amountToKopecks(order.amount_value);
  if (payment.Amount != null && Number(payment.Amount) !== expectedAmount) return false;
  return expectedAmount > 0;
};

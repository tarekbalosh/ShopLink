/**
 * Currencies offered in shop settings. Limited to currencies that use two
 * decimal places, because prices are stored as numeric(12,2).
 */
export const SUPPORTED_CURRENCIES = [
  { code: "MYR", label: "Malaysian Ringgit (MYR)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
  { code: "IDR", label: "Indonesian Rupiah (IDR)" },
  { code: "THB", label: "Thai Baht (THB)" },
  { code: "PHP", label: "Philippine Peso (PHP)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "SAR", label: "Saudi Riyal (SAR)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "QAR", label: "Qatari Riyal (QAR)" },
  { code: "EGP", label: "Egyptian Pound (EGP)" },
  { code: "MAD", label: "Moroccan Dirham (MAD)" },
  { code: "TRY", label: "Turkish Lira (TRY)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "PKR", label: "Pakistani Rupee (PKR)" },
  { code: "BDT", label: "Bangladeshi Taka (BDT)" },
  { code: "NGN", label: "Nigerian Naira (NGN)" },
  { code: "KES", label: "Kenyan Shilling (KES)" },
  { code: "ZAR", label: "South African Rand (ZAR)" },
  { code: "BRL", label: "Brazilian Real (BRL)" },
  { code: "MXN", label: "Mexican Peso (MXN)" },
] as const;

export const SUPPORTED_CURRENCY_CODES: readonly string[] = SUPPORTED_CURRENCIES.map((c) => c.code);


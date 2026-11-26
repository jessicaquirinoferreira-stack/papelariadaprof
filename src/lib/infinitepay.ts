export interface InstallmentOption {
  installments: number;
  interestRatePercent: number;
  hasInterest: boolean;
  interestAmount: number;
  totalWithInterest: number;
  installmentValue: number;
}

/**
 * Tabela oficial InfinitePay (Crédito Parcelado — recebimento 1 dia útil).
 * De 1x a 3x: sem juros para o cliente.
 * Acima de 3x (4x a 12x): aplica juros da InfinitePay.
 */
export const INFINITEPAY_INSTALLMENT_RATES: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 6.85,
  5: 7.57,
  6: 8.28,
  7: 8.99,
  8: 9.8,
  9: 10.38,
  10: 11.06,
  11: 11.74,
  12: 12.4,
};

export const MIN_INSTALLMENT_VALUE_BRL = 5;

export function getInfinitePayRatePercent(installments: number): number {
  const n = Math.max(1, Math.min(12, Math.floor(installments || 1)));
  return INFINITEPAY_INSTALLMENT_RATES[n] ?? 0;
}

export function calculateInstallmentOption(
  baseTotal: number,
  installments: number
): InstallmentOption {
  const safeBase = Math.max(0, Number(baseTotal) || 0);
  const n = Math.max(1, Math.min(12, Math.floor(installments || 1)));
  const rate = getInfinitePayRatePercent(n);
  const hasInterest = n > 3 && rate > 0;

  const totalWithInterest = hasInterest
    ? Number((safeBase * (1 + rate / 100)).toFixed(2))
    : Number(safeBase.toFixed(2));
  const interestAmount = Math.max(
    0,
    Number((totalWithInterest - safeBase).toFixed(2))
  );
  const installmentValue = Number((totalWithInterest / n).toFixed(2));

  return {
    installments: n,
    interestRatePercent: rate,
    hasInterest,
    interestAmount,
    totalWithInterest,
    installmentValue,
  };
}

export function getAllowedInstallmentOptions(baseTotal: number): InstallmentOption[] {
  const options: InstallmentOption[] = [];
  for (let n = 1; n <= 12; n++) {
    const opt = calculateInstallmentOption(baseTotal, n);
    if (n === 1 || opt.installmentValue >= MIN_INSTALLMENT_VALUE_BRL) {
      options.push(opt);
    }
  }
  return options;
}

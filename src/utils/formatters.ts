export function formatarData(dataIso?: string | null): string {
  if (!dataIso) return '-';
  try {
    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return dataIso;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(data);
  } catch {
    return dataIso;
  }
}

export function formatarDataHora(dataIso?: string | null): string {
  if (!dataIso) return '-';
  try {
    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return dataIso;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(data);
  } catch {
    return dataIso;
  }
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(valor || 0);
}

export function formatarNumero(valor: number, decimais: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(valor || 0);
}

/**
 * Retorna a URL direta de direcionamento para a ficha do equipamento ao escanear o QR Code.
 * Funciona universalmente com a câmera nativa de qualquer celular ou com leitores industriais.
 */
export function getEquipamentoQrUrl(codigoPatrimonialOuEquipamento: string | { codigoPatrimonial: string }): string {
  const codigo = typeof codigoPatrimonialOuEquipamento === 'string'
    ? codigoPatrimonialOuEquipamento
    : codigoPatrimonialOuEquipamento?.codigoPatrimonial;

  if (!codigo) return '';

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const path = window.location.pathname || '/';
    return `${origin}${path}?eqp=${encodeURIComponent(codigo.trim())}`;
  }
  return `TRACKSUB-${codigo.trim()}`;
}


/**
 * Utilidades de saneamento de entrada do usuário.
 *
 * O Angular já escapa interpolações no template (mitigando XSS na renderização),
 * mas é importante validar e limpar dados antes de:
 *   - enviar ao backend (defesa em profundidade contra SQLi/NoSQLi/comando)
 *   - usar em URLs ou rotas
 *   - persistir/exibir em outros canais
 *
 * Estas funções são *defensivas no cliente*. A autoridade final de validação
 * permanece no backend.
 */

/** Caracteres de controle ASCII (exceto \t, \n, \r) que nunca devem aparecer em texto digitado. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Padrões frequentemente usados em payloads de XSS / injeção.
 * Não substituem WAF/sanitizador do backend — servem para bloquear cedo
 * entradas claramente maliciosas e impedir que o usuário envie scripts.
 */
const SUSPICIOUS_PATTERNS: RegExp[] = [
  /<\s*script\b/i,
  /<\s*\/\s*script\s*>/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*link\b/i,
  /\son\w+\s*=/i,            // handlers inline: onerror=, onclick=, ...
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bunion\s+select\b/i,     // SQL injection óbvia
  /\bselect\b.+\bfrom\b/i,
  /\bdrop\s+table\b/i,
  /\binsert\s+into\b/i,
  /\bdelete\s+from\b/i,
  /;\s*--/,                  // terminador + comentário SQL
  /\/\*.*\*\//s,             // comentário de bloco SQL
  /\$\{.*\}/                 // template injection
];

export interface SanitizeOptions {
  /** Tamanho máximo permitido. Padrão 255. */
  maxLength?: number;
  /** Permite múltiplas linhas (preserva \n). Padrão false. */
  multiline?: boolean;
  /** Se true, lança Error em vez de truncar/limpar silenciosamente. */
  strict?: boolean;
}

/**
 * Limpa um texto: remove caracteres de controle, normaliza espaços, aplica trim
 * e limita o tamanho. Não modifica caracteres válidos (acentos, emojis, etc).
 */
export function sanitizeText(input: unknown, options: SanitizeOptions = {}): string {
  const { maxLength = 255, multiline = false, strict = false } = options;

  if (input === null || input === undefined) return '';
  let text = String(input);

  // Normaliza Unicode (evita variações homógrafas).
  try { text = text.normalize('NFC'); } catch { /* ambientes sem suporte ignoram */ }

  // Remove caracteres de controle.
  text = text.replace(CONTROL_CHARS, '');

  if (!multiline) {
    text = text.replace(/[\r\n\t]+/g, ' ');
  }

  // Colapsa espaços excessivos.
  text = text.replace(/[ \t]{2,}/g, ' ').trim();

  if (text.length > maxLength) {
    if (strict) {
      throw new Error(`Texto excede o tamanho máximo de ${maxLength} caracteres.`);
    }
    text = text.slice(0, maxLength);
  }

  return text;
}

/**
 * Retorna true se o texto contém padrões claramente suspeitos
 * (XSS, SQLi, template injection). Usar antes de enviar ao backend.
 */
export function containsSuspiciousPattern(input: string): boolean {
  if (!input) return false;
  return SUSPICIOUS_PATTERNS.some(re => re.test(input));
}

/**
 * Saneamento agressivo para termos de busca: remove caracteres não imprimíveis,
 * tira caracteres tipicamente usados em injeção (`<`, `>`, `"`, `'`, `;`, `\`)
 * e limita o tamanho. Mantém letras, números, acentos, espaço e pontuação básica.
 */
export function sanitizeSearchTerm(input: unknown, maxLength = 100): string {
  const cleaned = sanitizeText(input, { maxLength });
  return cleaned.replace(/[<>"'`;\\]/g, '').trim();
}

/**
 * Garante que um identificador (uuid/numérico) seja seguro para uso em URL.
 * Aceita apenas caracteres alfanuméricos, hífen e underscore.
 */
export function sanitizeIdentifier(input: unknown): string {
  const text = sanitizeText(input, { maxLength: 64 });
  if (!/^[A-Za-z0-9_-]+$/.test(text)) {
    throw new Error('Identificador inválido.');
  }
  return text;
}

/**
 * Aplica `sanitizeText` em todas as propriedades string de um objeto plano.
 * Útil para limpar payloads antes de POST/PUT.
 */
export function sanitizePayload<T extends Record<string, unknown>>(
  payload: T,
  fieldOptions: Partial<Record<keyof T, SanitizeOptions>> = {}
): T {
  const out: Record<string, unknown> = { ...payload };
  for (const key of Object.keys(out)) {
    const value = out[key];
    if (typeof value === 'string') {
      out[key] = sanitizeText(value, fieldOptions[key as keyof T] ?? {});
    }
  }
  return out as T;
}

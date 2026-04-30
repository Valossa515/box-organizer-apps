/**
 * Validação de arquivos enviados pelo usuário.
 *
 * Não confiar apenas no atributo `accept` do <input type="file"> nem no MIME
 * declarado pelo navegador — ambos são facilmente forjáveis. Aqui validamos:
 *   1. Tipo MIME declarado contra uma allow-list.
 *   2. Extensão do nome do arquivo.
 *   3. Tamanho máximo.
 *   4. "Magic bytes" (assinatura) reais do arquivo.
 */

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_MIMES = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set<string>([
  'jpg', 'jpeg', 'png', 'webp', 'gif'
]);

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

export interface ImageValidationOptions {
  maxBytes?: number;
}

/**
 * Valida apenas as propriedades sincrônicas (tipo, nome, tamanho).
 * Use {@link validateImageFile} para checagem completa incluindo magic bytes.
 */
export function validateImageMetadata(
  file: File | null | undefined,
  options: ImageValidationOptions = {}
): FileValidationResult {
  const { maxBytes = DEFAULT_MAX_BYTES } = options;

  if (!file) {
    return { ok: false, error: 'Nenhum arquivo selecionado.' };
  }
  if (file.size <= 0) {
    return { ok: false, error: 'Arquivo vazio.' };
  }
  if (file.size > maxBytes) {
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `Arquivo excede o limite de ${limitMb} MB.` };
  }
  if (!ALLOWED_IMAGE_MIMES.has(file.type)) {
    return { ok: false, error: 'Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF.' };
  }

  const extension = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return { ok: false, error: 'Extensão de arquivo não permitida.' };
  }

  // Bloqueia nomes de arquivo com path traversal ou caracteres perigosos.
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F<>:"/\\|?*]/.test(file.name) || file.name.includes('..')) {
    return { ok: false, error: 'Nome de arquivo inválido.' };
  }

  return { ok: true };
}

/**
 * Validação completa: metadata + magic bytes. Retorna Promise pois precisa
 * ler os primeiros bytes do arquivo.
 */
export async function validateImageFile(
  file: File | null | undefined,
  options: ImageValidationOptions = {}
): Promise<FileValidationResult> {
  const meta = validateImageMetadata(file, options);
  if (!meta.ok) return meta;

  try {
    const head = new Uint8Array(await (file as File).slice(0, 12).arrayBuffer());
    if (!matchesImageSignature(head, (file as File).type)) {
      return { ok: false, error: 'Conteúdo do arquivo não corresponde ao tipo declarado.' };
    }
  } catch {
    return { ok: false, error: 'Não foi possível ler o arquivo.' };
  }

  return { ok: true };
}

function matchesImageSignature(bytes: Uint8Array, mime: string): boolean {
  if (bytes.length < 4) return false;

  // JPEG: FF D8 FF
  if (mime === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mime === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  // GIF: "GIF87a" ou "GIF89a"
  if (mime === 'image/gif') {
    return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  }
  // WEBP: "RIFF"...."WEBP"
  if (mime === 'image/webp') {
    return (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    );
  }
  return false;
}

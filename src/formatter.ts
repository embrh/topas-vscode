import * as vscode from 'vscode';

// ─────────────────────────────────────────────────────────────────────────────
//  TOPAS Document Formatter
//  Aligns '=' signs per block of consecutive parameter lines.
//  Preserves comments and blank lines.
// ─────────────────────────────────────────────────────────────────────────────

interface Line {
  original: string;
  kind: 'blank' | 'comment' | 'param' | 'include' | 'other';
  prefix?: string;   // type:path part
  value?: string;    // everything after '='
  indent?: string;
}

function classifyLine(raw: string): Line {
  const trimmed = raw.trim();
  if (trimmed === '') return { original: raw, kind: 'blank' };
  if (trimmed.startsWith('#')) return { original: raw, kind: 'comment' };
  if (/^includeFile\s*=/i.test(trimmed)) return { original: raw, kind: 'include' };
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0 && /^[bidus]v?c?:/i.test(trimmed)) {
    const prefix = trimmed.slice(0, eqIdx).trimEnd();
    const value  = trimmed.slice(eqIdx + 1).trimStart();
    return { original: raw, kind: 'param', prefix, value };
  }
  return { original: raw, kind: 'other' };
}

function formatBlock(lines: Line[]): string[] {
  const params = lines.filter(l => l.kind === 'param');
  if (params.length === 0) return lines.map(l => l.original);

  // Find the longest prefix in this block
  const maxLen = Math.max(...params.map(l => l.prefix!.length));
  // Round up to the next multiple of 4 for nicer alignment
  const target = maxLen + 1;

  return lines.map(l => {
    if (l.kind !== 'param') return l.original;
    const pad = ' '.repeat(Math.max(1, target - l.prefix!.length));
    return `${l.prefix}${pad}= ${l.value}`;
  });
}

export function formatTopasDocument(
  document: vscode.TextDocument
): vscode.TextEdit[] {
  const cfg = vscode.workspace.getConfiguration('topas');
  const align = cfg.get<boolean>('alignEquals', true);

  const rawLines = document.getText().split('\n');
  const classified = rawLines.map(classifyLine);

  if (!align) {
    // Just normalise spacing around '=' and trim trailing whitespace
    const simple = classified.map(l => {
      if (l.kind !== 'param') return l.original.trimEnd();
      return `${l.prefix} = ${l.value}`.trimEnd();
    });
    const result = simple.join('\n');
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    return [vscode.TextEdit.replace(fullRange, result)];
  }

  // Split into blocks separated by blank lines or section comments
  const blocks: Line[][] = [];
  let current: Line[] = [];

  for (const line of classified) {
    if (line.kind === 'blank' || (line.kind === 'comment' && /#{4,}|={4,}|-{4,}/.test(line.original))) {
      if (current.length > 0) { blocks.push(current); current = []; }
      blocks.push([line]);
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  const output = blocks.flatMap(b => formatBlock(b)).map(l => l.trimEnd());
  const result = output.join('\n');
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
  );
  return [vscode.TextEdit.replace(fullRange, result)];
}

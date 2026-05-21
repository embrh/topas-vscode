import * as vscode from 'vscode';

// ─────────────────────────────────────────────────────────────────────────────
//  TOPAS Formatter
//  • Aligns '=' per block of consecutive parameter lines
//  • Normalises section/subsection headers (====/---- separators + centred title)
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_WIDTH    = 70;   // width of  # ====...====
const SUBSECTION_WIDTH = 50;   // width of  # ----...----

function makeSep(char: string, width: number): string {
  return '# ' + char.repeat(width);
}

/** Centre text inside a separator line: "# " + text padded to width */
function makeTitleLine(text: string, width: number): string {
  const inner = text.trim();
  if (inner.length >= width) return `# ${inner}`;
  const totalPad = width - inner.length;
  const left  = Math.floor(totalPad / 2);
  const right = totalPad - left;
  return '# ' + ' '.repeat(left) + inner + ' '.repeat(right);
}

interface ParsedLine {
  raw: string;
  kind: 'blank' | 'section_sep' | 'subsection_sep' | 'section_title'
        | 'subsection_title' | 'comment' | 'param' | 'include' | 'other';
  prefix?: string;
  value?: string;
}

function classify(raw: string): ParsedLine {
  const t = raw.trim();
  if (t === '') return { raw, kind: 'blank' };
  if (t.startsWith('#')) {
    const inner = t.slice(1).trim();
    if (/^={4,}/.test(inner)) return { raw, kind: 'section_sep' };
    if (/^-{4,}/.test(inner)) return { raw, kind: 'subsection_sep' };
    // Could be a title between separators — we'll decide during block scanning
    return { raw, kind: 'comment' };
  }
  if (/^includeFile\s*=/i.test(t)) return { raw, kind: 'include' };
  const eqIdx = t.indexOf('=');
  if (eqIdx > 0 && /^[bidus]v?c?:/i.test(t)) {
    const prefix = t.slice(0, eqIdx).trimEnd();
    const value  = t.slice(eqIdx + 1).trimStart();
    return { raw, kind: 'param', prefix, value };
  }
  return { raw, kind: 'other' };
}

// ── Header normalisation ──────────────────────────────────────────────────────
// Scans through all lines and rewrites section/subsection header triplets.
// Pattern: sep, title-comment, sep  → normalised form
function normaliseHeaders(lines: ParsedLine[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const cur = lines[i];
    if (cur.kind === 'section_sep' || cur.kind === 'subsection_sep') {
      const isSection = cur.kind === 'section_sep';
      const width = isSection ? SECTION_WIDTH : SUBSECTION_WIDTH;
      const ch    = isSection ? '=' : '-';
      const sep   = makeSep(ch, width);

      // Look ahead for optional blank + title comment + sep
      let j = i + 1;
      // skip blanks between sep and title
      while (j < lines.length && lines[j].kind === 'blank') j++;
      // check if next non-blank is a plain comment (the title)
      const titleLine = (j < lines.length && lines[j].kind === 'comment') ? lines[j] : null;
      let nextSepIdx = titleLine ? j + 1 : i + 1;
      while (nextSepIdx < lines.length && lines[nextSepIdx].kind === 'blank') nextSepIdx++;
      const nextSep = (nextSepIdx < lines.length &&
        (lines[nextSepIdx].kind === 'section_sep' || lines[nextSepIdx].kind === 'subsection_sep'))
        ? lines[nextSepIdx] : null;

      if (titleLine && nextSep) {
        // Normalise the whole triplet
        const titleText = titleLine.raw.trim().slice(1).trim(); // strip leading '#'
        out.push(sep);
        out.push(makeTitleLine(titleText, width));
        out.push(sep);
        i = nextSepIdx + 1;
        continue;
      }
      // Lone separator — just normalise its length
      out.push(sep);
      i++;
      continue;
    }
    out.push(cur.raw.trimEnd());
    i++;
  }
  return out;
}

// ── Equal-sign alignment ──────────────────────────────────────────────────────
function alignBlock(lines: ParsedLine[]): string[] {
  const params = lines.filter(l => l.kind === 'param');
  if (params.length === 0) return lines.map(l => l.raw.trimEnd());
  const maxLen = Math.max(...params.map(l => l.prefix!.length));
  return lines.map(l => {
    if (l.kind !== 'param') return l.raw.trimEnd();
    const pad = ' '.repeat(Math.max(1, maxLen - l.prefix!.length + 1));
    return `${l.prefix}${pad}= ${l.value}`.trimEnd();
  });
}

// ── Main export ───────────────────────────────────────────────────────────────
export function formatTopasDocument(
  document: vscode.TextDocument
): vscode.TextEdit[] {
  const cfg = vscode.workspace.getConfiguration('topas');
  const alignEq = cfg.get<boolean>('alignEquals', true);

  const rawLines  = document.getText().split('\n');
  const classified = rawLines.map(classify);

  // Step 1: normalise headers
  const afterHeaders = normaliseHeaders(classified);

  if (!alignEq) {
    // Only clean up equals spacing
    const simple = afterHeaders.map((line, idx) => {
      const cl = classified[idx] ?? { kind: 'other' };
      if (cl.kind === 'param') return `${cl.prefix} = ${cl.value}`.trimEnd();
      return line.trimEnd();
    });
    return [fullReplace(document, simple.join('\n'))];
  }

  // Step 2: align '=' in blocks
  // Re-classify after header normalisation
  const reclassified = afterHeaders.map(classify);
  const blocks: ParsedLine[][] = [];
  let cur: ParsedLine[] = [];

  const isSeparator = (l: ParsedLine) =>
    l.kind === 'blank' || l.kind === 'section_sep' || l.kind === 'subsection_sep' ||
    (l.kind === 'comment' && /^#\s*[=\-]{4,}/.test(l.raw));

  for (const line of reclassified) {
    if (isSeparator(line)) {
      if (cur.length > 0) { blocks.push(cur); cur = []; }
      blocks.push([line]);
    } else {
      cur.push(line);
    }
  }
  if (cur.length > 0) blocks.push(cur);

  const output = blocks.flatMap(b => alignBlock(b));
  return [fullReplace(document, output.join('\n'))];
}

function fullReplace(doc: vscode.TextDocument, text: string): vscode.TextEdit {
  return vscode.TextEdit.replace(
    new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)),
    text
  );
}

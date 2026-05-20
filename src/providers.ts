import * as vscode from 'vscode';
import {
  TOPAS_PARAMS, PARAM_MAP, PARAMS_BY_NAMESPACE,
  UNIT_GROUPS, ALL_UNITS,
  PHYSICS_MODULES, PARTICLES, SCORER_QUANTITIES,
  TOPAS_COLORS, DRAWING_STYLES, GEOMETRY_TYPES, COMMON_MATERIALS,
  TopasParam,
} from './topasData';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a line like  d:Ge/MyBox/HLX = 10 cm  into its components. */
function parseLine(line: string) {
  const m = line.match(/^([bidus]v?c?):((?:[A-Za-z]+\/[\w/]+\/)([\w]+))\s*=\s*(.*)$/i);
  if (!m) return null;
  return { typePrefix: m[1], fullPath: m[2], lastName: m[3], value: m[4].trim() };
}

/** Normalise a path like  Ge/MyBox/HLX  →  Ge/{Name}/HLX */
function normalisePath(path: string): string {
  const parts = path.split('/');
  if (parts.length >= 3) {
    parts[1] = '{Name}';
    return parts.join('/');
  }
  return path;
}

/** Look up a param, trying both the exact path and the normalised pattern. */
function lookupParam(path: string): TopasParam | undefined {
  const exact = PARAM_MAP.get(path.toLowerCase());
  if (exact) return exact;
  return PARAM_MAP.get(normalisePath(path).toLowerCase());
}

/** Get the namespace from a path like  Ge/MyBox/HLX → Ge */
function getNamespace(path: string): string {
  return path.split('/')[0].toUpperCase();
}

/** Collect all component names defined in the document. */
function collectComponentNames(document: vscode.TextDocument): string[] {
  const names = new Set<string>();
  const re = /^[bidus]v?c?:(?:Ge|So|Sc|Ph|Ma|Gr|Ts|Vr|Tf)\/(\w+)\//i;
  for (let i = 0; i < document.lineCount; i++) {
    const m = document.lineAt(i).text.match(re);
    if (m) names.add(m[1]);
  }
  return [...names];
}

// ─────────────────────────────────────────────────────────────────────────────
//  Hover Provider
// ─────────────────────────────────────────────────────────────────────────────
export class TopasHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
    const line = document.lineAt(position).text;
    const parsed = parseLine(line);
    if (!parsed) return;

    const param = lookupParam(parsed.fullPath);

    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    // Header: path with coloured type prefix badge
    const ns = getNamespace(parsed.fullPath);
    const typeLabel = parsed.typePrefix.toLowerCase();
    const typeDesc: Record<string, string> = {
      d:'double (with unit)', u:'unitless float', i:'integer',
      b:'boolean', s:'string',
      dv:'double vector', uv:'unitless vector', iv:'integer vector',
      sv:'string vector', bv:'boolean vector',
    };
    const humanType = typeDesc[typeLabel] ?? typeLabel;

    md.appendMarkdown(`### \`${parsed.fullPath}\`\n`);
    md.appendMarkdown(`**Type:** \`${typeLabel}:\` — ${humanType}\n\n`);

    if (param) {
      md.appendMarkdown(`${param.description}\n\n`);
      if (param.units) {
        const units = UNIT_GROUPS[param.units];
        if (units) md.appendMarkdown(`**Units:** ${units.join(', ')}\n\n`);
      }
      if (param.defaultValue) {
        md.appendMarkdown(`**Default:** \`${param.defaultValue}\`\n\n`);
      }
      if (param.allowedValues?.length) {
        const vals = param.allowedValues.slice(0, 12).map(v => `\`${v}\``).join(', ');
        const more = param.allowedValues.length > 12 ? ', …' : '';
        md.appendMarkdown(`**Allowed values:** ${vals}${more}\n\n`);
      }
    } else {
      md.appendMarkdown(`*No documentation found for this parameter.*\n\n`);
    }

    md.appendMarkdown(`**Namespace:** \`${ns}/\``);
    return new vscode.Hover(md);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Completion Provider
// ─────────────────────────────────────────────────────────────────────────────
export class TopasCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const lineText = document.lineAt(position).text.substring(0, position.character);
    const items: vscode.CompletionItem[] = [];

    // ── After '=' → suggest values ─────────────────────────────────────────
    const eqMatch = lineText.match(/^([bidus]v?c?):([\w/]+)\s*=\s*(.*)$/i);
    if (eqMatch) {
      const [, , path, soFar] = eqMatch;
      const param = lookupParam(path);

      // Suggest allowed values
      if (param?.allowedValues) {
        for (const val of param.allowedValues) {
          const item = new vscode.CompletionItem(`"${val}"`, vscode.CompletionItemKind.EnumMember);
          item.insertText = `"${val}"`;
          item.detail = `${path}`;
          items.push(item);
        }
        if (items.length) return items;
      }

      // Suggest booleans for b: parameters
      if (eqMatch[1].toLowerCase().startsWith('b')) {
        for (const v of ['"True"', '"False"']) {
          const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Keyword);
          items.push(item);
        }
        return items;
      }

      // Suggest common materials for Material params
      if (/material/i.test(path)) {
        for (const m of COMMON_MATERIALS) {
          const item = new vscode.CompletionItem(`"${m}"`, vscode.CompletionItemKind.Color);
          item.insertText = `"${m}"`;
          item.detail = 'material';
          items.push(item);
        }
        return items;
      }

      // Suggest component names for Parent/Component params
      if (/parent|component/i.test(path)) {
        const names = collectComponentNames(document);
        for (const name of names) {
          const item = new vscode.CompletionItem(`"${name}"`, vscode.CompletionItemKind.Reference);
          item.insertText = `"${name}"`;
          items.push(item);
        }
        return items;
      }

      // Suggest physics modules
      if (/modules/i.test(path)) {
        for (const mod of PHYSICS_MODULES) {
          const item = new vscode.CompletionItem(`"${mod}"`, vscode.CompletionItemKind.Module);
          item.insertText = `"${mod}"`;
          items.push(item);
        }
        return items;
      }

      // Suggest units based on context
      const unitHint = param?.units;
      const suggestUnits = unitHint ? (UNIT_GROUPS[unitHint] ?? ALL_UNITS) : ALL_UNITS;
      for (const u of suggestUnits) {
        const item = new vscode.CompletionItem(u, vscode.CompletionItemKind.Unit);
        item.detail = 'unit';
        items.push(item);
      }
      return items;
    }

    // ── Type prefix completion at line start ────────────────────────────────
    if (/^\s*$/.test(lineText) || /^\s*[bidus]?$/.test(lineText)) {
      for (const pfx of ['d:', 'u:', 'i:', 'b:', 's:', 'dv:', 'uv:', 'iv:', 'sv:', 'bv:']) {
        const item = new vscode.CompletionItem(pfx, vscode.CompletionItemKind.Keyword);
        item.detail = 'TOPAS type prefix';
        items.push(item);
      }
    }

    // ── Namespace completion after type prefix ──────────────────────────────
    const nsMatch = lineText.match(/^[bidus]v?c?:([A-Z]*)$/i);
    if (nsMatch) {
      for (const ns of ['Ge', 'So', 'Sc', 'Ph', 'Ma', 'Gr', 'Ts', 'Vr', 'Tf']) {
        const item = new vscode.CompletionItem(ns + '/', vscode.CompletionItemKind.Module);
        item.detail = `${ns}/ namespace`;
        items.push(item);
      }
      return items;
    }

    // ── Path completion after Ge/ComponentName/ ─────────────────────────────
    const pathMatch = lineText.match(/^([bidus]v?c?):(([A-Za-z]+)\/(\w+)\/)(\w*)$/i);
    if (pathMatch) {
      const ns = pathMatch[3].toUpperCase();
      const nsParams = PARAMS_BY_NAMESPACE.get(ns) ?? [];
      for (const p of nsParams) {
        const leafName = p.key.split('/').pop()!;
        const item = new vscode.CompletionItem(leafName, vscode.CompletionItemKind.Property);
        item.detail = p.description.slice(0, 60);
        item.documentation = new vscode.MarkdownString(p.description);
        if (p.defaultValue) item.documentation.appendMarkdown(`\n\n**Default:** \`${p.defaultValue}\``);
        if (p.units) item.documentation.appendMarkdown(`\n\n**Units:** ${p.units}`);
        items.push(item);
      }
    }

    return items;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Folding Range Provider
// ─────────────────────────────────────────────────────────────────────────────
export class TopasFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
    const ranges: vscode.FoldingRange[] = [];
    const sectionStarts: number[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const text = document.lineAt(i).text;
      // Major section: lines of ====
      if (/^#\s*={4,}/.test(text)) {
        if (sectionStarts.length > 0) {
          const start = sectionStarts.pop()!;
          if (i - 1 > start) {
            ranges.push(new vscode.FoldingRange(start, i - 1, vscode.FoldingRangeKind.Region));
          }
        }
        sectionStarts.push(i);
      }
    }

    // Close any open section at document end
    for (const start of sectionStarts) {
      const end = document.lineCount - 1;
      if (end > start) {
        ranges.push(new vscode.FoldingRange(start, end, vscode.FoldingRangeKind.Region));
      }
    }

    return ranges;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Document Symbol Provider  (Outline)
// ─────────────────────────────────────────────────────────────────────────────
export class TopasSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    // Collect all component names grouped by namespace
    const nsMap = new Map<string, Map<string, { firstLine: number; lastLine: number }>>();
    const NS_ICONS: Record<string, vscode.SymbolKind> = {
      Ge: vscode.SymbolKind.Struct,
      So: vscode.SymbolKind.Event,
      Sc: vscode.SymbolKind.Interface,
      Ph: vscode.SymbolKind.Module,
      Ma: vscode.SymbolKind.Object,
      Gr: vscode.SymbolKind.Namespace,
      Ts: vscode.SymbolKind.Property,
      Vr: vscode.SymbolKind.TypeParameter,
    };

    const pathRe = /^[bidus]v?c?:([A-Za-z]+)\/(\w+)\//i;
    for (let i = 0; i < document.lineCount; i++) {
      const m = document.lineAt(i).text.match(pathRe);
      if (!m) continue;
      const ns  = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      const comp = m[2];
      if (!nsMap.has(ns)) nsMap.set(ns, new Map());
      const compMap = nsMap.get(ns)!;
      if (!compMap.has(comp)) compMap.set(comp, { firstLine: i, lastLine: i });
      else compMap.get(comp)!.lastLine = i;
    }

    const symbols: vscode.DocumentSymbol[] = [];
    for (const [ns, comps] of nsMap) {
      const nsSymbol = new vscode.DocumentSymbol(
        `${ns}/`,
        '',
        NS_ICONS[ns] ?? vscode.SymbolKind.Namespace,
        new vscode.Range(0, 0, document.lineCount - 1, 0),
        new vscode.Range(0, 0, 0, 0),
      );
      for (const [comp, range] of comps) {
        const sym = new vscode.DocumentSymbol(
          comp,
          ns,
          NS_ICONS[ns] ?? vscode.SymbolKind.Variable,
          new vscode.Range(range.firstLine, 0, range.lastLine, 1000),
          new vscode.Range(range.firstLine, 0, range.firstLine, 100),
        );
        nsSymbol.children.push(sym);
      }
      symbols.push(nsSymbol);
    }
    return symbols;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Diagnostic Provider  (error / warning detection)
// ─────────────────────────────────────────────────────────────────────────────
export class TopasDiagnosticProvider {
  private collection: vscode.DiagnosticCollection;

  constructor(context: vscode.ExtensionContext) {
    this.collection = vscode.languages.createDiagnosticCollection('topas');
    context.subscriptions.push(this.collection);
  }

  update(document: vscode.TextDocument): void {
    if (document.languageId !== 'topas') return;
    const diagnostics: vscode.Diagnostic[] = [];
    const defined = new Set<string>();

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const text = line.text.trim();
      if (!text || text.startsWith('#')) continue;
      const parsed = parseLine(text);
      if (!parsed) continue;

      const { typePrefix, fullPath, value } = parsed;
      defined.add(fullPath.toLowerCase());

      // ── Check: unknown parameter ─────────────────────────────────────────
      const known = lookupParam(fullPath);
      if (!known) {
        // Only warn for known namespaces
        const ns = getNamespace(fullPath);
        if (['GE','SO','SC','PH','MA','GR','TS','VR'].includes(ns)) {
          diagnostics.push(new vscode.Diagnostic(
            line.range,
            `Unknown TOPAS parameter: '${fullPath}'. Check spelling or refer to TOPAS docs.`,
            vscode.DiagnosticSeverity.Warning,
          ));
        }
        continue;
      }

      // ── Check: wrong type prefix ─────────────────────────────────────────
      const expectedType = known.type.charAt(0);
      const actualType   = typePrefix.toLowerCase().charAt(0);
      if (actualType !== expectedType && !['c'].includes(actualType)) {
        diagnostics.push(new vscode.Diagnostic(
          line.range,
          `Type mismatch: '${fullPath}' expects type '${known.type}:' but got '${typePrefix}:'.`,
          vscode.DiagnosticSeverity.Error,
        ));
      }

      // ── Check: unit on a unitless/boolean/string/integer parameter ────────
      const hasUnit = ALL_UNITS.some(u => value.endsWith(' ' + u));
      if (hasUnit && ['u','i','b','s'].includes(known.type.charAt(0))) {
        diagnostics.push(new vscode.Diagnostic(
          line.range,
          `Parameter '${fullPath}' (type '${known.type}:') should not have physical units.`,
          vscode.DiagnosticSeverity.Warning,
        ));
      }

      // ── Check: EMRangeMax < 600 MeV ───────────────────────────────────────
      if (/EMRangeMax/i.test(fullPath)) {
        const valMatch = value.match(/([\d.]+)\s*MeV/i);
        if (valMatch && parseFloat(valMatch[1]) < 600) {
          diagnostics.push(new vscode.Diagnostic(
            line.range,
            `Ph/…/EMRangeMax is ${valMatch[1]} MeV, but TOPAS 4.x requires a minimum of 600 MeV.`,
            vscode.DiagnosticSeverity.Error,
          ));
        }
      }

      // ── Check: XBins/YBins/ZBins on Ge/ — warn if might have children ─────
      if (/^Ge\//i.test(fullPath) && /[XYZ]Bins/i.test(fullPath)) {
        diagnostics.push(new vscode.Diagnostic(
          line.range,
          `Geometry bins set on '${fullPath.split('/')[1]}'. TOPAS forbids child volumes inside binned components. Consider moving bins to the scorer instead.`,
          vscode.DiagnosticSeverity.Information,
        ));
      }
    }

    this.collection.set(document.uri, diagnostics);
  }

  dispose(): void {
    this.collection.dispose();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Auto-detection  — switches a .txt file to TOPAS language if content matches
// ─────────────────────────────────────────────────────────────────────────────
const TOPAS_PATTERNS = [
  /^[bidus]v?c?:(Ge|So|Sc|Ph|Ts|Gr|Ma|Vr)\//im,
  /^includeFile\s*=/im,
  /^sv:Ph\/\w+\/Modules/im,
];

export function isLikelyTopas(text: string): boolean {
  return TOPAS_PATTERNS.some(p => p.test(text));
}

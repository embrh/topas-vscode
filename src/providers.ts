import * as vscode from 'vscode';
import {
  TOPAS_PARAMS, PARAM_MAP, PARAMS_BY_NAMESPACE,
  UNIT_GROUPS, ALL_UNITS,
  PHYSICS_MODULES, PARTICLES, SCORER_QUANTITIES,
  TOPAS_COLORS, DRAWING_STYLES, GEOMETRY_TYPES, COMMON_MATERIALS,
  NS_DEFAULT_COMPONENTS,
  TopasParam,
} from './topasData';

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseLine(line: string) {
  const m = line.match(/^\s*([bidus]v?c?):((?:[A-Za-z]+\/[\w/]+\/)([\w]+))\s*=\s*(.*)$/i);
  if (!m) return null;
  return { typePrefix: m[1], fullPath: m[2], lastName: m[3], value: m[4].trim() };
}

/** Ge/MyBox/HLX  →  Ge/{Name}/HLX */
function normalisePath(path: string): string {
  const parts = path.split('/');
  if (parts.length >= 3) { parts[1] = '{Name}'; return parts.join('/'); }
  return path;
}

function lookupParam(path: string): TopasParam | undefined {
  return PARAM_MAP.get(path.toLowerCase())
      ?? PARAM_MAP.get(normalisePath(path).toLowerCase());
}

/** "GE" → "Ge", "PH" → "Ph", etc. */
function fmtNs(ns: string): string {
  if (!ns) return ns;
  return ns.charAt(0).toUpperCase() + ns.slice(1).toLowerCase();
}

function getNamespace(path: string): string {
  return path.split('/')[0].toUpperCase();
}

/** Collect all component names defined in the document for namespace ns. */
function collectComponents(document: vscode.TextDocument, ns: string): string[] {
  const names = new Set<string>();
  const re = new RegExp(`^[bidus]v?c?:${ns}\\/(\\w+)\\/`, 'im');
  for (let i = 0; i < document.lineCount; i++) {
    const m = document.lineAt(i).text.match(re);
    if (m) names.add(m[1]);
  }
  return [...names];
}

/** All components across all namespaces (for Parent/Component suggestions). */
function collectAllComponents(document: vscode.TextDocument): string[] {
  const names = new Set<string>();
  const re = /^[bidus]v?c?:(?:Ge|So|Sc|Ph|Ma|Gr|Ts|Vr|Tf)\/(\w+)\//im;
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
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const line = document.lineAt(position).text;
    const parsed = parseLine(line);
    if (!parsed) return;

    const param = lookupParam(parsed.fullPath);
    const typeLabel = parsed.typePrefix.toLowerCase();
    const typeDesc: Record<string, string> = {
      d:'double (with unit)', u:'unitless float', i:'integer',
      b:'boolean', s:'string',
      dv:'double vector', uv:'unitless vector', iv:'integer vector',
      sv:'string vector', bv:'boolean vector',
    };

    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    md.appendMarkdown(`### \`${parsed.fullPath}\`\n\n`);
    md.appendMarkdown(`**Type:** \`${typeLabel}:\` — ${typeDesc[typeLabel] ?? typeLabel}\n\n`);

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
      md.appendMarkdown(`*No documentation available for this parameter.*\n\n`);
    }

    // Namespace with correct capitalisation: Ge/, Ph/, etc.
    const ns = fmtNs(getNamespace(parsed.fullPath));
    md.appendMarkdown(`**Namespace:** \`${ns}/\``);
    return new vscode.Hover(md);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Completion Provider
//  Stages:
//   1. After '='                → suggest values
//   2. Type prefix only         → suggest Ns/
//   3. Ns/                      → suggest component names
//   4. Ns/Comp/                 → suggest parameter leaf names
// ─────────────────────────────────────────────────────────────────────────────
export class TopasCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const lineText = document.lineAt(position).text.substring(0, position.character);

    // ── Stage 1: value completion (after '=') ─────────────────────────────
    const eqMatch = lineText.match(/^([bidus]v?c?):([\w/]+)\s*=\s*(.*)$/i);
    if (eqMatch) {
      return this.valueCompletions(eqMatch[1], eqMatch[2], document);
    }

    // ── Stage 2: type prefix at line start ────────────────────────────────
    if (/^\s*[bidus]?v?c?$/.test(lineText.trim())) {
      return ['d:','u:','i:','b:','s:','dv:','uv:','iv:','sv:','bv:'].map(p => {
        const it = new vscode.CompletionItem(p, vscode.CompletionItemKind.Keyword);
        it.detail = 'TOPAS type prefix';
        return it;
      });
    }

    // ── Stage 3: namespace completion (after "d:") ─────────────────────────
    const nsMatch = lineText.match(/^[bidus]v?c?:([A-Z]{0,2})$/i);
    if (nsMatch) {
      return ['Ge','So','Sc','Ph','Ma','Gr','Ts','Vr','Tf'].map(ns => {
        const it = new vscode.CompletionItem(ns + '/', vscode.CompletionItemKind.Module);
        it.detail = `${ns}/ namespace`;
        it.insertText = ns + '/';
        return it;
      });
    }

    // ── Stage 4: component name after Ns/ ────────────────────────────────
    const compMatch = lineText.match(/^([bidus]v?c?):([A-Za-z]+)\/(\w*)$/i);
    if (compMatch) {
      const ns = compMatch[2];
      const typed = compMatch[3];
      const fromDoc = collectComponents(document, ns);
      const defaults = NS_DEFAULT_COMPONENTS[ns.charAt(0).toUpperCase() + ns.slice(1).toLowerCase()] ?? [];
      const all = [...new Set([...fromDoc, ...defaults])];
      return all
        .filter(n => n.toLowerCase().startsWith(typed.toLowerCase()))
        .map(name => {
          const it = new vscode.CompletionItem(name + '/', vscode.CompletionItemKind.Variable);
          it.detail = `${ns}/ component`;
          it.insertText = name + '/';
          return it;
        });
    }

    // ── Stage 5: parameter leaf name after Ns/Comp/ ───────────────────────
    const leafMatch = lineText.match(/^([bidus]v?c?):([A-Za-z]+\/\w+\/)(\w*)$/i);
    if (leafMatch) {
      const ns = leafMatch[2].split('/')[0].toUpperCase();
      const typed = leafMatch[3];
      const nsParams = PARAMS_BY_NAMESPACE.get(ns) ?? [];
      return nsParams
        .filter(p => {
          const leaf = p.key.split('/').pop()!;
          return leaf.toLowerCase().startsWith(typed.toLowerCase());
        })
        .map(p => {
          const leaf = p.key.split('/').pop()!;
          const it = new vscode.CompletionItem(leaf, vscode.CompletionItemKind.Property);
          it.detail = p.type + ': ' + p.description.slice(0, 55);
          it.documentation = new vscode.MarkdownString(p.description
            + (p.defaultValue ? `\n\n**Default:** \`${p.defaultValue}\`` : '')
            + (p.units ? `\n\n**Units:** ${p.units}` : ''));
          return it;
        });
    }

    return [];
  }

  private valueCompletions(
    prefix: string,
    path: string,
    document: vscode.TextDocument
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    const param = lookupParam(path);

    // Explicit allowed values
    if (param?.allowedValues?.length) {
      for (const v of param.allowedValues) {
        const it = new vscode.CompletionItem(`"${v}"`, vscode.CompletionItemKind.EnumMember);
        it.insertText = `"${v}"`;
        items.push(it);
      }
      return items;
    }

    // Boolean
    if (prefix.toLowerCase().startsWith('b')) {
      return ['"True"', '"False"'].map(v => {
        const it = new vscode.CompletionItem(v, vscode.CompletionItemKind.Keyword);
        return it;
      });
    }

    // Material
    if (/material|activematerial/i.test(path)) {
      return COMMON_MATERIALS.map(m => {
        const it = new vscode.CompletionItem(`"${m}"`, vscode.CompletionItemKind.Color);
        it.insertText = `"${m}"`;
        return it;
      });
    }

    // Parent / Component → names in document
    if (/parent|component/i.test(path)) {
      const names = collectAllComponents(document);
      if (!names.includes('World')) names.unshift('World');
      return names.map(n => {
        const it = new vscode.CompletionItem(`"${n}"`, vscode.CompletionItemKind.Reference);
        it.insertText = `"${n}"`;
        return it;
      });
    }

    // Physics modules
    if (/modules/i.test(path)) {
      return PHYSICS_MODULES.map(m => {
        const it = new vscode.CompletionItem(`"${m}"`, vscode.CompletionItemKind.Module);
        it.insertText = `"${m}"`;
        return it;
      });
    }

    // Unit suggestions based on context
    const unitHint = param?.units;
    const units = unitHint ? (UNIT_GROUPS[unitHint] ?? ALL_UNITS) : ALL_UNITS;
    return units.map(u => {
      const it = new vscode.CompletionItem(u, vscode.CompletionItemKind.Unit);
      it.detail = 'unit';
      return it;
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Folding Range Provider
// ─────────────────────────────────────────────────────────────────────────────
export class TopasFoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
    const ranges: vscode.FoldingRange[] = [];
    const stack: number[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      if (/^#\s*={4,}/.test(document.lineAt(i).text)) {
        if (stack.length > 0) {
          const start = stack.pop()!;
          if (i - 1 > start)
            ranges.push(new vscode.FoldingRange(start, i - 1, vscode.FoldingRangeKind.Region));
        }
        stack.push(i);
      }
    }
    for (const start of stack) {
      const end = document.lineCount - 1;
      if (end > start)
        ranges.push(new vscode.FoldingRange(start, end, vscode.FoldingRangeKind.Region));
    }
    return ranges;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Document Symbol Provider  (Outline)
// ─────────────────────────────────────────────────────────────────────────────
export class TopasSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    const NS_ICONS: Record<string, vscode.SymbolKind> = {
      Ge: vscode.SymbolKind.Struct, So: vscode.SymbolKind.Event,
      Sc: vscode.SymbolKind.Interface, Ph: vscode.SymbolKind.Module,
      Ma: vscode.SymbolKind.Object, Gr: vscode.SymbolKind.Namespace,
      Ts: vscode.SymbolKind.Property, Vr: vscode.SymbolKind.TypeParameter,
      Tf: vscode.SymbolKind.Function,
    };

    const nsMap = new Map<string, Map<string, { first: number; last: number }>>();
    const pathRe = /^[bidus]v?c?:([A-Za-z]+)\/(\w+)\//i;

    for (let i = 0; i < document.lineCount; i++) {
      const m = document.lineAt(i).text.match(pathRe);
      if (!m) continue;
      const ns   = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      const comp = m[2];
      if (!nsMap.has(ns)) nsMap.set(ns, new Map());
      const cm = nsMap.get(ns)!;
      if (!cm.has(comp)) cm.set(comp, { first: i, last: i });
      else cm.get(comp)!.last = i;
    }

    return [...nsMap.entries()].map(([ns, comps]) => {
      const nsSymbol = new vscode.DocumentSymbol(
        `${fmtNs(ns)}/`, '', NS_ICONS[ns] ?? vscode.SymbolKind.Namespace,
        new vscode.Range(0, 0, document.lineCount - 1, 0),
        new vscode.Range(0, 0, 0, 0),
      );
      nsSymbol.children = [...comps.entries()].map(([comp, r]) =>
        new vscode.DocumentSymbol(
          comp, ns,
          NS_ICONS[ns] ?? vscode.SymbolKind.Variable,
          new vscode.Range(r.first, 0, r.last, 1000),
          new vscode.Range(r.first, 0, r.first, 100),
        )
      );
      return nsSymbol;
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Diagnostic Provider
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

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const text = line.text.trim();
      if (!text || text.startsWith('#')) continue;
      const parsed = parseLine(text);
      if (!parsed) continue;
      const { typePrefix, fullPath, value } = parsed;

      const known = lookupParam(fullPath);

      // Unknown parameter (only warn for recognised namespaces)
      if (!known) {
        const ns = getNamespace(fullPath);
        if (['GE','SO','SC','PH','MA','GR','TS','VR','TF'].includes(ns)) {
          diagnostics.push(new vscode.Diagnostic(
            line.range,
            `Unknown TOPAS parameter: '${fullPath}'.`,
            vscode.DiagnosticSeverity.Warning,
          ));
        }
        continue;
      }

      // Type prefix mismatch (ignore 'c' suffix variants)
      const exp = known.type.charAt(0);
      const act = typePrefix.toLowerCase().replace(/c$/, '').charAt(0);
      if (act !== exp) {
        diagnostics.push(new vscode.Diagnostic(
          line.range,
          `Type mismatch: '${fullPath}' expects type '${known.type}:' but found '${typePrefix}:'.`,
          vscode.DiagnosticSeverity.Error,
        ));
      }

      // Unit on unitless/bool/string/int parameter
      const hasUnit = ALL_UNITS.some(u => value.endsWith(' ' + u));
      if (hasUnit && ['u','i','b','s'].includes(exp)) {
        diagnostics.push(new vscode.Diagnostic(
          line.range,
          `'${fullPath}' (type '${known.type}:') should not have a physical unit.`,
          vscode.DiagnosticSeverity.Warning,
        ));
      }

      // EMRangeMax < 600 MeV
      if (/EMRangeMax/i.test(fullPath)) {
        const vm = value.match(/([\d.]+)\s*MeV/i);
        if (vm && parseFloat(vm[1]) < 600) {
          diagnostics.push(new vscode.Diagnostic(
            line.range,
            `Ph/…/EMRangeMax = ${vm[1]} MeV — TOPAS 4.x requires ≥ 600 MeV.`,
            vscode.DiagnosticSeverity.Error,
          ));
        }
      }

      // Bins on Ge/ (informational)
      if (/^Ge\//i.test(fullPath) && /[XYZ]Bins/i.test(fullPath)) {
        diagnostics.push(new vscode.Diagnostic(
          line.range,
          `Geometry bins on '${fullPath.split('/')[1]}'. If this volume has children, move bins to the scorer instead.`,
          vscode.DiagnosticSeverity.Information,
        ));
      }
    }

    this.collection.set(document.uri, diagnostics);
  }

  dispose(): void { this.collection.dispose(); }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Auto-detection
// ─────────────────────────────────────────────────────────────────────────────
const TOPAS_PATTERNS = [
  /^[bidus]v?c?:(Ge|So|Sc|Ph|Ts|Gr|Ma|Vr|Tf)\//im,
  /^includeFile\s*=/im,
  /^sv:Ph\/\w+\/Modules/im,
];
export function isLikelyTopas(text: string): boolean {
  return TOPAS_PATTERNS.some(p => p.test(text));
}

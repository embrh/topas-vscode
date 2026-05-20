import * as vscode from 'vscode';
import * as path from 'path';
import { formatTopasDocument } from './formatter';
import {
  TopasHoverProvider,
  TopasCompletionProvider,
  TopasFoldingProvider,
  TopasSymbolProvider,
  TopasDiagnosticProvider,
  isLikelyTopas,
} from './providers';

// ─────────────────────────────────────────────────────────────────────────────
//  Section / block insertion helpers
// ─────────────────────────────────────────────────────────────────────────────

const SEP80 = '#' + '='.repeat(80);
const SEP50 = '#' + '-'.repeat(50);

function insertAtCursor(text: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  editor.edit(eb => eb.insert(editor.selection.active, text));
}

function sectionHeader(title: string): string {
  const padded = ` ${title.toUpperCase()} `;
  return `\n${SEP80}\n#${padded.padStart(41 + padded.length / 2).padEnd(80)}\n${SEP80}\n`;
}

function subsectionHeader(title: string): string {
  const padded = `  ${title}  `;
  return `\n${SEP50}\n#${padded.padStart(26 + padded.length / 2).padEnd(50)}\n${SEP50}\n`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Run helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTopasExe(): string {
  return vscode.workspace.getConfiguration('topas').get<string>('executablePath', 'topas');
}

function runTopas(file: vscode.Uri, extraArgs: string[] = []) {
  const exe  = getTopasExe();
  const dir  = path.dirname(file.fsPath);
  const base = path.basename(file.fsPath);
  const terminal = vscode.window.createTerminal({ name: 'TOPAS', cwd: dir });
  terminal.show(false);
  terminal.sendText(`${exe} "${base}" ${extraArgs.join(' ')}`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Auto-detect TOPAS files
// ─────────────────────────────────────────────────────────────────────────────

async function trySetLanguage(document: vscode.TextDocument) {
  if (document.languageId === 'topas') return;
  if (document.languageId !== 'plaintext' && document.languageId !== 'text') return;
  if (!vscode.workspace.getConfiguration('topas').get<boolean>('autoDetect', true)) return;
  const text = document.getText(new vscode.Range(0, 0, Math.min(50, document.lineCount), 0));
  if (isLikelyTopas(text)) {
    await vscode.languages.setTextDocumentLanguage(document, 'topas');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Activation
// ─────────────────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = { language: 'topas' };

  // ── Language features ────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, new TopasHoverProvider()),
    vscode.languages.registerCompletionItemProvider(
      selector,
      new TopasCompletionProvider(),
      ':', '/', '=', '"', ' '
    ),
    vscode.languages.registerFoldingRangeProvider(selector, new TopasFoldingProvider()),
    vscode.languages.registerDocumentSymbolProvider(selector, new TopasSymbolProvider()),
    vscode.languages.registerDocumentFormattingEditProvider(selector, {
      provideDocumentFormattingEdits: formatTopasDocument,
    }),
  );

  // ── Diagnostics ──────────────────────────────────────────────────────────
  const diagProvider = new TopasDiagnosticProvider(context);

  const updateDiag = (doc: vscode.TextDocument) => diagProvider.update(doc);
  vscode.workspace.textDocuments.forEach(updateDiag);
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(updateDiag),
    vscode.workspace.onDidChangeTextDocument(e => updateDiag(e.document)),
    vscode.workspace.onDidSaveTextDocument(updateDiag),
  );

  // ── Auto-detect ──────────────────────────────────────────────────────────
  vscode.workspace.textDocuments.forEach(trySetLanguage);
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(trySetLanguage),
  );

  // ── Format on save ───────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.languageId !== 'topas') return;
      if (!vscode.workspace.getConfiguration('topas').get<boolean>('formatOnSave', false)) return;
      vscode.commands.executeCommand('editor.action.formatDocument');
    })
  );

  // ── Commands ─────────────────────────────────────────────────────────────

  // Run
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.run', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return vscode.window.showErrorMessage('No active TOPAS file.');
      editor.document.save().then(() => runTopas(editor.document.uri));
    }),
  );

  // Run with graphics (adds b:Ts/PauseBeforeQuit = "True" via a temp override or just sets UseQt)
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.runWithGraphics', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      // Create a tiny override file in the same directory
      const uri    = editor.document.uri;
      const dir    = path.dirname(uri.fsPath);
      const base   = path.basename(uri.fsPath);
      const ovFile = path.join(dir, '__topas_graphics_override__.txt');
      const content = `includeFile = ${base}\nb:Ts/PauseBeforeQuit = "True"\nb:Ts/UseQt = "True"\n`;
      const wsEdit = new vscode.WorkspaceEdit();
      wsEdit.createFile(vscode.Uri.file(ovFile), { overwrite: true });
      vscode.workspace.applyEdit(wsEdit).then(() => {
        vscode.workspace.openTextDocument(vscode.Uri.file(ovFile)).then(doc => {
          doc.save().then(() => {
            const exe = getTopasExe();
            const terminal = vscode.window.createTerminal({ name: 'TOPAS (viz)', cwd: dir });
            terminal.show(false);
            terminal.sendText(`${exe} "__topas_graphics_override__.txt"`);
          });
        });
      });
    }),
  );

  // Format
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.formatDocument', () =>
      vscode.commands.executeCommand('editor.action.formatDocument')
    ),
  );

  // Insert Section Header
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.insertSection', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Section name', placeHolder: 'GEOMETRY' });
      if (name) insertAtCursor(sectionHeader(name));
    }),
  );

  // Insert Subsection Header
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.insertSubsection', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Subsection name', placeHolder: 'Phantom' });
      if (name) insertAtCursor(subsectionHeader(name));
    }),
  );

  // Insert Geometry Block
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.insertGeometryBlock', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Component name', placeHolder: 'MyBox' });
      if (!name) return;
      const type = await vscode.window.showQuickPick(
        ['TsBox', 'TsSphere', 'TsCylinder', 'Group'],
        { placeHolder: 'Select geometry type' }
      );
      if (!type) return;
      const parent = await vscode.window.showInputBox({ prompt: 'Parent component', value: 'World' });

      let block = `\ns:Ge/${name}/Type     = "${type}"\ns:Ge/${name}/Parent   = "${parent ?? 'World'}"\ns:Ge/${name}/Material = "G4_WATER"\n`;
      if (type === 'TsBox') {
        block += `d:Ge/${name}/HLX      = 10.0 cm\nd:Ge/${name}/HLY      = 10.0 cm\nd:Ge/${name}/HLZ      = 10.0 cm\n`;
      } else if (type === 'TsSphere') {
        block += `d:Ge/${name}/RMin     = 0.0 cm\nd:Ge/${name}/RMax     = 5.0 cm\nd:Ge/${name}/SPhi     = 0. deg\nd:Ge/${name}/DPhi     = 360. deg\nd:Ge/${name}/STheta   = 0. deg\nd:Ge/${name}/DTheta   = 180. deg\n`;
      } else if (type === 'TsCylinder') {
        block += `d:Ge/${name}/RMin     = 0.0 cm\nd:Ge/${name}/RMax     = 5.0 cm\nd:Ge/${name}/HL       = 10.0 cm\nd:Ge/${name}/SPhi     = 0. deg\nd:Ge/${name}/DPhi     = 360. deg\n`;
      }
      block += `s:Ge/${name}/Color    = "blue"\n`;
      insertAtCursor(block);
    }),
  );

  // Insert Scoring Block
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.insertScoringBlock', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Scorer name', placeHolder: 'MyDose' });
      if (!name) return;
      const qty = await vscode.window.showQuickPick(
        ['DoseToMedium', 'DoseToWater', 'EnergyDeposit', 'Fluence', 'SurfaceTrackCount', 'PhaseSpace'],
        { placeHolder: 'Select quantity' }
      );
      if (!qty) return;
      const comp = await vscode.window.showInputBox({ prompt: 'Component to score in', placeHolder: 'MyPhantom' });
      insertAtCursor(
        `\ns:Sc/${name}/Quantity                  = "${qty}"\n` +
        `s:Sc/${name}/Component                 = "${comp ?? 'MyPhantom'}"\n` +
        `s:Sc/${name}/OutputFile                = "${name}"\n` +
        `s:Sc/${name}/OutputType                = "csv"\n` +
        `s:Sc/${name}/IfOutputFileAlreadyExists = "Overwrite"\n` +
        `b:Sc/${name}/OutputToConsole           = "True"\n` +
        `sv:Sc/${name}/Report                   = 2 "Sum" "Mean"\n`
      );
    }),
  );

  // Insert Source Block
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.insertSourceBlock', async () => {
      const name = await vscode.window.showInputBox({ prompt: 'Source name', placeHolder: 'MyBeam' });
      if (!name) return;
      const type = await vscode.window.showQuickPick(
        ['Beam', 'Isotropic', 'Volumetric', 'PhaseSpace', 'Distributed', 'Environment'],
        { placeHolder: 'Select source type' }
      );
      if (!type) return;
      const particle = await vscode.window.showQuickPick(
        ['proton', 'e-', 'e+', 'gamma', 'neutron', 'alpha'],
        { placeHolder: 'Select particle' }
      );

      let block = `\ns:So/${name}/Type          = "${type}"\ns:So/${name}/Component     = "BeamPosition"\ns:So/${name}/BeamParticle  = "${particle ?? 'proton'}"\n`;
      if (type === 'Beam') {
        block +=
          `d:So/${name}/BeamEnergy               = 169.23 MeV\n` +
          `u:So/${name}/BeamEnergySpread         = 0.757504\n` +
          `s:So/${name}/BeamPositionDistribution = "Gaussian"\n` +
          `s:So/${name}/BeamPositionCutoffShape  = "Ellipse"\n` +
          `d:So/${name}/BeamPositionCutoffX      = 10. cm\n` +
          `d:So/${name}/BeamPositionCutoffY      = 10. cm\n` +
          `d:So/${name}/BeamPositionSpreadX      = 0.65 cm\n` +
          `d:So/${name}/BeamPositionSpreadY      = 0.65 cm\n` +
          `s:So/${name}/BeamAngularDistribution  = "Gaussian"\n` +
          `d:So/${name}/BeamAngularCutoffX       = 90. deg\n` +
          `d:So/${name}/BeamAngularCutoffY       = 90. deg\n` +
          `d:So/${name}/BeamAngularSpreadX       = 0.0032 rad\n` +
          `d:So/${name}/BeamAngularSpreadY       = 0.0032 rad\n`;
      }
      block += `i:So/${name}/NumberOfHistoriesInRun   = 1000\n`;
      insertAtCursor(block);
    }),
  );

  // Insert Physics Block
  context.subscriptions.push(
    vscode.commands.registerCommand('topas.insertPhysicsBlock', async () => {
      const preset = await vscode.window.showQuickPick([
        { label: 'Proton therapy (full)', description: 'g4em-standard_opt4 + hadrons + decay' },
        { label: 'EM only (fast)', description: 'g4em-standard_opt0' },
        { label: 'Photon therapy', description: 'g4em-livermore + hadrons + decay' },
        { label: 'Transport only', description: 'No physics, geometry check only' },
      ], { placeHolder: 'Select physics preset' });
      if (!preset) return;
      const blocks: Record<string, string> = {
        'Proton therapy (full)':
          '\nsv:Ph/Default/Modules = 6 "g4em-standard_opt4" "g4h-phy_QGSP_BIC_HP" "g4decay" "g4ion-binarycascade" "g4h-elastic_HP" "g4stopping"\nd:Ph/Default/EMRangeMin = 100. eV\nd:Ph/Default/EMRangeMax = 1000. MeV\n',
        'EM only (fast)':
          '\nsv:Ph/Default/Modules = 1 "g4em-standard_opt0"\n',
        'Photon therapy':
          '\nsv:Ph/Default/Modules = 3 "g4em-livermore" "g4h-phy_QGSP_BIC_HP" "g4decay"\nd:Ph/Default/EMRangeMin = 100. eV\nd:Ph/Default/EMRangeMax = 1000. MeV\n',
        'Transport only':
          '\nsv:Ph/Default/Modules = 1 "Transportation_Only"\n',
      };
      insertAtCursor(blocks[preset.label] ?? '');
    }),
  );

  vscode.window.showInformationMessage('TOPAS extension activated ▶ Run with the ▶ button in the title bar.');
}

export function deactivate() {}

# TOPAS VSCode Extension

Full language support for [TOPAS Monte Carlo](https://github.com/OpenTOPAS/OpenTOPAS) parameter files.

## Features

| Feature | Details |
|---|---|
| **Syntax highlighting** | Type prefixes (`d:`, `s:`, `b:`…), namespaces, paths, units, booleans, strings |
| **Auto-detection** | `.txt` files containing TOPAS patterns are automatically set to the TOPAS language |
| **Hover documentation** | Hover over any parameter for type, description, units and default value |
| **IntelliSense** | Auto-complete parameter names, values, units, materials, particles, physics modules |
| **Formatting** | Aligns `=` signs per block; run *Format Document* or enable `topas.formatOnSave` |
| **Folding** | Collapse `====` section blocks |
| **Outline / Symbols** | Sidebar tree of all Ge/, So/, Sc/ components |
| **Diagnostics** | Warns about unknown parameters, type mismatches, invalid units, EMRangeMax < 600 MeV |
| **Run button** | ▶ button in the editor title bar — saves and runs `topas <file>` |
| **Run with visualization** | 👁 button — creates a temporary override file with Qt + PauseBeforeQuit |
| **Block insertion** | Commands to insert geometry, scoring, source, physics blocks interactively |
| **Snippets** | `beam`, `box`, `sphere`, `cylinder`, `dose`, `physics`, `material`, … |

## Configuration

| Setting | Default | Description |
|---|---|---|
| `topas.executablePath` | `topas` | Path to the TOPAS binary |
| `topas.autoDetect` | `true` | Auto-detect TOPAS files by content |
| `topas.formatOnSave` | `false` | Format on save |
| `topas.alignEquals` | `true` | Align `=` signs when formatting |

## Commands

Open the Command Palette (`Cmd/Ctrl+Shift+P`) and type **TOPAS**:

- `TOPAS: Run Simulation`
- `TOPAS: Run with Visualization`
- `TOPAS: Insert Section Header`
- `TOPAS: Insert Subsection Header`
- `TOPAS: Insert Geometry Block`
- `TOPAS: Insert Scoring Block`
- `TOPAS: Insert Source Block`
- `TOPAS: Insert Physics Block`
- `TOPAS: Format Document`

## Building

```bash
npm install
npm run compile
# Press F5 in VSCode to open the Extension Development Host
```

// ─────────────────────────────────────────────────────────────────────────────
//  TOPAS Parameter Database
//  Covers Ts/, Ge/, So/, Sc/, Ph/, Ma/, Gr/, Vr/, Tf/
// ─────────────────────────────────────────────────────────────────────────────

export interface TopasParam {
  key: string;           // e.g. "Ge/World/HLX"
  type: string;          // d, u, i, b, s, dv, uv, iv, sv, bv
  description: string;
  units?: string;
  defaultValue?: string;
  allowedValues?: string[];
  namespace: string;     // Ge, So, Sc, etc.
}

// Units grouped by category
export const UNIT_GROUPS: Record<string, string[]> = {
  Length:   ["m", "cm", "mm", "um", "nm", "km", "angstrom"],
  Angle:    ["deg", "rad", "mrad"],
  Energy:   ["eV", "keV", "MeV", "GeV", "TeV"],
  Time:     ["s", "ms", "us", "ns", "ps"],
  Density:  ["g/cm3", "kg/m3", "mg/cm3"],
  Dose:     ["gray", "Gy", "mGy", "pGy"],
  Activity: ["Bq", "kBq", "MBq", "GBq"],
  Field:    ["tesla", "gauss"],
};

export const ALL_UNITS = Object.values(UNIT_GROUPS).flat();

// ── Physics modules ──────────────────────────────────────────────────────────
export const PHYSICS_MODULES = [
  "g4em-standard_opt0", "g4em-standard_opt1", "g4em-standard_opt2",
  "g4em-standard_opt3", "g4em-standard_opt4",
  "g4em-livermore", "g4em-penelope", "g4em-lowep", "g4em-polarized",
  "g4h-phy_QGSP_BIC_HP", "g4h-phy_QGSP_BIC", "g4h-phy_FTFP_BERT",
  "g4h-elastic_HP", "g4h-elastic",
  "g4decay", "g4radioactivedecay",
  "g4ion-binarycascade", "g4ion-inclxx",
  "g4stopping",
  "Transportation_Only",
];

// ── Particles ────────────────────────────────────────────────────────────────
export const PARTICLES = [
  "proton", "e-", "e+", "gamma", "neutron", "alpha", "deuteron",
  "triton", "He3", "GenericIon", "pi+", "pi-", "pi0",
  "mu+", "mu-", "nu_e", "anti_nu_e",
];

// ── Scorer quantities ────────────────────────────────────────────────────────
export const SCORER_QUANTITIES = [
  "DoseToMedium", "DoseToWater", "EnergyDeposit",
  "Fluence", "SurfaceFluence", "SurfaceTrackCount",
  "TrackLengthInVolume", "PhaseSpace", "StepCount",
  "KineticEnergyAtSurface", "MomentumDirectionAtSurface",
  "ChargeAtSurface", "OriginCount", "ProtonLET",
];

// ── Colours ──────────────────────────────────────────────────────────────────
export const TOPAS_COLORS = [
  "white", "silver", "gray", "black", "red", "maroon", "yellow", "olive",
  "lime", "green", "aqua", "teal", "blue", "navy", "fuchsia", "purple",
  "brown", "grass", "grey", "indigo", "lightblue", "magenta", "orange",
  "pink", "skyblue", "violet",
];

// ── Drawing styles ────────────────────────────────────────────────────────────
export const DRAWING_STYLES = ["Solid", "WireFrame", "FullWireFrame", "Cloud"];

// ── Geometry types ────────────────────────────────────────────────────────────
export const GEOMETRY_TYPES = [
  "TsBox", "TsSphere", "TsCylinder", "Group",
  "G4Orb", "G4Torus", "G4Cons", "G4Para", "G4Trd", "G4RTrap", "G4GTrap",
  "G4EllipticalTube", "G4Ellipsoid", "G4EllipticalCone", "G4Paraboloid",
  "G4Hype", "G4Tet", "G4TwistedTubs", "G4HPolycone", "G4SPolycone",
  "G4GenericPolycone", "G4HPolyhedra", "G4SPolyhedra", "G4ExtrudedSolid",
  "G4CutTubs",
  "TsJaws", "TsDivergingMLC", "TsRangeModulator",
  "TsScatterer1", "TsScatterer2",
];

// ── Common materials ─────────────────────────────────────────────────────────
export const COMMON_MATERIALS = [
  "Vacuum", "Air",
  "G4_WATER", "G4_AIR", "G4_ALUMINUM", "G4_Fe", "G4_Cu", "G4_W", "G4_Pb",
  "G4_Au", "G4_Si", "G4_Ti", "G4_MYLAR", "G4_KAPTON", "G4_LUCITE",
  "G4_POLYETHYLENE", "G4_NYLON-6", "G4_PLEXIGLASS",
  "G4_TISSUE-SOFT_ICRP", "G4_TISSUE_SOFT_ICRP", "G4_BONE_CORTICAL_ICRP",
  "G4_LUNG_ICRP", "G4_BRAIN_ICRP", "G4_MUSCLE_WITH_SUCROSE",
  "G4_CONCRETE", "G4_GLASS_LEAD", "G4_STAINLESS-STEEL",
  "G4_I",
];

// ── Full parameter database ───────────────────────────────────────────────────
export const TOPAS_PARAMS: TopasParam[] = [
  // ── Ts/ ──────────────────────────────────────────────────────────────────
  { key:"Ts/Seed", type:"i", namespace:"Ts", description:"Random number generator seed. Use a fixed value for reproducible runs.", defaultValue:"1" },
  { key:"Ts/NumberOfThreads", type:"i", namespace:"Ts", description:"Number of CPU threads to use. 0 = all available threads.", defaultValue:"1" },
  { key:"Ts/ShowHistoryCountAtInterval", type:"i", namespace:"Ts", description:"Print a progress message every N histories.", defaultValue:"100" },
  { key:"Ts/PauseBeforeQuit", type:"b", namespace:"Ts", description:"Keep the OpenGL window open after the run ends (useful for visualization).", defaultValue:"False" },
  { key:"Ts/UseQt", type:"b", namespace:"Ts", description:"Enable Qt interface for interactive graphical visualization.", defaultValue:"False" },
  { key:"Ts/ShowCPUTime", type:"b", namespace:"Ts", description:"Print CPU time used at the end of the simulation.", defaultValue:"False" },
  { key:"Ts/DumpParameters", type:"b", namespace:"Ts", description:"Write an HTML file listing all parameters (defaults and non-defaults).", defaultValue:"False" },
  { key:"Ts/DumpNonDefaultParameters", type:"b", namespace:"Ts", description:"Write an HTML file listing only parameters that differ from TOPAS defaults.", defaultValue:"False" },
  { key:"Ts/TrackingVerbosity", type:"i", namespace:"Ts", description:"Geant4 tracking verbosity level. 0=silent, 1=per-event summary, 2=per-step detail, 5=full debug.", defaultValue:"0" },
  { key:"Ts/SequenceVerbosity", type:"i", namespace:"Ts", description:"Verbosity for the TOPAS run sequence.", defaultValue:"0" },
  { key:"Ts/GeometryVerbosity", type:"i", namespace:"Ts", description:"Verbosity for geometry construction.", defaultValue:"0" },
  { key:"Ts/RunVerbosity", type:"i", namespace:"Ts", description:"Geant4 run manager verbosity.", defaultValue:"0" },
  { key:"Ts/EventVerbosity", type:"i", namespace:"Ts", description:"Geant4 event verbosity.", defaultValue:"0" },

  // ── Ge/ common ───────────────────────────────────────────────────────────
  { key:"Ge/{Name}/Type", type:"s", namespace:"Ge", description:"Geometry component type.", allowedValues: GEOMETRY_TYPES },
  { key:"Ge/{Name}/Parent", type:"s", namespace:"Ge", description:"Name of the parent component. The root component is 'World'." },
  { key:"Ge/{Name}/Material", type:"s", namespace:"Ge", description:"Material of the component. Can be a G4 NIST material (G4_WATER) or a custom material defined in Ma/." },
  { key:"Ge/{Name}/TransX", type:"d", namespace:"Ge", units:"Length", description:"Translation along X in the parent coordinate system.", defaultValue:"0 m" },
  { key:"Ge/{Name}/TransY", type:"d", namespace:"Ge", units:"Length", description:"Translation along Y in the parent coordinate system.", defaultValue:"0 m" },
  { key:"Ge/{Name}/TransZ", type:"d", namespace:"Ge", units:"Length", description:"Translation along Z in the parent coordinate system.", defaultValue:"0 m" },
  { key:"Ge/{Name}/RotX", type:"d", namespace:"Ge", units:"Angle", description:"Rotation around X axis (applied after translation).", defaultValue:"0 deg" },
  { key:"Ge/{Name}/RotY", type:"d", namespace:"Ge", units:"Angle", description:"Rotation around Y axis.", defaultValue:"0 deg" },
  { key:"Ge/{Name}/RotZ", type:"d", namespace:"Ge", units:"Angle", description:"Rotation around Z axis.", defaultValue:"0 deg" },
  { key:"Ge/{Name}/Color", type:"s", namespace:"Ge", description:"Visualization color.", allowedValues: TOPAS_COLORS },
  { key:"Ge/{Name}/DrawingStyle", type:"s", namespace:"Ge", description:"Visualization drawing style.", allowedValues: DRAWING_STYLES, defaultValue:"WireFrame" },
  { key:"Ge/{Name}/Invisible", type:"b", namespace:"Ge", description:"Hide this component in the visualization.", defaultValue:"False" },
  { key:"Ge/{Name}/XBins", type:"i", namespace:"Ge", description:"Number of voxel bins along X. Cannot be used if the volume has children." },
  { key:"Ge/{Name}/YBins", type:"i", namespace:"Ge", description:"Number of voxel bins along Y. Cannot be used if the volume has children." },
  { key:"Ge/{Name}/ZBins", type:"i", namespace:"Ge", description:"Number of voxel bins along Z. Cannot be used if the volume has children." },
  { key:"Ge/{Name}/RBins", type:"i", namespace:"Ge", description:"Number of voxel bins in radial direction (cylinder/sphere)." },
  { key:"Ge/{Name}/PhiBins", type:"i", namespace:"Ge", description:"Number of voxel bins in phi direction (cylinder/sphere)." },
  { key:"Ge/{Name}/ThetaBins", type:"i", namespace:"Ge", description:"Number of voxel bins in theta direction (sphere)." },
  { key:"Ge/{Name}/IsParallel", type:"b", namespace:"Ge", description:"Place this component in a parallel world.", defaultValue:"False" },
  { key:"Ge/{Name}/ParallelWorldName", type:"s", namespace:"Ge", description:"Name of the parallel world to place this component in." },
  { key:"Ge/{Name}/AssignToRegionNamed", type:"s", namespace:"Ge", description:"Assign to a named Geant4 region for region-specific physics." },
  // TsBox
  { key:"Ge/{Name}/HLX", type:"d", namespace:"Ge", units:"Length", description:"Half-length along X (TsBox)." },
  { key:"Ge/{Name}/HLY", type:"d", namespace:"Ge", units:"Length", description:"Half-length along Y (TsBox)." },
  { key:"Ge/{Name}/HLZ", type:"d", namespace:"Ge", units:"Length", description:"Half-length along Z (TsBox or TsCylinder)." },
  // TsSphere / TsCylinder
  { key:"Ge/{Name}/RMin", type:"d", namespace:"Ge", units:"Length", description:"Inner radius. 0 = solid volume (TsSphere, TsCylinder).", defaultValue:"0 mm" },
  { key:"Ge/{Name}/RMax", type:"d", namespace:"Ge", units:"Length", description:"Outer radius (TsSphere, TsCylinder)." },
  { key:"Ge/{Name}/HL", type:"d", namespace:"Ge", units:"Length", description:"Half-length along Z (TsCylinder)." },
  { key:"Ge/{Name}/SPhi", type:"d", namespace:"Ge", units:"Angle", description:"Starting azimuthal angle phi.", defaultValue:"0 deg" },
  { key:"Ge/{Name}/DPhi", type:"d", namespace:"Ge", units:"Angle", description:"Delta azimuthal angle phi (360 = full revolution).", defaultValue:"360 deg" },
  { key:"Ge/{Name}/STheta", type:"d", namespace:"Ge", units:"Angle", description:"Starting polar angle theta (TsSphere).", defaultValue:"0 deg" },
  { key:"Ge/{Name}/DTheta", type:"d", namespace:"Ge", units:"Angle", description:"Delta polar angle theta (TsSphere).", defaultValue:"180 deg" },

  // ── So/ ───────────────────────────────────────────────────────────────────
  { key:"So/{Name}/Type", type:"s", namespace:"So", description:"Source type.", allowedValues:["Beam","Isotropic","Volumetric","PhaseSpace","Distributed","Environment","Emittance"] },
  { key:"So/{Name}/Component", type:"s", namespace:"So", description:"Name of the geometry component used as reference for the source." },
  { key:"So/{Name}/BeamParticle", type:"s", namespace:"So", description:"Primary particle species.", allowedValues: PARTICLES },
  { key:"So/{Name}/BeamEnergy", type:"d", namespace:"So", units:"Energy", description:"Nominal kinetic energy of the beam." },
  { key:"So/{Name}/BeamEnergySpread", type:"u", namespace:"So", description:"Fractional energy spread (sigma/E, unitless). Used when BeamEnergySpectrumType is Gaussian." },
  { key:"So/{Name}/NumberOfHistoriesInRun", type:"i", namespace:"So", description:"Number of primary particles to simulate per run." },
  { key:"So/{Name}/BeamPositionDistribution", type:"s", namespace:"So", description:"Transverse position distribution.", allowedValues:["None","Flat","Gaussian"] },
  { key:"So/{Name}/BeamPositionCutoffShape", type:"s", namespace:"So", description:"Shape of the cutoff for Flat/Gaussian position distribution.", allowedValues:["Ellipse","Rectangle"] },
  { key:"So/{Name}/BeamPositionCutoffX", type:"d", namespace:"So", units:"Length", description:"Cutoff in X for position distribution (half-width of rectangle, radius of ellipse)." },
  { key:"So/{Name}/BeamPositionCutoffY", type:"d", namespace:"So", units:"Length", description:"Cutoff in Y for position distribution." },
  { key:"So/{Name}/BeamPositionSpreadX", type:"d", namespace:"So", units:"Length", description:"Sigma of Gaussian position distribution in X." },
  { key:"So/{Name}/BeamPositionSpreadY", type:"d", namespace:"So", units:"Length", description:"Sigma of Gaussian position distribution in Y." },
  { key:"So/{Name}/BeamAngularDistribution", type:"s", namespace:"So", description:"Angular divergence distribution.", allowedValues:["None","Flat","Gaussian"] },
  { key:"So/{Name}/BeamAngularCutoffX", type:"d", namespace:"So", units:"Angle", description:"Angular cutoff in X." },
  { key:"So/{Name}/BeamAngularCutoffY", type:"d", namespace:"So", units:"Angle", description:"Angular cutoff in Y." },
  { key:"So/{Name}/BeamAngularSpreadX", type:"d", namespace:"So", units:"Angle", description:"Sigma of Gaussian angular spread in X (rad)." },
  { key:"So/{Name}/BeamAngularSpreadY", type:"d", namespace:"So", units:"Angle", description:"Sigma of Gaussian angular spread in Y (rad)." },
  { key:"So/{Name}/BeamEnergySpectrumType", type:"s", namespace:"So", description:"Energy spectrum type.", allowedValues:["Mono","Discrete","Continuous"] },
  { key:"So/{Name}/BeamEnergySpectrumValues", type:"dv", namespace:"So", units:"Energy", description:"Energies for discrete/continuous spectrum (vector)." },
  { key:"So/{Name}/BeamEnergySpectrumWeights", type:"uv", namespace:"So", description:"Weights for each energy bin in a discrete spectrum." },
  { key:"So/{Name}/ActiveMaterial", type:"s", namespace:"So", description:"Material from which primaries are generated (Volumetric source)." },
  { key:"So/{Name}/RecursivelyIncludeChildren", type:"b", namespace:"So", description:"Include child volumes with ActiveMaterial (Volumetric source).", defaultValue:"True" },
  { key:"So/{Name}/MaxNumberOfPointsToSample", type:"i", namespace:"So", description:"Maximum number of sampling points (Volumetric source).", defaultValue:"10000000" },
  { key:"So/{Name}/PhaseSpaceFileName", type:"s", namespace:"So", description:"Base name of the phase space file to read (PhaseSpace source)." },
  { key:"So/{Name}/PhaseSpaceMultipleUse", type:"b", namespace:"So", description:"Re-use the phase space file if more histories are needed.", defaultValue:"True" },
  { key:"So/{Name}/NumberOfSourcePoints", type:"i", namespace:"So", description:"Number of fixed emission points (Distributed source)." },
  { key:"So/{Name}/RedistributePointsOnNewRun", type:"b", namespace:"So", description:"Randomise source points on each new run (Distributed source).", defaultValue:"False" },
  { key:"So/{Name}/Distribution", type:"s", namespace:"So", description:"Phase space distribution type (Emittance source).", allowedValues:["BiGaussian","twiss_gaussian","twiss_kv","twiss_waterbag"] },

  // ── Sc/ ───────────────────────────────────────────────────────────────────
  { key:"Sc/{Name}/Quantity", type:"s", namespace:"Sc", description:"Observable to score.", allowedValues: SCORER_QUANTITIES },
  { key:"Sc/{Name}/Component", type:"s", namespace:"Sc", description:"Geometry component to score in." },
  { key:"Sc/{Name}/Surface", type:"s", namespace:"Sc", description:"Surface of the component to score on (e.g. 'MyBox/ZPlusSurface')." },
  { key:"Sc/{Name}/OutputFile", type:"s", namespace:"Sc", description:"Output filename (without extension)." },
  { key:"Sc/{Name}/OutputType", type:"s", namespace:"Sc", description:"Output file format.", allowedValues:["csv","binary","ASCII","root","XML"] },
  { key:"Sc/{Name}/IfOutputFileAlreadyExists", type:"s", namespace:"Sc", description:"Behaviour if output file exists.", allowedValues:["Overwrite","Increment","Exit"], defaultValue:"Overwrite" },
  { key:"Sc/{Name}/OutputToConsole", type:"b", namespace:"Sc", description:"Print results to stdout.", defaultValue:"False" },
  { key:"Sc/{Name}/OutputAfterRun", type:"b", namespace:"Sc", description:"Write results after each run (useful for multi-run jobs).", defaultValue:"False" },
  { key:"Sc/{Name}/Report", type:"sv", namespace:"Sc", description:"Statistical quantities to report.", allowedValues:["Sum","Mean","Variance","Standard_Deviation","Min","Max","Histories_with_Scorer","Count_in_Bin"] },
  { key:"Sc/{Name}/PropagateToChildren", type:"b", namespace:"Sc", description:"Apply scorer recursively to child volumes.", defaultValue:"False" },
  { key:"Sc/{Name}/XBins", type:"i", namespace:"Sc", description:"Number of scoring bins along X (overrides geometry bins)." },
  { key:"Sc/{Name}/YBins", type:"i", namespace:"Sc", description:"Number of scoring bins along Y." },
  { key:"Sc/{Name}/ZBins", type:"i", namespace:"Sc", description:"Number of scoring bins along Z." },
  { key:"Sc/{Name}/OutputBufferSize", type:"i", namespace:"Sc", description:"Buffer size before writing (PhaseSpace scorer).", defaultValue:"1000" },
  { key:"Sc/{Name}/IncludeRunID", type:"b", namespace:"Sc", description:"Add RunID column to PhaseSpace output.", defaultValue:"False" },
  { key:"Sc/{Name}/IncludeEventID", type:"b", namespace:"Sc", description:"Add EventID column to PhaseSpace output.", defaultValue:"False" },
  { key:"Sc/{Name}/IncludeTrackID", type:"b", namespace:"Sc", description:"Add TrackID column to PhaseSpace output.", defaultValue:"False" },
  { key:"Sc/{Name}/IncludeTime", type:"b", namespace:"Sc", description:"Add time column to PhaseSpace output.", defaultValue:"False" },
  { key:"Sc/{Name}/IncludeSeed", type:"b", namespace:"Sc", description:"Add seed column to PhaseSpace output.", defaultValue:"False" },

  // ── Ph/ ───────────────────────────────────────────────────────────────────
  { key:"Ph/{Name}/Modules", type:"sv", namespace:"Ph", description:"List of Geant4 physics modules to activate.", allowedValues: PHYSICS_MODULES },
  { key:"Ph/{Name}/EMRangeMin", type:"d", namespace:"Ph", units:"Energy", description:"Minimum EM production range cut energy.", defaultValue:"100 eV" },
  { key:"Ph/{Name}/EMRangeMax", type:"d", namespace:"Ph", units:"Energy", description:"Maximum EM production range cut energy (must be >= 600 MeV in TOPAS 4.x).", defaultValue:"1000 MeV" },

  // ── Ma/ ───────────────────────────────────────────────────────────────────
  { key:"Ma/{Name}/Components", type:"sv", namespace:"Ma", description:"List of element names that make up this material (e.g. \"Hydrogen\" \"Oxygen\")." },
  { key:"Ma/{Name}/Fractions", type:"uv", namespace:"Ma", description:"Mass fractions corresponding to each component. Must sum to 1." },
  { key:"Ma/{Name}/Density", type:"d", namespace:"Ma", units:"Density", description:"Mass density of the material." },
  { key:"Ma/{Name}/DefaultColor", type:"s", namespace:"Ma", description:"Default visualisation colour for this material.", allowedValues: TOPAS_COLORS },

  // ── Gr/ ───────────────────────────────────────────────────────────────────
  { key:"Gr/{Name}/Type", type:"s", namespace:"Gr", description:"Graphics driver to use.", allowedValues:["OpenGL","HepRep","VRML","DAWN","RayTracer","RayTracerX"] },
  { key:"Gr/{Name}/WindowSizeX", type:"i", namespace:"Gr", description:"Width of the visualisation window in pixels.", defaultValue:"600" },
  { key:"Gr/{Name}/WindowSizeY", type:"i", namespace:"Gr", description:"Height of the visualisation window in pixels.", defaultValue:"600" },
  { key:"Gr/{Name}/WindowPosX", type:"i", namespace:"Gr", description:"X position of the window on screen.", defaultValue:"0" },
  { key:"Gr/{Name}/WindowPosY", type:"i", namespace:"Gr", description:"Y position of the window on screen.", defaultValue:"0" },
  { key:"Gr/{Name}/Theta", type:"d", namespace:"Gr", units:"Angle", description:"Camera polar angle.", defaultValue:"55 deg" },
  { key:"Gr/{Name}/Phi", type:"d", namespace:"Gr", units:"Angle", description:"Camera azimuthal angle.", defaultValue:"20 deg" },
  { key:"Gr/{Name}/Projection", type:"s", namespace:"Gr", description:"Camera projection type.", allowedValues:["Perspective","Orthographic"], defaultValue:"Perspective" },
  { key:"Gr/{Name}/PerspectiveAngle", type:"d", namespace:"Gr", units:"Angle", description:"Perspective field-of-view angle.", defaultValue:"30 deg" },
  { key:"Gr/{Name}/Zoom", type:"u", namespace:"Gr", description:"Zoom factor (1 = default).", defaultValue:"1" },
  { key:"Gr/{Name}/IncludeAxes", type:"b", namespace:"Gr", description:"Draw the coordinate axes.", defaultValue:"False" },
  { key:"Gr/{Name}/AxesSize", type:"d", namespace:"Gr", units:"Length", description:"Length of the coordinate axes.", defaultValue:"1 m" },
  { key:"Gr/{Name}/HiddenLineRemovalForTrajectories", type:"b", namespace:"Gr", description:"Enable hidden-line removal for trajectory display.", defaultValue:"False" },
  { key:"Gr/{Name}/ColorBy", type:"s", namespace:"Gr", description:"Colour trajectories by this attribute.", allowedValues:["Charge","ParticleType","OriginVolume","OriginComponent","CreatorProcess","Energy","Momentum","Generation"] },
];

// Build a lookup map for fast access
export const PARAM_MAP = new Map<string, TopasParam>(
  TOPAS_PARAMS.map(p => [p.key.toLowerCase(), p])
);

// Namespace to params map
export const PARAMS_BY_NAMESPACE = new Map<string, TopasParam[]>();
for (const p of TOPAS_PARAMS) {
  const list = PARAMS_BY_NAMESPACE.get(p.namespace) || [];
  list.push(p);
  PARAMS_BY_NAMESPACE.set(p.namespace, list);
}

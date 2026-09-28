export type ProductLine = {
  slug: string;
  name: string;
  shortName: string;
  summary: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: 'cog' | 'refresh' | 'slice' | 'crosshair' | 'layers';
  leadTime: string;
  tolerances: string[];
  surfaceTreatments: string[];
  applications: string[];
  materials: string[];
  specifications: Array<{
    label: string;
    value: string;
  }>;
};

export const company = {
  name: 'Lancoprecision',
  legalName: 'Lancoprecision Manufacturing Co., Ltd.',
  email: 'inquiry@lancoprecision.example',
  phone: '+86 512 0000 0000',
  whatsapp: '8613800000000',
  linkedin: 'https://www.linkedin.com/company/lancoprecision',
  address: 'Precision Industrial Park, Suzhou, Jiangsu, China',
  hours: 'Mon to Sat, 08:00 to 18:00 CST',
};

export const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Capabilities', href: '/products/cnc-machining' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const productLines: ProductLine[] = [
  {
    slug: 'cnc-machining',
    name: 'CNC Machining',
    shortName: 'Machining',
    summary:
      'Multi-axis precision machining for metal and plastic components with repeatable dimensional control.',
    description:
      'Lancoprecision supports prototype, bridge, and production machining across aluminum, steel, stainless steel, brass, copper, and engineering plastics. Programmed toolpaths, in-process inspection, and calibrated CMM checks keep critical dimensions stable from first article to volume runs.',
    image: '/images/cnc-machining.jpg',
    imageAlt: 'CNC machining center cutting a precision metal component',
    icon: 'cog',
    leadTime: '5 to 12 business days',
    tolerances: ['+/- 0.005 mm for critical features', '+/- 0.01 mm for standard features'],
    surfaceTreatments: ['Anodizing', 'Passivation', 'Bead blasting', 'Powder coating'],
    applications: ['Automation', 'Medical devices', 'Robotics', 'Aerospace tooling'],
    materials: ['Aluminum 6061', 'Stainless steel', 'Mild steel', 'Brass', 'POM'],
    specifications: [
      { label: 'Max part envelope', value: '1200 x 800 x 500 mm' },
      { label: 'Batch size', value: '1 to 10,000+' },
      { label: 'Inspection', value: 'CMM, gauges, first article' },
      { label: 'File formats', value: 'STEP, IGES, X_T, DXF' },
    ],
  },
  {
    slug: 'cnc-turning',
    name: 'CNC Turning',
    shortName: 'Turning',
    summary:
      'Precision lathe work for shafts, bushings, fittings, and rotationally symmetric parts.',
    description:
      'CNC turning and turn-mill cells produce round parts with fine surface finish and tight concentricity. Live tooling supports off-center holes, slots, and threads in a single setup, reducing handling and improving feature-to-feature accuracy.',
    image: '/images/factory-floor.jpg',
    imageAlt: 'CNC turning workshop with precision lathes',
    icon: 'refresh',
    leadTime: '4 to 10 business days',
    tolerances: ['+/- 0.01 mm standard', '+/- 0.005 mm on request'],
    surfaceTreatments: ['Electropolishing', 'Anodizing', 'Zinc plating', 'Passivation'],
    applications: ['Fluid systems', 'Drive shafts', 'Precision fittings', 'Instrumentation'],
    materials: ['Aluminum', 'Stainless steel', 'Alloy steel', 'Titanium', 'Engineering plastics'],
    specifications: [
      { label: 'Max turning diameter', value: '420 mm' },
      { label: 'Max turning length', value: '1,000 mm' },
      { label: 'Thread capability', value: 'Metric, UN, pipe, custom' },
      { label: 'Surface finish', value: 'Ra 0.8 or finer' },
    ],
  },
  {
    slug: 'cnc-milling',
    name: 'CNC Milling',
    shortName: 'Milling',
    summary:
      'Three-axis milling for prismatic parts, enclosures, fixtures, and machined assemblies.',
    description:
      'High-speed vertical milling centers handle complex pockets, profiles, holes, and tight flatness requirements. Flexible workholding and tool management support low-volume NPI as well as repeat production batches.',
    image: '/images/cnc-milling.jpg',
    imageAlt: 'CNC milling machine producing a machined aluminum part',
    icon: 'slice',
    leadTime: '5 to 10 business days',
    tolerances: ['+/- 0.01 mm standard', 'Flatness within 0.02 mm on critical faces'],
    surfaceTreatments: ['Clear anodize', 'Black anodize', 'Nickel plating', 'Chromate conversion'],
    applications: ['Enclosures', 'Housings', 'Brackets', 'Optical and sensor mounts'],
    materials: ['Aluminum', 'Stainless steel', 'Carbon steel', 'Copper', 'Nylon'],
    specifications: [
      { label: 'Table travel', value: 'Up to 1,100 x 600 mm' },
      { label: 'Spindle speed', value: 'Up to 12,000 rpm' },
      { label: 'Tool capacity', value: '30+ positions' },
      { label: 'Inspection', value: 'In-process probing available' },
    ],
  },
  {
    slug: '5-axis-machining',
    name: '5-Axis Machining',
    shortName: '5-Axis',
    summary:
      'Simultaneous five-axis machining for complex geometry, fewer setups, and tighter datum control.',
    description:
      'Five-axis machining reduces setup stacking for sculpted surfaces, angled holes, and difficult-to-reach features. The result is better positional accuracy and shorter lead time for parts that would otherwise require multiple fixtures.',
    image: '/images/hero-cnc.jpg',
    imageAlt: 'Five-axis CNC machine in a precision manufacturing facility',
    icon: 'crosshair',
    leadTime: '6 to 14 business days',
    tolerances: ['+/- 0.005 mm critical features', '+/- 0.02 mm angular features'],
    surfaceTreatments: ['Anodizing', 'Passivation', 'Media blasting', 'Custom finishes'],
    applications: ['Aerospace', 'Turbomachinery', 'Medical implants', 'Complex automation'],
    materials: ['Aluminum', 'Titanium', 'Stainless steel', 'Inconel', 'Engineering plastics'],
    specifications: [
      { label: 'Axis configuration', value: '5-axis simultaneous' },
      { label: 'Max workpiece diameter', value: '500 mm' },
      { label: 'Angular accuracy', value: 'High-accuracy rotary table' },
      { label: 'Advantage', value: 'Fewer setups, tighter datum control' },
    ],
  },
  {
    slug: 'sheet-metal',
    name: 'Sheet Metal',
    shortName: 'Sheet Metal',
    summary:
      'Laser cutting, bending, welding, and finishing for enclosures, brackets, and fabricated assemblies.',
    description:
      'Sheet metal fabrication combines laser cutting, CNC bending, welding, hardware insertion, and finishing. DFM feedback is provided early to keep bend radii, reliefs, and tolerances production-ready.',
    image: '/images/sheet-metal.jpg',
    imageAlt: 'Sheet metal parts on a precision fabrication line',
    icon: 'layers',
    leadTime: '7 to 15 business days',
    tolerances: ['+/- 0.1 mm standard', 'Tighter tolerances on critical cut features'],
    surfaceTreatments: ['Powder coating', 'Wet painting', 'Zinc plating', 'Brushed finish'],
    applications: ['Industrial enclosures', 'Control panels', 'Machine frames', 'Mounting hardware'],
    materials: ['Cold-rolled steel', 'Stainless steel', 'Aluminum', 'Galvanized steel'],
    specifications: [
      { label: 'Material thickness', value: '0.5 to 10 mm' },
      { label: 'Laser bed', value: '3,000 x 1,500 mm' },
      { label: 'Bending length', value: 'Up to 3,200 mm' },
      { label: 'Welding', value: 'TIG, MIG, spot welding' },
    ],
  },
];

export const advantages = [
  {
    title: 'Controlled tolerances',
    description:
      'Calibrated equipment, in-process checks, and first-article inspection keep critical dimensions repeatable.',
  },
  {
    title: 'Verified quality system',
    description:
      'Documented quality controls and traceable inspection records support engineering review.',
  },
  {
    title: 'Practical lead times',
    description:
      'Prototype and production schedules are confirmed early with clear material and capacity planning.',
  },
  {
    title: 'Direct engineering communication',
    description:
      'DFM questions are answered in plain language, reducing avoidable design changes before production.',
  },
];

export const equipment = [
  { name: '5-axis machining center', model: 'DMG MORI DMU 50', quantity: 3 },
  { name: 'Vertical machining center', model: 'Haas VF-4SS', quantity: 8 },
  { name: 'CNC turning center', model: 'Mazak Quick Turn 250', quantity: 6 },
  { name: 'Laser cutting system', model: 'Fiber laser 6 kW', quantity: 2 },
  { name: 'CNC press brake', model: 'Amada HG series', quantity: 4 },
  { name: 'Coordinate measuring machine', model: 'Zeiss Contura', quantity: 2 },
];

export const certifications = [
  { name: 'ISO 9001:2015', issuer: 'Certified quality management' },
  { name: 'IATF 16949:2016', issuer: 'Automotive quality system' },
  { name: 'ISO 14001:2015', issuer: 'Environmental management' },
  { name: 'RoHS', issuer: 'Restricted substance compliance' },
];

export const qualitySteps = [
  {
    title: 'DFM review',
    description: 'Tolerances, material choice, and manufacturability are reviewed before release.',
  },
  {
    title: 'In-process control',
    description: 'Critical dimensions are checked during production, not only at final inspection.',
  },
  {
    title: 'First article',
    description: 'First-piece dimensional reports are available for engineering approval.',
  },
  {
    title: 'Final verification',
    description: 'Parts are inspected against drawing, finish, and packaging requirements.',
  },
];

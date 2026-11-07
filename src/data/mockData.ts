import { ERPProduct, Tenant } from '../engine/types';

export const INITIAL_PRODUCTS: ERPProduct[] = [
  {
    sku: 'SKU-9901',
    title: 'High-Pressure Hydraulic Pump 350 Bar',
    category: 'Hydraulics',
    price: 1450.0,
    currency: 'AUD',
    stock: 18,
    status: 'active',
    etag: 'etag_9901_v1',
    updatedAt: '2026-11-06T08:30:00Z',
  },
  {
    sku: 'SKU-9902',
    title: 'Variable Frequency Drive 15kW 415V',
    category: 'Electrical',
    price: 890.0,
    currency: 'AUD',
    stock: 24,
    status: 'active',
    etag: 'etag_9902_v1',
    updatedAt: '2026-11-06T09:15:00Z',
  },
  {
    sku: 'SKU-9903',
    title: 'Stainless Steel Ball Valve DN50 PN40',
    category: 'Valves & Flow',
    price: 185.0,
    currency: 'AUD',
    stock: 4,
    status: 'low_stock',
    etag: 'etag_9903_v1',
    updatedAt: '2026-11-06T10:00:00Z',
  },
  {
    sku: 'SKU-9904',
    title: 'Heavy Duty Planetary Gearbox 1:25 Ratio',
    category: 'Mechanical',
    price: 3200.0,
    currency: 'AUD',
    stock: 7,
    status: 'active',
    etag: 'etag_9904_v1',
    updatedAt: '2026-11-06T11:45:00Z',
  },
  {
    sku: 'SKU-9905',
    title: 'Optical Laser Distance Sensor 0.1-50m IP67',
    category: 'Sensors',
    price: 640.0,
    currency: 'AUD',
    stock: 31,
    status: 'active',
    etag: 'etag_9905_v1',
    updatedAt: '2026-11-06T13:20:00Z',
  },
  {
    sku: 'SKU-9906',
    title: 'Hydraulic Cylinder 100mm Bore 500mm Stroke',
    category: 'Hydraulics',
    price: 1120.0,
    currency: 'AUD',
    stock: 12,
    status: 'active',
    etag: 'etag_9906_v1',
    updatedAt: '2026-11-06T14:10:00Z',
  },
  {
    sku: 'SKU-9907',
    title: 'Hydraulic Proportional Directional Valve 24V',
    category: 'Hydraulics',
    price: 2150.0,
    currency: 'AUD',
    stock: 6,
    status: 'active',
    etag: 'etag_9907_v1',
    updatedAt: '2026-11-06T15:00:00Z',
  },
];

export const TENANT_PRODUCTS: Record<string, ERPProduct[]> = {
  'tenant-alpha': INITIAL_PRODUCTS,
  'tenant-beta': [
    {
      sku: 'LOG-401',
      title: 'Industrial Handheld Barcode Scanner 2D QR IP65',
      category: 'Warehouse Hardware',
      price: 420.0,
      currency: 'AUD',
      stock: 55,
      status: 'active',
      etag: 'etag_log401_v1',
      updatedAt: '2026-11-06T09:00:00Z',
    },
    {
      sku: 'LOG-402',
      title: 'Automated Pallet Stretch Wrapping Turntable 2000kg',
      category: 'Packaging Automation',
      price: 8500.0,
      currency: 'AUD',
      stock: 2,
      status: 'low_stock',
      etag: 'etag_log402_v1',
      updatedAt: '2026-11-06T09:30:00Z',
    },
    {
      sku: 'LOG-403',
      title: 'Long-Range RFID Dock Door Portal Reader 865-868MHz',
      category: 'RFID & Tracking',
      price: 2950.0,
      currency: 'AUD',
      stock: 14,
      status: 'active',
      etag: 'etag_log403_v1',
      updatedAt: '2026-11-06T10:15:00Z',
    },
    {
      sku: 'LOG-404',
      title: 'Thermal Transfer Shipping Label Printer 300 DPI',
      category: 'Warehouse Hardware',
      price: 780.0,
      currency: 'AUD',
      stock: 28,
      status: 'active',
      etag: 'etag_log404_v1',
      updatedAt: '2026-11-06T11:00:00Z',
    },
    {
      sku: 'LOG-405',
      title: 'Electric Pallet Jack Lithium 1500kg Capacity',
      category: 'Material Handling',
      price: 3600.0,
      currency: 'AUD',
      stock: 9,
      status: 'active',
      etag: 'etag_log405_v1',
      updatedAt: '2026-11-06T11:30:00Z',
    },
  ],
  'tenant-gamma-disabled': [],
};

export const INITIAL_TENANT_METRICS: Record<string, {
  creditBalance: number;
  tokensUsed: number;
  dailyCap: number;
  isKillSwitch: boolean;
}> = {
  'tenant-alpha': {
    creditBalance: 142.50,
    tokensUsed: 4210,
    dailyCap: 50000,
    isKillSwitch: false,
  },
  'tenant-beta': {
    creditBalance: 88.20,
    tokensUsed: 12450,
    dailyCap: 30000,
    isKillSwitch: false,
  },
  'tenant-gamma-disabled': {
    creditBalance: 0.00,
    tokensUsed: 0,
    dailyCap: 10000,
    isKillSwitch: true,
  },
};

export const TENANTS_DATA: Record<string, Tenant> = {
  'tenant-alpha': {
    id: 'tenant-alpha',
    name: 'Apex Manufacturing Corp',
    status: 'active',
    plan: 'enterprise',
    createdAt: '2025-01-15T00:00:00Z',
    erpBaseUrl: 'https://erp.apex-mfg.internal',
    allowedOrigins: ['https://app.apex-mfg.com', 'http://localhost:3000'],
  },
  'tenant-beta': {
    id: 'tenant-beta',
    name: 'BlueWave Distribution Ltd',
    status: 'active',
    plan: 'growth',
    createdAt: '2025-03-01T00:00:00Z',
    erpBaseUrl: 'https://erp.bluewave-logistics.internal',
    allowedOrigins: ['https://portal.bluewave.com', 'http://localhost:3000'],
  },
  'tenant-gamma-disabled': {
    id: 'tenant-gamma-disabled',
    name: 'Gamma Tech (Suspended)',
    status: 'disabled',
    plan: 'starter',
    createdAt: '2024-11-20T00:00:00Z',
    erpBaseUrl: 'https://erp.gamma.internal',
    allowedOrigins: ['https://app.gamma.com'],
  },
};

export interface MilestoneItem {
  id: number;
  title: string;
  share: string;
  tasksCount: number;
  scopeSummary: string;
  acceptanceChecks: string[];
}

export const MILESTONES_CONFIG: MilestoneItem[] = [
  {
    id: 1,
    title: 'Authentication & Tenant Foundation',
    share: '14%',
    tasksCount: 72,
    scopeSummary: 'Project skeleton, custom Lambda authorizer, tenant registry, WAF monitoring, CORS, alarms, and token-minting fixture.',
    acceptanceChecks: [
      'The health route responds; every other route rejects unauthenticated requests.',
      'Prepared tokens (valid, expired, tampered, wrong key, unsupported alg, malformed) return expected codes.',
      'Valid token for an unknown or disabled tenant is refused with 403.',
      'Strict tenant isolation: tenant identifiers in headers/body/query are ignored; token claims dictate tenant.',
      'CORS preflight checks enforce allowed origins per tenant.',
    ],
  },
  {
    id: 2,
    title: 'AI Core & Safe Execution Engine',
    share: '24%',
    tasksCount: 115,
    scopeSummary: 'Amazon Bedrock model allow-listing, conversation API, token credits & spend kill switch, SQS background processing, 2-phase preview/approval write plans, malware-scanned file upload.',
    acceptanceChecks: [
      'Conversations: create, list, read, delete with idempotency key deduplication.',
      'Concurrent credit reservations never exceed daily limit; duplicate credit events apply once.',
      'Chat works end-to-end on Bedrock with strict step, token, and time bounds preventing runaway loops.',
      'Writes happen only through an approved plan: wrong approval details, expired plan, or non-admin/editor fail.',
      'Direct write tools are forbidden on model; operations are atomic and execute exactly once.',
      'File upload scans for viruses (e.g., EICAR), rejects oversized/malformed files, prevents cross-user access.',
    ],
  },
  {
    id: 3,
    title: 'Agent Packages',
    share: '12%',
    tasksCount: 43,
    scopeSummary: 'Declarative agent package validator, generic tool engine, versioning with canary & zero-downtime rollback, primary agent router, handover safety rules.',
    acceptanceChecks: [
      'Invalid packages rejected with clear syntax errors (unsafe content, missing previews, unknown fields).',
      'Package-defined write tools enforce identical approval flow as coded tools.',
      'Canary deployment and zero-downtime rollback executed via CLI without redeploying Lambda code.',
      'Users never manually choose an agent; primary router routes intelligently to specialist without loops.',
    ],
  },
  {
    id: 4,
    title: 'First Business Agent (Product Agent)',
    share: '14%',
    tasksCount: 46,
    scopeSummary: 'Secure ERP connector with outbound IP restrictions, circuit breaker, rate limiting, and product agent for before-and-after preview, conflict detection, and category-wide updates.',
    acceptanceChecks: [
      'ERP connector calls only tenant-configured domain, refuses redirects and unknown paths.',
      'Optimistic concurrency detection stops execution if product was changed by someone else during preview.',
      'Category-wide updates (up to 20 products) execute within rate limits under a single approved plan.',
      'Zero credentials or sensitive ERP payloads logged; prompt injection attacks safely deflected.',
    ],
  },
  {
    id: 5,
    title: 'Production Readiness & Pilot Support',
    share: '10%',
    tasksCount: 49,
    scopeSummary: 'CI/CD pipeline with GitHub Actions OIDC, threat model, automated load testing, tenant offboarding script, runbooks, and pilot support.',
    acceptanceChecks: [
      'Pipeline runs changes through dev -> staging -> prod with manual approval gate and rehearsed rollback.',
      'Tenant offboarding script completely purges DynamoDB partitions and S3 bucket prefixes with zero leaks.',
      'Load test report (20 concurrent chats, 100-operation plan) maintains sub-second P95 with zero 5xx.',
      'Threat model document and OpenAPI 3.1 specification fully validate.',
    ],
  },
  {
    id: 6,
    title: 'Files & Bulk Data Operations',
    share: '10%',
    tasksCount: 37,
    scopeSummary: 'Deterministic CSV/XLSX plain-language transformations, 20,000-row file batching, undo history, and ERP bulk import/export.',
    acceptanceChecks: [
      'Plain-language transform modifies only targeted column on 20,000 rows without touching untouched cells.',
      'Undo returns file to identical original byte-state.',
      'Missing column names rejected with available headers; hostile formulas (=CMD, =HYPERLINK) sanitized.',
      'Export and import jobs track status with tenant isolation.',
    ],
  },
  {
    id: 7,
    title: 'Further Business Agents (Pricing, Metadata, Formulas)',
    share: '16%',
    tasksCount: 24,
    scopeSummary: 'Authoring 4 specialist packages: SEO metadata, attributes & values, basic product setup, and conditions & formulas with shared evaluation suite.',
    acceptanceChecks: [
      'All 4 agents pass end-to-end evaluation with before-and-after diff approval.',
      'Evaluation set (20+ conversations per agent) maintains >= 95% pass threshold.',
      'Combined routing evaluation confirms zero routing degradation across all registered agents.',
      'Agent cards document exact tools, boundary constraints, and isolation guarantees.',
    ],
  },
];

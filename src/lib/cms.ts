import {
  certifications as fallbackCertifications,
  company as fallbackCompany,
  equipment as fallbackEquipment,
  productLines as fallbackProductLines,
} from "../data/site";

export type ProductIcon = "cog" | "refresh" | "slice" | "crosshair" | "layers";

export type ProductLine = {
  slug: string;
  name: string;
  shortName: string;
  summary: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: ProductIcon;
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

export type CompanyInfo = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
  address: string;
  hours: string;
  privacyPolicyUrl?: string;
};

export type EquipmentItem = {
  name: string;
  model: string;
  quantity: number;
  capability?: string;
};

export type Certification = {
  name: string;
  issuer: string;
  validFrom?: string;
  validUntil?: string;
};

type StrapiMedia = {
  url?: string;
  alternativeText?: string | null;
  name?: string;
};

type StrapiCollectionResponse<T> = {
  data: T[];
  meta?: {
    pagination?: {
      total?: number;
    };
  };
};

type StrapiProductLine = {
  slug?: string;
  name?: string;
  summary?: string | null;
  description?: string | null;
  leadTime?: string | null;
  sortOrder?: number | null;
  material?: Array<{ name?: string }>;
  specification?: Array<{ name?: string }>;
  tolerances?: string[] | null;
  applications?: string[] | null;
  surfaceTreatments?: string[] | null;
  images?: StrapiMedia[];
};

type StrapiCompanyInfo = {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
  privacyPolicyUrl?: string;
};

type StrapiEquipment = {
  name?: string;
  model?: string;
  quantity?: number | null;
  capability?: string;
};

type StrapiCertification = {
  name?: string;
  issuer?: string;
  validFrom?: string;
  validUntil?: string;
};

const CMS_URL = (
  import.meta.env.PUBLIC_STRAPI_URL ?? "http://127.0.0.1:1337"
).replace(/\/$/, "");
const API_TOKEN = import.meta.env.STRAPI_API_TOKEN;

function absoluteMediaUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${CMS_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function cmsFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${CMS_URL}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(API_TOKEN ? { authorization: `Bearer ${API_TOKEN}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Strapi request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

async function fetchCollection<T>(path: string): Promise<T[]> {
  const response = await cmsFetch<StrapiCollectionResponse<T>>(path);
  return response.data ?? [];
}

function iconForSlug(slug: string): ProductIcon {
  if (slug.includes("turning")) return "refresh";
  if (slug.includes("milling")) return "slice";
  if (slug.includes("5-axis")) return "crosshair";
  if (slug.includes("sheet-metal")) return "layers";
  return "cog";
}

function mapProductLine(item: StrapiProductLine): ProductLine {
  const slug = item.slug || "cnc-machining";
  const name =
    item.name ||
    fallbackProductLines.find((line) => line.slug === slug)?.name ||
    "CNC Machining";
  const fallback = fallbackProductLines.find((line) => line.slug === slug);
  const image =
    absoluteMediaUrl(item.images?.[0]?.url) ||
    fallback?.image ||
    "/images/hero-cnc.jpg";

  return {
    slug,
    name,
    shortName: fallback?.shortName ?? name,
    summary: item.summary || fallback?.summary || "",
    description: item.description || fallback?.description || "",
    image,
    imageAlt:
      item.images?.[0]?.alternativeText ||
      item.images?.[0]?.name ||
      fallback?.imageAlt ||
      name,
    icon: iconForSlug(slug),
    leadTime: item.leadTime || fallback?.leadTime || "Contact for lead time",
    tolerances: item.tolerances ?? fallback?.tolerances ?? [],
    surfaceTreatments:
      item.surfaceTreatments ?? fallback?.surfaceTreatments ?? [],
    applications: item.applications ?? fallback?.applications ?? [],
    materials:
      item.material?.map((material) => material.name ?? "").filter(Boolean) ??
      fallback?.materials ??
      [],
    specifications:
      item.specification?.map((spec) => ({
        label: spec.name ?? "",
        value: spec.name ?? "",
      })) ??
      fallback?.specifications ??
      [],
  };
}

export async function getProductLines(): Promise<ProductLine[]> {
  try {
    const items = await fetchCollection<StrapiProductLine>(
      "/api/product-lines?populate=*&sort=sortOrder:asc&pagination[pageSize]=100",
    );

    if (items.length === 0) return fallbackProductLines;

    return items.map(mapProductLine);
  } catch {
    return fallbackProductLines;
  }
}

export async function getCompany(): Promise<CompanyInfo> {
  try {
    const items = await fetchCollection<StrapiCompanyInfo>(
      "/api/company-infos?populate=*",
    );
    const item = items[0];

    if (!item) return fallbackCompany;

    return {
      name: item.companyName || fallbackCompany.name,
      legalName: item.companyName || fallbackCompany.legalName,
      email: item.email || fallbackCompany.email,
      phone: item.phone || fallbackCompany.phone,
      whatsapp: item.whatsapp || fallbackCompany.whatsapp,
      linkedin: item.linkedin || fallbackCompany.linkedin,
      address: item.address || fallbackCompany.address,
      hours: fallbackCompany.hours,
      privacyPolicyUrl: item.privacyPolicyUrl || "/privacy",
    };
  } catch {
    return fallbackCompany;
  }
}

export async function getEquipment(): Promise<EquipmentItem[]> {
  try {
    const items = await fetchCollection<StrapiEquipment>(
      "/api/equipment2?populate=*",
    );

    if (items.length === 0) return fallbackEquipment;

    return items.map((item) => ({
      name: item.name || "",
      model: item.model || "",
      quantity: item.quantity ?? 0,
      capability: item.capability || "",
    }));
  } catch {
    return fallbackEquipment;
  }
}

export async function getCertifications(): Promise<Certification[]> {
  try {
    const items = await fetchCollection<StrapiCertification>(
      "/api/certifications?populate=*&sort=sortOrder:asc",
    );

    if (items.length === 0) return fallbackCertifications;

    return items.map((item) => ({
      name: item.name || "",
      issuer: item.issuer || "",
      validFrom: item.validFrom || "",
      validUntil: item.validUntil || "",
    }));
  } catch {
    return fallbackCertifications;
  }
}

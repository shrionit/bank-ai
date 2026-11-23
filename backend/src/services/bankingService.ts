import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDatasourceDir(): string {
  // 1. Try cwd-relative src/datasource
  const cwdSrc = path.resolve(process.cwd(), "src/datasource");
  if (fs.existsSync(cwdSrc)) return cwdSrc;

  // 2. Try relative to compiled dist/services -> ../../src/datasource
  const compiledSrc = path.resolve(__dirname, "../../src/datasource");
  if (fs.existsSync(compiledSrc)) return compiledSrc;

  // 3. Try relative to src/services -> ../datasource
  const relativeSrc = path.resolve(__dirname, "../datasource");
  if (fs.existsSync(relativeSrc)) return relativeSrc;

  return cwdSrc;
}

const datasourceDir = getDatasourceDir();

export interface BankCard {
  name: string;
  category: string[];
  network: string;
  description: string;
  benefits: string[];
  annual_fee?: number;
  currency?: string;
  annual_fee_waiver?: string;
  eligibility?: Record<string, any>;
  qualifying_conditions?: string[];
  reward_cap?: Record<string, any>;
}

export interface BankServiceCategory {
  category: string;
  description: string;
  products: string[];
}

export interface BankInfoData {
  bank: string;
  full_name: string;
  country: string;
  headquarters: string;
  currency: {
    name: string;
    code: string;
    symbol: string;
  };
  website: string;
  description: string;
  business_areas: string[];
  digital_platforms: Array<{ name: string; description: string }>;
  official_sources: string[];
}

export class BankingService {
  private bankInfo: BankInfoData;
  private servicesData: { bank: string; services: BankServiceCategory[]; official_sources: string[] };
  private cardsData: {
    bank: string;
    cards: BankCard[];
    general_eligibility: Record<string, any>;
    common_fees: Record<string, any>;
    official_sources: string[];
  };

  constructor() {
    this.bankInfo = this.readJsonFile<BankInfoData>("bank_info.json");
    this.servicesData = this.readJsonFile("bank_services.json");
    this.cardsData = this.readJsonFile("bank_cards.json");
  }

  private readJsonFile<T>(filename: string): T {
    const filePath = path.join(datasourceDir, filename);
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  }

  /**
   * Fetches general bank profile, headquarters, currency, and digital platforms.
   */
  getBankInfo() {
    return {
      bank: this.bankInfo.bank,
      fullName: this.bankInfo.full_name,
      country: this.bankInfo.country,
      headquarters: this.bankInfo.headquarters,
      currency: this.bankInfo.currency,
      description: this.bankInfo.description,
      businessAreas: this.bankInfo.business_areas,
      digitalPlatforms: this.bankInfo.digital_platforms,
    };
  }

  /**
   * Fetches all available DBS Bank services and products.
   */
  getServices() {
    return this.servicesData.services;
  }

  /**
   * Fetches all available DBS credit and debit cards.
   */
  getCards() {
    return this.cardsData.cards;
  }

  /**
   * Fetches general card eligibility (minimum age, income requirements) and common card fees.
   */
  getCardEligibilityAndFees(cardName?: string) {
    const card = cardName
      ? this.cardsData.cards.find((c) =>
          c.name.toLowerCase().includes(cardName.toLowerCase().trim())
        )
      : undefined;

    return {
      cardSpecific: card
        ? {
            name: card.name,
            annualFee: card.annual_fee,
            currency: card.currency,
            annualFeeWaiver: card.annual_fee_waiver,
            eligibility: card.eligibility,
            qualifyingConditions: card.qualifying_conditions,
            rewardCap: card.reward_cap,
          }
        : null,
      generalEligibility: this.cardsData.general_eligibility,
      commonFees: this.cardsData.common_fees,
    };
  }
}

export const bankingService = new BankingService();

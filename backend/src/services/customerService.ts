import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

function generateCardNumber(prefix = "4532"): string {
  const randomDigits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
  const raw = `${prefix}${randomDigits}`;
  return raw.replace(/(\d{4})/g, "$1 ").trim();
}

export class CustomerService {
  /**
   * 1. Verification API: Checks if a customer exists in the database by email.
   */
  async verifyCustomer(email: string) {
    if (!email || typeof email !== "string") {
      return { exists: false, customer: null, error: "Valid email is required" };
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail },
    });

    return {
      exists: Boolean(customer),
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            email: customer.email,
          }
        : null,
    };
  }

  /**
   * 2. Onboard Customer: Registers/creates customer in database and returns customer_id.
   */
  async onboardCustomer(name: string, email: string) {
    if (!name || !email) {
      throw new Error("Both name and email are required for onboarding.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const customer = await prisma.customer.upsert({
      where: { email: cleanEmail },
      update: { name: cleanName },
      create: { name: cleanName, email: cleanEmail },
    });

    return {
      success: true,
      customer_id: customer.id,
      name: customer.name,
      email: customer.email,
      message: `Customer onboarded successfully with ID ${customer.id}. Now issuing card...`,
    };
  }

  /**
   * 3. Issue Card: Adds card to customer_cards table linked by customer_id.
   */
  async issueCard(customerId: string, cardType: string, limit: number = 5000.0) {
    if (!customerId || !cardType) {
      throw new Error("Both customerId and cardType are required to issue a card.");
    }

    const cardNumber = generateCardNumber();

    const card = await prisma.customerCard.create({
      data: {
        customer_id: customerId,
        card_type: cardType.trim(),
        card_number: cardNumber,
        limit,
        issued_on: new Date(),
      },
    });

    return {
      success: true,
      card: {
        id: card.id,
        card_type: card.card_type,
        card_number: card.card_number,
        issued_on: card.issued_on.toISOString(),
        limit: card.limit,
      },
    };
  }

  /**
   * 4. Query Cards by Customer ID: Fetches directly from customer_cards table.
   */
  async getCustomerCards(customerId: string) {
    if (!customerId) return [];
    return prisma.customerCard.findMany({
      where: { customer_id: customerId },
      orderBy: { issued_on: "desc" },
    });
  }
}

export const customerService = new CustomerService();

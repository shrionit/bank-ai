import type { AIProvider, BankAIResponse, AIMessage, ToolExecutable, GenerateOptions } from "../providers/AIProvider.js";
import { OllamaProvider } from "../providers/OllamaProvider.js";
import { bankingService } from "./bankingService.js";
import { customerService } from "./customerService.js";

export class AIService {
  private aiProvider: AIProvider;
  private tools: ToolExecutable[];

  constructor(aiProvider?: AIProvider) {
    this.aiProvider = aiProvider || new OllamaProvider({ think: false });
    this.tools = this.initBankingTools();
  }

  /**
   * Initializes the tool list. Each tool definition maps to an internal call to bankingService.
   */
  private initBankingTools(): ToolExecutable[] {
    return [
      {
        definition: {
          type: "function",
          function: {
            name: "get_bank_info",
            description:
              "Retrieves general information about DBS Bank Singapore, including official full name, headquarters location, supported currency, business areas, and digital platforms like DBS digibank and DBS PayLah!.",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
        handler: () => {
          return bankingService.getBankInfo();
        },
      },
      {
        definition: {
          type: "function",
          function: {
            name: "get_bank_services",
            description:
              "Retrieves all available DBS Bank services and products across all categories (Bank Accounts, Deposits, Cards, Payments, Money Transfers, Loans, Investments, Insurance, Digital Banking).",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
        handler: () => {
          return bankingService.getServices();
        },
      },
      {
        definition: {
          type: "function",
          function: {
            name: "get_bank_cards",
            description:
              "Retrieves all available DBS credit and debit cards, including benefits, rewards, cashback rates, air miles, annual fees, and fee waivers.",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
        handler: () => {
          return bankingService.getCards();
        },
      },
      {
        definition: {
          type: "function",
          function: {
            name: "get_card_eligibility_and_fees",
            description:
              "Retrieves credit card eligibility criteria (minimum age, annual income requirements for Singapore Citizens/PR vs Foreigners) and common fees (annual fees, supplementary fees, late payment charges).",
            parameters: {
              type: "object",
              properties: {
                cardName: {
                  type: "string",
                  description: "Optional specific card name to check terms for.",
                },
              },
            },
          },
        },
        handler: (args: { cardName?: string }) => {
          return bankingService.getCardEligibilityAndFees(args?.cardName);
        },
      },
      {
        definition: {
          type: "function",
          function: {
            name: "verify_customer",
            description:
              "Verifies if an email provided by the user already exists in the DBS customer database. Call ONLY when the user has provided their email address.",
            parameters: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "The customer's email address to verify.",
                },
              },
              required: ["email"],
            },
          },
        },
        handler: (args: { email: string }) => {
          return customerService.verifyCustomer(args?.email);
        },
      },
      {
        definition: {
          type: "function",
          function: {
            name: "onboard_customer",
            description:
              "Onboards and registers a new DBS customer with their full legal name and email, returning their unique customer_id. Call ONLY after the user has explicitly confirmed their name and email.",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Customer's full legal name.",
                },
                email: {
                  type: "string",
                  description: "Customer's email address.",
                },
              },
              required: ["name", "email"],
            },
          },
        },
        handler: (args: { name: string; email: string }) => {
          return customerService.onboardCustomer(args?.name, args?.email);
        },
      },
      {
        definition: {
          type: "function",
          function: {
            name: "issue_customer_card",
            description:
              "Issues a new card to an onboarded customer using their customer_id, generating a unique 16-digit card number and credit limit (default SGD 5000). Call ONLY with a valid customer_id after onboarding.",
            parameters: {
              type: "object",
              properties: {
                customer_id: {
                  type: "string",
                  description: "The unique customer ID obtained from onboarding.",
                },
                card_type: {
                  type: "string",
                  description: "The card name or type to issue (e.g., 'DBS Live Fresh Card', 'DBS Altitude Visa Signature').",
                },
                limit: {
                  type: "number",
                  description: "Optional credit limit in SGD (default 5000).",
                },
              },
              required: ["customer_id", "card_type"],
            },
          },
        },
        handler: (args: { customer_id: string; card_type: string; limit?: number }) => {
          return customerService.issueCard(args?.customer_id, args?.card_type, args?.limit);
        },
      },
    ];
  }

  /**
   * Sets or switches the AI provider.
   */
  setProvider(provider: AIProvider) {
    this.aiProvider = provider;
  }

  /**
   * Gets the list of registered banking tools.
   */
  getTools(): ToolExecutable[] {
    return this.tools;
  }

  /**
   * Processes a single prompt with tools passed to the AI provider.
   */
  async ask(prompt: string, options?: GenerateOptions): Promise<BankAIResponse> {
    return this.aiProvider.generateResponse(prompt, {
      tools: this.tools,
      ...options,
    });
  }

  /**
   * Multi-turn chat with conversation history and tools passed to the AI provider.
   */
  async chat(messages: AIMessage[], options?: GenerateOptions): Promise<BankAIResponse> {
    return this.aiProvider.chat(messages, {
      tools: this.tools,
      ...options,
    });
  }
}

export const aiService = new AIService();

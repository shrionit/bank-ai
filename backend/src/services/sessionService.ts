import { randomUUID } from "node:crypto";
import type { AIMessage } from "../types/ai.types.js";

export interface SessionData {
  uniq_id: string;
  messages: AIMessage[];
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class SessionService {
  // In-memory dictionary storing sessions keyed by uniq_id
  private sessions: Record<string, SessionData> = {};

  /**
   * Creates a new session or resets an existing session.
   * If uniq_id is provided, resets (or sets) that session.
   * If uniq_id is omitted, generates a new unique ID.
   */
  createOrResetSession(uniq_id?: string, initialContext: Record<string, any> = {}): SessionData {
    const id = uniq_id && uniq_id.trim() ? uniq_id.trim() : randomUUID();
    const session: SessionData = {
      uniq_id: id,
      messages: [],
      context: {
        ...initialContext,
        createdAt: new Date().toISOString(),
      },
      createdAt: this.sessions[id]?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.sessions[id] = session;
    return session;
  }

  /**
   * Retrieves a session by its uniq_id.
   */
  getSession(uniq_id: string): SessionData | undefined {
    return this.sessions[uniq_id];
  }

  /**
   * Retrieves an existing session or creates a new one if not found.
   */
  getOrCreateSession(uniq_id?: string): SessionData {
    if (uniq_id && this.sessions[uniq_id]) {
      return this.sessions[uniq_id];
    }
    return this.createOrResetSession(uniq_id);
  }

  /**
   * Deletes a session by uniq_id.
   */
  deleteSession(uniq_id: string): boolean {
    if (this.sessions[uniq_id]) {
      delete this.sessions[uniq_id];
      return true;
    }
    return false;
  }

  /**
   * Returns all in-memory sessions dictionary.
   */
  getAllSessions(): Record<string, SessionData> {
    return this.sessions;
  }
}

export const sessionService = new SessionService();

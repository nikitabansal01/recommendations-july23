// Shared local storage for development mode
// This replaces Upstash Redis functionality for local development

export interface ResponseData {
  id: string;
  surveyData: Record<string, unknown>;
  results: Record<string, unknown>;
  email: string | null;
  timestamp: string;
  createdAt: string;
}

export interface EmailData {
  id: string;
  email: string;
  responseId: string | null;
  timestamp: string;
  createdAt: string;
}

class LocalStorage {
  private responses = new Map<string, ResponseData>();
  private emails = new Map<string, EmailData>();
  private responseIds: string[] = [];
  private emailIds: string[] = [];

  // Response methods
  saveResponse(data: ResponseData): void {
    this.responses.set(data.id, data);
    this.responseIds.push(data.id);
    console.log(`Response saved locally. Total responses: ${this.responseIds.length}`);
  }

  getResponse(id: string): ResponseData | undefined {
    return this.responses.get(id);
  }

  getAllResponses(): ResponseData[] {
    const responses = Array.from(this.responses.values());
    // Sort by timestamp (newest first)
    return responses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  updateResponseEmail(responseId: string, email: string): boolean {
    const response = this.responses.get(responseId);
    if (response) {
      response.email = email;
      this.responses.set(responseId, response);
      return true;
    }
    return false;
  }

  // Email methods
  saveEmail(data: EmailData): void {
    this.emails.set(data.id, data);
    this.emailIds.push(data.id);
    console.log(`Email saved locally. Total emails: ${this.emailIds.length}`);
  }

  getAllEmails(): EmailData[] {
    return Array.from(this.emails.values());
  }

  // Utility methods
  getResponseCount(): number {
    return this.responseIds.length;
  }

  getEmailCount(): number {
    return this.emailIds.length;
  }

  // Clear all data (useful for testing)
  clearAll(): void {
    this.responses.clear();
    this.emails.clear();
    this.responseIds = [];
    this.emailIds = [];
    console.log('Local storage cleared');
  }
}

// Export singleton instance
export const localStorage = new LocalStorage();

// Also export a global instance that persists across API calls
declare global {
  var __localStorage: LocalStorage | undefined;
}

export const getGlobalStorage = () => {
  if (!global.__localStorage) {
    global.__localStorage = new LocalStorage();
  }
  return global.__localStorage;
}; 
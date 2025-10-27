/**
 * @file workspaceService.ts
 * @module services/workspaceService
 * @description This module acts as the client-side interface for all interactions with
 * Google Workspace services (Docs, Drive, Gmail, etc.). It has been refactored to
 * align with a federated microservice architecture. All direct GAPI calls have been
 * removed. Instead, this service constructs and sends authenticated GraphQL requests
 * to the Backend-for-Frontend (BFF), which then orchestrates calls to downstream
 * microservices (e.g., GoogleProxyService, AIGatewayService).
 *
 * @security This service no longer handles any third-party tokens (e.g., Google OAuth access tokens).
 * All requests are authenticated via a short-lived JWT, which is managed by a central,
 * higher-level API client. The BFF is responsible for securely retrieving and using
 * third-party tokens from a server-side vault. Client-side responsibility is limited
 * to making authenticated requests to a trusted backend.
 *
 * @performance The performance of these functions is primarily dependent on the network latency
 * between the client and the BFF, and the subsequent orchestration time within the backend.
 * All operations are asynchronous and should not block the main thread.
 *
 * @see bff/schema.graphql - For the complete GraphQL schema.
 * @see services/apiClient.ts - For the implementation of the `graphqlRequest` function.
 */

// Assuming a central API client that handles GraphQL requests and JWT authentication.
import { graphqlRequest } from './apiClient'; // This is a hypothetical import.
import { logError, measurePerformance } from './telemetryService';
import type { SlideSummary } from '../types';

// --- Google Docs Service Proxies ---

/**
 * Creates a new Google Document via the BFF.
 * @param {string} title The title of the new document.
 * @returns {Promise<{ documentId: string; webViewLink: string }>} A promise that resolves with the new document's ID and URL.
 * @throws Will throw an error if the GraphQL mutation fails.
 * @example
 * const newDoc = await createDocument('My New Project Plan');
 * window.open(newDoc.webViewLink);
 */
export const createDocument = async (title: string): Promise<{ documentId: string; webViewLink: string }> => {
  return measurePerformance('workspaceService.createDocument', async () => {
    const mutation = `
      mutation CreateGoogleDoc($title: String!) {
        createGoogleDoc(title: $title) {
          documentId
          webViewLink
        }
      }
    `;
    try {
      const result = await graphqlRequest({ query: mutation, variables: { title } });
      if (!result.data?.createGoogleDoc) {
        throw new Error('Invalid response from server for createGoogleDoc');
      }
      return result.data.createGoogleDoc;
    } catch (error) {
      logError(error as Error, { service: 'workspaceService', function: 'createDocument', title });
      throw new Error(`Failed to create document: ${(error as Error).message}`);
    }
  });
};

/**
 * Inserts text at the beginning of a Google Document via the BFF.
 * @param {string} documentId The ID of the Google Document to modify.
 * @param {string} text The text content to insert.
 * @returns {Promise<void>} A promise that resolves when the text has been inserted.
 * @throws Will throw an error if the GraphQL mutation fails.
 * @example
 * await insertText('some-document-id', 'This is the new heading.');
 */
export const insertText = async (documentId: string, text: string): Promise<void> => {
  return measurePerformance('workspaceService.insertText', async () => {
    const mutation = `
      mutation InsertTextIntoDoc($documentId: ID!, $text: String!) {
        insertTextIntoDoc(documentId: $documentId, text: $text) {
          success
        }
      }
    `;
    try {
      const result = await graphqlRequest({ query: mutation, variables: { documentId, text } });
      if (!result.data?.insertTextIntoDoc?.success) {
        throw new Error('Server reported failure for insertTextIntoDoc');
      }
    } catch (error) {
      logError(error as Error, { service: 'workspaceService', function: 'insertText', documentId });
      throw new Error(`Failed to insert text: ${(error as Error).message}`);
    }
  });
};

// --- Google Drive Service Proxies ---

/**
 * Finds a folder by name in Google Drive or creates it if it doesn't exist, via the BFF.
 * @param {string} folderName The name of the folder to find or create.
 * @returns {Promise<string>} A promise that resolves with the folder's ID.
 * @throws Will throw an error if the GraphQL mutation fails.
 */
export const findOrCreateFolder = async (folderName: string): Promise<string> => {
  return measurePerformance('workspaceService.findOrCreateFolder', async () => {
    const mutation = `
      mutation FindOrCreateGoogleDriveFolder($folderName: String!) {
        findOrCreateGoogleDriveFolder(folderName: $folderName) {
          folderId
        }
      }
    `;
    try {
      const result = await graphqlRequest({ query: mutation, variables: { folderName } });
      if (!result.data?.findOrCreateGoogleDriveFolder?.folderId) {
        throw new Error('Invalid response from server for findOrCreateGoogleDriveFolder');
      }
      return result.data.findOrCreateGoogleDriveFolder.folderId;
    } catch (error) {
      logError(error as Error, { service: 'workspaceService', function: 'findOrCreateFolder', folderName });
      throw new Error(`Failed to find or create folder: ${(error as Error).message}`);
    }
  });
};

/**
 * Uploads a file to a specified folder in Google Drive via the BFF.
 * The client sends the file content, and the BFF handles the multipart upload to Google Drive.
 * @param {string} folderId The ID of the parent folder in Google Drive.
 * @param {string} fileName The desired name for the new file.
 * @param {string} content The file content as a string. For binary data, this would be base64 encoded.
 * @param {string} mimeType The MIME type of the file.
 * @returns {Promise<any>} A promise that resolves with the metadata of the uploaded file.
 * @throws Will throw an error if the GraphQL mutation fails.
 * @security The file content is sent to our trusted BFF, which then securely uploads it to Google Drive.
 * This prevents the client from needing direct upload permissions or complex upload logic.
 */
export const uploadFile = async (folderId: string, fileName: string, content: string, mimeType: string): Promise<any> => {
  return measurePerformance('workspaceService.uploadFile', async () => {
    const mutation = `
      mutation UploadFileToGoogleDrive($folderId: ID!, $fileName: String!, $content: String!, $mimeType: String!) {
        uploadFileToGoogleDrive(folderId: $folderId, fileName: $fileName, content: $content, mimeType: $mimeType) {
          id
          name
          webViewLink
          mimeType
        }
      }
    `;
    try {
      const result = await graphqlRequest({
        query: mutation,
        variables: { folderId, fileName, content, mimeType }
      });
      if (!result.data?.uploadFileToGoogleDrive) {
        throw new Error('Invalid response from server for uploadFileToGoogleDrive');
      }
      return result.data.uploadFileToGoogleDrive;
    } catch (error) {
      logError(error as Error, { service: 'workspaceService', function: 'uploadFile', fileName, mimeType });
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  });
};

// --- Gmail Service Proxies ---

/**
 * Sends an email via the BFF, which uses the user's authenticated Gmail account.
 * @param {string} to The recipient's email address.
 * @param {string} subject The subject of the email.
 * @param {string} bodyHtml The HTML content of the email body.
 * @returns {Promise<any>} A promise that resolves with the result from the Gmail API (e.g., message ID).
 * @throws Will throw an error if the GraphQL mutation fails.
 */
export const sendEmail = async (to: string, subject: string, bodyHtml: string): Promise<any> => {
  return measurePerformance('workspaceService.sendEmail', async () => {
    const mutation = `
      mutation SendGmail($to: String!, $subject: String!, $bodyHtml: String!) {
        sendGmail(to: $to, subject: $subject, bodyHtml: $bodyHtml) {
          id
          threadId
        }
      }
    `;
    try {
      const result = await graphqlRequest({ query: mutation, variables: { to, subject, bodyHtml } });
      if (!result.data?.sendGmail) {
        throw new Error('Invalid response from server for sendGmail');
      }
      return result.data.sendGmail;
    } catch (error) {
      logError(error as Error, { service: 'workspaceService', function: 'sendEmail', to, subject });
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  });
};

// --- Stubs for other Workspace services, now pointing to the BFF ---
// These demonstrate how the pattern would be extended for other services.

/**
 * Appends a row of data to a Google Sheet via the BFF.
 * @param {string} sheetId The ID of the Google Sheet.
 * @param {any[]} rowData An array of values for the row.
 * @returns {Promise<void>}
 * @throws Will throw an error if the GraphQL mutation fails.
 */
export const appendRowToSheet = async (sheetId: string, rowData: any[]): Promise<void> => {
  console.log('appendRowToSheet call would be proxied to BFF', sheetId, rowData);
  const mutation = `
    mutation AppendRowToGoogleSheet($sheetId: ID!, $rowData: [String!]!) {
      appendRowToGoogleSheet(sheetId: $sheetId, rowData: $rowData) {
        success
      }
    }
  `;
  try {
    await graphqlRequest({ query: mutation, variables: { sheetId, rowData } });
  } catch (error) {
      logError(error as Error, { service: 'workspaceService', function: 'appendRowToSheet', sheetId });
      throw new Error(`Failed to append row to sheet: ${(error as Error).message}`);
  }
};

/**
 * Creates a new task in Google Tasks via the BFF.
 * @param {string} listId The ID of the task list.
 * @param {string} title The title of the new task.
 * @param {string} notes Optional notes for the task.
 * @returns {Promise<void>}
 * @throws Will throw an error if the GraphQL mutation fails.
 */
export const createTask = async (listId: string, title: string, notes: string): Promise<void> => {
  console.log('createTask call would be proxied to BFF', listId, title, notes);
   const mutation = `
    mutation CreateGoogleTask($listId: ID!, $title: String!, $notes: String) {
      createGoogleTask(listId: $listId, title: $title, notes: $notes) {
        id
        title
      }
    }
  `;
  try {
    await graphqlRequest({ query: mutation, variables: { listId, title, notes } });
  } catch (error) {
      logError(error as Error, { service: 'workspaceService', function: 'createTask', listId, title });
      throw new Error(`Failed to create task: ${(error as Error).message}`);
  }
};

/**
 * Creates a new event in Google Calendar via the BFF.
 * @param {string} title The title of the event.
 * @param {string} description A description for the event.
 * @param {string} date The date for the event in ISO format.
 * @returns {Promise<void>}
 * @throws Will throw an error if the GraphQL mutation fails.
 */
export const createCalendarEvent = async (title: string, description: string, date: string): Promise<void> => {
  console.log('createCalendarEvent call would be proxied to BFF', title, description, date);
  const mutation = `
    mutation CreateGoogleCalendarEvent($title: String!, $description: String, $startTime: String!, $endTime: String!) {
      createGoogleCalendarEvent(title: $title, description: $description, startTime: $startTime, endTime: $endTime) {
        id
        htmlLink
      }
    }
  `;
  // For simplicity, assuming date is converted to start/end times elsewhere.
  const startTime = new Date(date).toISOString();
  const endTime = new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString(); // 1 hour event

  try {
    await graphqlRequest({ query: mutation, variables: { title, description, startTime, endTime } });
  } catch (error) {
      logError(error as Error, { service: 'workspaceService', function: 'createCalendarEvent', title });
      throw new Error(`Failed to create calendar event: ${(error as Error).message}`);
  }
};

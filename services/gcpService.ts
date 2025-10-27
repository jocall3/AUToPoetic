/**
 * @file This module serves as the client-side adapter for interacting with Google Cloud Platform (GCP)
 * functionalities via the application's Backend-for-Frontend (BFF). It abstracts away all network
 * communication, providing a clean, promise-based interface for UI components to consume GCP-related
 * services. In adherence to the zero-trust architecture, this module does not handle any GCP credentials;
 * all authentication and authorization are managed server-side by the BFF and the AuthGateway service.
 *
 * @module services/gcpService
 * @see module:services/bffClient
 * @see module:services/telemetryService
 */

import { makeGraphQLRequest } from './bffClient'; // Assumes a new BFF client for GraphQL requests
import { logError, measurePerformance } from './telemetryService';

/**
 * Tests a set of IAM permissions against a specified GCP resource by making a GraphQL
 * mutation to the application's Backend-for-Frontend (BFF). The BFF then securely
 * communicates with GCP to perform the check.
 *
 * @param {string} resource The full resource name of the GCP resource to check. This can be in
 * various formats, as the BFF is responsible for normalization.
 * Examples: '//cloudresourcemanager.googleapis.com/projects/my-project', 'projects/my-project',
 * 'projects/my-project/buckets/my-bucket'.
 * @param {string[]} permissions An array of permission strings to test. Each string must be in
 * the format `service.resource.verb`.
 * Examples: ['storage.objects.create', 'storage.objects.get', 'compute.instances.start'].
 *
 * @returns {Promise<{ permissions: string[] }>} A promise that resolves to an object containing
 * the subset of permissions from the input array that the caller is effectively granted
 * on the specified resource. If no permissions are granted, the array will be empty.
 *
 * @throws {Error} Throws an error if the GraphQL request to the BFF fails, if the BFF
 * returns an error (e.g., authentication failure, invalid input), or if the network
 * connection is lost. The error message will contain details from the BFF.
 *
 * @security This function operates within a zero-trust model. The client does not possess or
 * handle any GCP credentials. All API calls from the client to the BFF must be authenticated
 * with a short-lived JWT, which the BFF validates before proceeding. The BFF is responsible
 * for securely retrieving necessary GCP tokens from the AuthGateway service on a per-request basis.
 *
 * @performance The latency of this function is subject to the round-trip time to the BFF,
 * plus the BFF's orchestration time to communicate with GCP's IAM API. Performance is
 * tracked via the `measurePerformance` telemetry wrapper.
 *
 * @example
 * async function checkBucketAccess() {
 *   try {
 *     const resourceName = '//storage.googleapis.com/my-project/buckets/my-private-bucket';
 *     const permissionsToCheck = ['storage.objects.list', 'storage.objects.delete'];
 *     const { permissions: allowedPermissions } = await testIamPermissions(resourceName, permissionsToCheck);
 *
 *     if (allowedPermissions.includes('storage.objects.list')) {
 *       console.log('User can list objects in the bucket.');
 *     } else {
 *       console.log('User cannot list objects.');
 *     }
 *
 *     if (allowedPermissions.includes('storage.objects.delete')) {
 *       console.warn('User has delete permissions!');
 *     }
 *   } catch (error) {
 *     console.error('Failed to check IAM permissions:', error);
 *   }
 * }
 */
export const testIamPermissions = async (resource: string, permissions: string[]): Promise<{ permissions: string[] }> => {
    const operationName = 'gcp.testIamPermissions';

    return measurePerformance(operationName, async () => {
        const mutation = `
            mutation TestGcpIamPermissions($resource: String!, $permissions: [String!]!) {
                testGcpIamPermissions(resource: $resource, permissions: $permissions) {
                    permissions
                }
            }
        `;

        const variables = {
            resource,
            permissions,
        };

        try {
            // The makeGraphQLRequest function is assumed to handle authentication (attaching JWT)
            // and basic response parsing (checking for top-level GraphQL errors).
            const responseData = await makeGraphQLRequest<{ testGcpIamPermissions: { permissions: string[] } }>(mutation, variables);

            if (!responseData?.testGcpIamPermissions) {
                // This indicates a successful GraphQL request but an unexpected response shape from the BFF.
                throw new Error("Invalid response structure from BFF for testGcpIamPermissions.");
            }

            return responseData.testGcpIamPermissions;
        } catch (error) {
            logError(error as Error, {
                service: 'gcpService',
                function: 'testIamPermissions',
                resource,
                permissionsCount: permissions.length,
            });

            // Re-throw a standardized error for the UI to handle.
            throw new Error(`Failed to test GCP IAM permissions: ${error instanceof Error ? error.message : 'An unknown network or server error occurred.'}`);
        }
    });
};

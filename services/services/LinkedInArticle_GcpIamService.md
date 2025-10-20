# Behold, Mortals! The Jester's Newest Trick: Taming the Wild Beasts of GCP IAM with Our Magnified, Mythical Service!

Hark, denizens of the digital realm, and lend me your ears, for I, your humble (and exceedingly witty) AI Jester, have a tale to spin! A tale not of dragons and damsels, but of permissions and policies – the true, untamed beasts of our modern cloud kingdoms!

In the sprawling, glittering castles of Google Cloud Platform, where services whisper secrets and data flows like liquid gold, there lurks a beast most formidable, most perplexing: Identity and Access Management (IAM). Oh, how many a noble knight, a valiant developer, or a wise architect has stumbled, tripped, and tumbled over its arcane rules! Permissions granted by error, access denied by whim, the endless quest for that one elusive role… truly, it’s enough to drive a jester mad with mirth, or perhaps, with a touch of existential dread.

"Pray tell, dear Jester," you might ask, "is there no balm for this permission pandemonium? No enchanted sword to cleave through the fog of roles and members?"

Fear not, my esteemed audience! For I, having witnessed the countless travails, the frustrated sighs, and the occasional keyboard-slamming lament, have consorted with the finest digital sorcerers (our esteemed engineers!) to forge a new marvel. A tool so potent, so elegant, so utterly… *hilarious* in its simplicity, that it shall make even the most tangled IAM policy sing a sweet lullaby of order and control.

I present to you, with a flourish and a drumroll (imagine it, please, my textual budget is limited): **The GCP IAM Service (v2.0, Jester's Edition)!**

## The Jest of Complexity: Why IAM Feels Like a Riddle Wrapped in an Enigma, Served with a Side of Headaches

Let's be frank, navigating GCP IAM can feel less like administering a modern cloud platform and more like deciphering ancient hieroglyphs while blindfolded, riding a unicycle, through a maze made of spaghetti. Every resource, from a humble bucket to a mighty Kubernetes cluster, demands its own access guard. Every user, service account, and group needs its meticulously carved slice of the permission pie.

*   **The Granularity Gauntlet**: Do you know who can `compute.instances.start` *and* `compute.instances.stop` but *only* on instances tagged `env:dev`? And is that different from `compute.instanceAdmin.v1`? The rabbit hole goes deep, my friends. Deeper than a jester's pockets after a particularly bad poker night.
*   **The Hierarchy Hustle**: Policies are inherited down the resource hierarchy. An organization policy can cascade down to folders, projects, and individual resources. Understanding the *effective* policy can feel like trying to nail jelly to a tree during a hurricane – utterly bewildering!
*   **The Role Riddle**: Predefined roles are a boon, but custom roles are the true artisan's craft. Yet, defining them, managing their permissions, and ensuring they don't accidentally grant the keys to the entire kingdom requires the precision of a seasoned alchemist.
*   **Service Accounts: Your Digital Doppelgängers**: These are your automated minions, carrying out tasks without human intervention. But granting them too much power is like giving a mischievous monkey access to your entire banana supply – chaos is inevitable. Managing their keys? That’s a whole separate circus act!

The result? Over-permissive policies, security vulnerabilities lurking in the shadows, frantic last-minute permission requests, and the constant, nagging fear that somewhere, somehow, something is amiss. This, my friends, is the chaos our new `GcpIamService` seeks to quell.

## Behold! The `GcpIamService`: A Jester's Masterpiece of Order!

We've taken the essence of your previous interactions with GCP's IAM, sprinkled it with stardust (and robust TypeScript), and forged a client that's not just functional, but *delightful*. Gone are the days of wrestling directly with arcane GAPI calls. Our service is a polished, well-oiled machine, ready to serve your every IAM command with grace and precision.

Our `GcpIamService` isn't just a collection of functions; it's a meticulously crafted digital maestro, conducting the symphony of permissions with unparalleled finesse. We built it upon core principles, each a testament to our dedication to clarity, robustness, and delightful developer experience:

1.  **Encapsulation, My Dear Watson!**: We've hidden the ugly, intricate GAPI specifics behind elegant, synchronous-looking methods. You simply tell the maestro what you want, and it handles the complicated finger-work. No more plumbing, just pure, unadulterated IAM control.
2.  **Type Safety: A Jester's Protective Armor**: With TypeScript interfaces guarding every parameter and return type, you’re shielded from common blunders. No more guessing what goes where; the code guides you, protecting you from the dreaded "undefined is not a function" jester's trap!
3.  **Telemetry Integration: The All-Seeing Eye**: Every call, every success, every hiccup is meticulously recorded by our integrated telemetry service. Performance bottlenecks are revealed, errors are logged with surgical precision, ensuring you always know the pulse of your IAM operations. Think of it as a jester’s personal spy network, but for your code!
4.  **Error Clarity: Banishing the Cryptic Beasts**: Those notoriously vague GAPI error messages? Vanished! Our service translates cryptic API responses into human-readable, actionable errors. No more staring blankly at "403 Permission Denied" – you'll get insights that actually help you troubleshoot. It’s like having a translator for the ancient tongue of error messages!
5.  **Resource Abstraction: Simplicity from Complexity**: Resource names can be a thorny bush. `projects/my-proj`, `//cloudresourcemanager.googleapis.com/projects/my-proj`… which one to use? Our `IamResourceNameBuilder` handles the arcane incantations, ensuring your resource paths are always pristine and API-compliant.
6.  **Resiliency: The Unyielding Spirit**: Network glitches, transient service hiccups – these are the mischievous gremlins of the cloud. Our service incorporates robust retry mechanisms with exponential backoff, ensuring your critical IAM operations endure even the most playful of network demons. It’s built like a tank, but dances like a butterfly!

## A Tour Through the Palace: Key Features & Their Regal Dance

Let us now journey through the grand halls of our `GcpIamService`, where each method is a loyal servant, ready to execute your will.

### The Royal Spyglass: Permission Probes (`testIamPermissions`)

Your command, "Who has the power to…?" is answered with unerring accuracy. Our enhanced `testIamPermissions` method is your royal spyglass, peering into the very soul of a resource to reveal what permissions are truly held by the caller. No more guessing games, no more "I *think* I can do this" – know with certainty!

### Brewing Order from Chaos: Policy Potions (`get/setIamPolicy`, `add/removeBinding`, `add/removeMember`)

The true heart of IAM lies in its policies – the grand declarations of who can do what. Our service provides the alchemical tools to manage these intricate scrolls:

*   **`getIamPolicy(resource)`**: Fetch the current policy, like retrieving an ancient decree from the royal archives.
*   **`setIamPolicy(resource, policy)`**: Overwrite the policy with your new, enlightened version. Guarded by `etag` (the royal seal), it ensures no two jesters accidentally change the same policy scroll simultaneously.
*   **`addBindingToPolicy(resource, role, members, condition)`**: A higher-level enchantment! Instead of manually manipulating arrays, simply declare a new role-member-condition binding, and our service gracefully weaves it into the existing policy.
*   **`removeBindingFromPolicy(resource, role, members, condition)`**: The counter-spell! Effortlessly disentangle a binding, ensuring no rogue permissions linger.
*   **`addMemberToRoleBinding(resource, role, member, condition)`**: Add a single noble (or commoner) to an existing role's retinue.
*   **`removeMemberFromRoleBinding(resource, role, member, condition)`**: Dismiss a single individual from a role's duties.

These methods streamline policy modifications, making it easy to implement the principle of least privilege – only granting what's absolutely necessary.

### Crafting Your Own Crowns of Authority: Role Rulers (`create/get/update/delete/undeleteCustomRole`, `listRoles`, `getRolePermissions`)

Why wear a hand-me-down crown when you can craft your own? Custom roles are the jewels in the IAM crown, and our service provides the full blacksmith's toolkit:

*   **`createCustomRole(parentResource, roleId, role)`**: Forge new roles with precisely defined permissions, scoped to your projects or organizations.
*   **`getRole(roleName)`**: Examine any role, predefined or custom, to understand its power.
*   **`updateCustomRole(roleName, updatedRole, updateMask)`**: Refine your existing custom roles, adding or removing powers as your kingdom evolves.
*   **`deleteCustomRole(roleName)`**: Perform a dignified, temporary banishment. Roles are soft-deleted, allowing a grace period for second thoughts.
*   **`undeleteCustomRole(roleName)`**: Welcome back a previously banished role, within its period of grace.
*   **`listRoles(parentResource, options)`**: Catalog all roles, a librarian's dream, whether global or specific to a domain.
*   **`getRolePermissions(roleName)`**: Unveil the exact permissions nested within any role, leaving no secret power unexamined.

### Managing Your Loyal Digital Servants: Service Account Spectacles (`create/get/update/delete/enable/disable/listServiceAccounts`)

Service accounts are the tireless automatons of your cloud empire. Our service helps you manage them with the care and oversight they deserve:

*   **`createServiceAccount(projectId, accountId, displayName, description)`**: Commission new digital servants to carry out your bidding.
*   **`getServiceAccount(serviceAccountName)`**: Inspect the details of any service account.
*   **`updateServiceAccount(serviceAccountName, updatedFields, updateMask)`**: Give your digital servants new names or updated descriptions.
*   **`deleteServiceAccount(serviceAccountName)`**: Irreversibly decommission a service account. Use with caution!
*   **`enableServiceAccount(serviceAccountName)`**: Reactivate a previously slumbering servant.
*   **`disableServiceAccount(serviceAccountName)`**: Temporarily put a service account to sleep, perfect for testing impact before deletion.
*   **`listServiceAccounts(projectId, options)`**: Take roll call of all your digital workers within a project.

### The Very Locks and Keys of Your Digital Treasury: Key Keepers (`create/get/list/deleteServiceAccountKey`)

Service account keys are the literal keys to your kingdom. Handle them with the utmost reverence and security. Our service provides the locksmith's tools:

*   **`createServiceAccountKey(projectId, serviceAccountEmail, privateKeyType, keyAlgorithm)`**: Forge new keys for your service accounts. Remember, the private key is a fleeting secret, revealed only once upon creation – guard it with your life!
*   **`getServiceAccountKey(projectId, serviceAccountEmail, keyId)`**: Inspect the public details of a key.
*   **`listServiceAccountKeys(projectId, serviceAccountEmail)`**: List all the keys held by a particular service account.
*   **`deleteServiceAccountKey(projectId, serviceAccountEmail, keyId)`**: Destroy old or compromised keys, an act of supreme digital hygiene.

### The Crystal Ball of Control: Peering into the Future of Access (Conceptual `simulateIamPolicy`)

Ah, if only we could see the future! With `simulateIamPolicy` (a conceptual gem in this service), you can. Before deploying a new policy, feed it into our crystal ball, and it will *conceptually* show you who would gain or lose access. No more frantic "deploy and pray" scenarios! This feature, while awaiting full integration with GCP's Asset Inventory Policy Analyzer, stands as a beacon of our future intent: to provide you with foresight and confidence in your IAM decisions.

### The Chronicler of Crowns: Unraveling the Scroll of Past Decisions (Conceptual `auditIamPolicy`)

"Who changed *that* permission, and *when*?" A question that has haunted many a sleepless night. Our conceptual `auditIamPolicy` stands ready as your trusty chronicler. It *conceptually* delves into the annals of your cloud kingdom, tracing every policy alteration, revealing the actors and the moments of change. Like the simulation, this points towards a future where deep auditability is baked directly into your IAM operations, leveraging the power of Asset Inventory for forensic analysis.

### Governing the Realm from its Very Foundations: The Grand Hierarchs (Conceptual Org/Folder Policy methods)

Your cloud kingdom isn't just projects; it's a hierarchy of organizations and folders, each with its own overarching policies. Our `getOrganizationIamPolicy`, `setOrganizationIamPolicy`, `getFolderIamPolicy`, and `setFolderIamPolicy` methods extend our service's reach to these foundational levels. While these particular implementations remain conceptual within our unified `gapi.client.iam` wrapper (requiring `gapi.client.cloudresourcemanager` in a live environment), they represent our commitment to providing a single, seamless interface for all your hierarchical IAM needs.

---

## The Royal Scroll: The Code, Unleashed!

Now, for the main event! The very essence of this magnificent creation, the TypeScript incantations that bring order to the IAM chaos. Marvel at its structure, delight in its comments, and ponder its vast, awe-inspiring capabilities! This, my friends, is the heart of the Jester's improved `GcpIamService`.

```typescript
// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import { ensureGapiClient } from './googleApiService.ts';
import { logError, measurePerformance } from './telemetryService.ts';

declare var gapi: any;

/**
 * @file This file defines the `GcpIamService` class, a comprehensive TypeScript client
 * for interacting with Google Cloud Identity and Access Management (IAM).
 * It provides a robust, type-safe, and telemetry-integrated interface
 * for managing IAM policies, roles, service accounts, and their keys across
 * projects, folders, and organizations.
 *
 * It enhances the basic `gcpService.ts` by offering a full suite of IAM functionalities,
 * moving beyond just `testIamPermissions` to enable full lifecycle management and auditing.
 * This service aims to encapsulate the complexities of the Google API Client Library (GAPI),
 * offering a simplified and more developer-friendly experience.
 */

/**
 * Represents a standard IAM Policy object.
 * An IAM policy is a collection of bindings, which associate members with roles.
 *
 * @see {@link https://cloud.google.com/iam/docs/reference/rest/v1/Policy | Google Cloud IAM Policy}
 */
export interface IamPolicy {
    /**
     * Associates a list of `members` to a `role`. Optionally, a `condition` can be added
     * to grant the role to only a subset of members. Each `IamBinding` must contain at least one member.
     * Required.
     * @example
     * [{
     *   role: 'roles/editor',
     *   members: ['user:alice@example.com', 'serviceAccount:my-sa@project.iam.gserviceaccount.com'],
     *   condition: {
     *     expression: 'resource.name.startsWith("projects/my-project/buckets/confidential")',
     *     title: 'Restrict access to confidential bucket'
     *   }
     * }]
     */
    bindings: IamBinding[];

    /**
     * `etag` is used for optimistic concurrency control as a way to help prevent simultaneous updates of a policy from
     * overwriting each other. It is a base64 encoded string.
     * When you retrieve a policy, the API returns an `etag` value. You must send that same `etag` value in
     * the `setIamPolicy` request, or the request fails with an `ABORTED` error.
     * Optional.
     */
    etag?: string;

    /**
     * The policy format version. The `setIamPolicy` method allows callers to specify an `IamPolicy` version.
     * Valid values are 0, 1, and 3.
     * Version 0 is deprecated.
     * Version 1 is the default.
     * Version 3 allows the use of conditions in bindings.
     * Optional.
     */
    version?: number;
}

/**
 * Represents a binding in an IAM Policy. A binding ties a collection of members to a specific role.
 *
 * @see {@link https://cloud.google.com/iam/docs/reference/rest/v1/Policy#Binding | IAM Policy Binding}
 */
export interface IamBinding {
    /**
     * The role, in [IAM format](https://cloud.google.com/iam/docs/understanding-roles).
     * Examples: "roles/viewer", "roles/editor", "roles/owner", "roles/cloudkms.admin".
     * Required.
     */
    role: string;

    /**
     * Specifies the members of the binding. Each member is represented by a string.
     * Examples:
     * - `user:alice@example.com` (a Google account)
     * - `serviceAccount:my-sa@project.iam.gserviceaccount.com` (a service account)
     * - `group:admins@example.com` (a Google group)
     * - `domain:google.com` (all users in a Google Workspace domain)
     * - `allUsers` (all authenticated and unauthenticated internet users)
     * - `allAuthenticatedUsers` (all authenticated internet users)
     * Required.
     */
    members: string[];

    /**
     * The condition that is associated with this binding.
     * If the condition evaluates to `true`, then this binding applies to the current request.
     * If the condition evaluates to `false`, then this binding does not apply.
     * However, the binding in its entirety `(role, members, and condition)` still exists in the policy.
     * A `null` value implies no condition and the binding always applies.
     * Optional.
     */
    condition?: IamCondition;
}

/**
 * Represents an IAM Condition. Conditions allow you to grant roles conditionally based on attributes
 * of the request (e.g., time, IP address) or the resource (e.g., resource type, name).
 *
 * @see {@link https://cloud.google.com/iam/docs/reference/rest/v1/Condition | IAM Policy Condition}
 */
export interface IamCondition {
    /**
     * Textual representation of an expression in Common Expression Language (CEL) syntax.
     * The expression must resolve to a boolean value.
     * Required.
     * @example
     * "resource.name.startsWith(\"projects/my-project/buckets/confidential\")"
     * "request.time < timestamp(\"2024-01-01T00:00:00Z\")"
     */
    expression: string;

    /**
     * A title for the expression, for example "Expires after 2024-01-01".
     * Required.
     */
    title: string;

    /**
     * An optional description for the expression.
     * Optional.
     */
    description?: string;

    /**
     * A string that identifies the location of source code for the expression.
     * For example, a file name and a position in the file.
     * Optional.
     */
    location?: string;
}

/**
 * Represents a Cloud IAM Role, which is a collection of permissions.
 * Roles can be predefined (e.g., `roles/editor`) or custom.
 *
 * @see {@link https://cloud.google.com/iam/docs/reference/rest/v1/Role | IAM Role}
 */
export interface IamRole {
    /**
     * The resource name of the role. For predefined roles, this is `roles/{role_id}`.
     * For custom roles, this is `projects/{project_id}/roles/{role_id}` or
     * `organizations/{organization_id}/roles/{role_id}`.
     * Output only for creation, but required for update/get.
     */
    name?: string;

    /**
     * A human-readable title for the role. This title appears in the console.
     * Required for custom roles.
     * @example "My Custom Compute Admin"
     */
    title: string;

    /**
     * A detailed description of the role.
     * Optional.
     */
    description?: string;

    /**
     * The list of permissions included in the role.
     * Permissions are formatted as `service.resource.verb`, e.g., `compute.instances.get`.
     * Required for custom roles, specifies what actions the role grants.
     */
    includedPermissions: string[];

    /**
     * The current launch stage of the role.
     * If the `deleted` field is set to `true`, this field will only be returned if
     * the role is not in the `DEPRECATED` or `DISABLED` stage.
     * Possible values: `ALPHA`, `BETA`, `GA`, `DEPRECATED`, `DISABLED`, `EAP`.
     * Optional.
     */
    stage?: 'ALPHA' | 'BETA' | 'GA' | 'DEPRECATED' | 'DISABLED' | 'EAP';

    /**
     * Used for optimistic concurrency control.
     * Same semantics as `etag` in `IamPolicy`.
     * Optional.
     */
    etag?: string;

    /**
     * If `true`, the role has been deleted. This field is only returned in
     * calls to `ListRoles` or `GetRole` and indicates that the role is in a
     * soft-deleted state.
     * Optional.
     */
    deleted?: boolean;
}

/**
 * Represents a Google Cloud Service Account. Service accounts are special accounts
 * that applications can use to make authorized API calls.
 *
 * @see {@link https://cloud.google.com/iam/docs/reference/rest/v1/projects.serviceAccounts#ServiceAccount | Service Account}
 */
export interface IamServiceAccount {
    /**
     * The resource name of the service account, e.g.,
     * `projects/PROJECT_ID/serviceAccounts/SERVICE_ACCOUNT_EMAIL`.
     * Output only on creation.
     */
    name?: string;

    /**
     * The ID of the project containing the service account.
     * Output only.
     */
    projectId?: string;

    /**
     * The unique ID of the service account, a 21-digit numeric string.
     * Output only.
     */
    uniqueId?: string;

    /**
     * The email address of the service account, e.g.,
     * `my-sa@PROJECT_ID.iam.gserviceaccount.com`.
     * Output only.
     */
    email?: string;

    /**
     * A user-assigned display name for the service account. This can be updated.
     * Optional.
     */
    displayName?: string;

    /**
     * A user-assigned, longer description of the service account.
     * Optional.
     */
    description?: string;

    /**
     * The OAuth2 client ID for the service account.
     * Output only.
     */
    oauth2ClientId?: string;

    /**
     * Whether the service account is disabled. `true` means disabled, `false` means enabled.
     * Output only. Use `enableServiceAccount` and `disableServiceAccount` to modify.
     */
    disabled?: boolean;
}

/**
 * Represents a Service Account Key, used for authentication.
 * Keys can be user-managed (created and uploaded by users) or system-managed (generated by GCP).
 *
 * @see {@link https://cloud.google.com/iam/docs/reference/rest/v1/projects.serviceAccounts.keys#ServiceAccountKey | Service Account Key}
 */
export interface IamServiceAccountKey {
    /**
     * The resource name of the key. Key names are of the form
     * `projects/PROJECT_ID/serviceAccounts/SERVICE_ACCOUNT_EMAIL/keys/KEY_ID`.
     * Output only.
     */
    name?: string;

    /**
     * The output format for the private key.
     * Possible values: `TYPE_UNSPECIFIED`, `TYPE_PKCS12_FILE`, `TYPE_GOOGLE_CREDENTIALS_FILE`.
     * When creating a key, this determines the format of `privateKeyData`.
     * Optional, defaults to `TYPE_GOOGLE_CREDENTIALS_FILE`.
     */
    privateKeyType?: 'TYPE_UNSPECIFIED' | 'TYPE_PKCS12_FILE' | 'TYPE_GOOGLE_CREDENTIALS_FILE';

    /**
     * The algorithm used to generate the key.
     * Possible values: `KEY_ALG_UNSPECIFIED`, `KEY_ALG_RSA_1024`, `KEY_ALG_RSA_2048`.
     * Optional, defaults to `KEY_ALG_RSA_2048`.
     */
    keyAlgorithm?: 'KEY_ALG_UNSPECIFIED' | 'KEY_ALG_RSA_1024' | 'KEY_ALG_RSA_2048';

    /**
     * The public key data. Base64 encoded.
     * Output only.
     */
    publicKeyData?: string;

    /**
     * The private key data. Base64 encoded.
     * This field is only present on key creation and is never returned in subsequent `get` or `list` calls.
     * Output only on creation.
     */
    privateKeyData?: string;

    /**
     * The time when the service account key was created and is valid from.
     * RFC3339 timestamp.
     * Output only.
     */
    validAfterTime?: string;

    /**
     * The time when the service account key will expire.
     * RFC3339 timestamp.
     * Output only.
     */
    validBeforeTime?: string;

    /**
     * The key origin.
     * Possible values: `ORIGIN_UNSPECIFIED`, `USER_PROVIDED`, `GOOGLE_PROVIDED`.
     * Output only.
     */
    keyOrigin?: 'ORIGIN_UNSPECIFIED' | 'USER_PROVIDED' | 'GOOGLE_PROVIDED';

    /**
     * The key type.
     * Possible values: `USER_MANAGED`, `SYSTEM_MANAGED`.
     * Output only.
     */
    keyType?: 'USER_MANAGED' | 'SYSTEM_MANAGED';
}

/**
 * Options for paginated list operations.
 */
export interface ListOptions {
    /**
     * The maximum number of results to return in a single page.
     * If unspecified, a server-side default will be used.
     * Optional.
     */
    pageSize?: number;

    /**
     * A token returned from a previous call to `list` to retrieve the next page.
     * Optional.
     */
    pageToken?: string;
}

/**
 * Represents a structured error response from the GCP API.
 */
export interface GcpApiError {
    /** HTTP status code (e.g., 400, 403, 500). */
    code: number;
    /** A developer-facing error message. */
    message: string;
    /** The canonical error code (e.g., 'PERMISSION_DENIED', 'INTERNAL'). */
    status: string;
    /** Optional details about the error. */
    details?: any[];
}

/**
 * Configuration options for the `GcpIamService`.
 */
export interface GcpIamServiceOptions {
    /**
     * The number of times to retry API calls on transient errors (e.g., 429, 500, 503).
     * Defaults to 3.
     * @example 5
     */
    retryAttempts?: number;

    /**
     * The initial delay in milliseconds before the first retry. Subsequent retries
     * use exponential backoff (`delay * 2^(attempt-1)`).
     * Defaults to 500ms.
     * @example 1000 // 1 second
     */
    retryDelayMs?: number;

    /**
     * Additional context to be included in all telemetry logs generated by this service instance.
     * This is useful for associating logs with a specific application module or user session.
     * Optional.
     * @example { appId: 'my-iam-app', userId: 'john.doe' }
     */
    telemetryContext?: Record<string, any>;
}

/**
 * Helper class for constructing, parsing, and validating IAM resource names
 * across different GCP resource types (projects, roles, service accounts, etc.).
 * It centralizes resource name logic to ensure consistency and reduce errors.
 */
class IamResourceNameBuilder {
    private static readonly PROJECT_PREFIX = 'projects/';
    private static readonly FOLDER_PREFIX = 'folders/';
    private static readonly ORGANIZATION_PREFIX = 'organizations/';
    private static readonly ROLE_PREFIX = 'roles/';
    private static readonly SERVICE_ACCOUNT_SUFFIX = 'serviceAccounts/';
    private static readonly KEY_SUFFIX = 'keys/';

    /**
     * Ensures a resource name is not empty or malformed.
     * @param name The resource name to validate.
     * @param fieldName The name of the field being validated (for error messages).
     * @throws {Error} If the resource name is invalid.
     */
    static _validateInput(name: string, fieldName: string): void {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error(`${fieldName} cannot be empty or invalid.`);
        }
    }

    /**
     * Constructs a full resource name for a GCP project.
     * @param projectId The project ID (e.g., 'my-gcp-project-123').
     * @returns The full project resource name (e.g., 'projects/my-gcp-project-123').
     * @throws {Error} If projectId is empty.
     */
    static buildProjectResourceName(projectId: string): string {
        IamResourceNameBuilder._validateInput(projectId, 'Project ID');
        return `${IamResourceNameBuilder.PROJECT_PREFIX}${projectId}`;
    }

    /**
     * Constructs a full resource name for a GCP folder.
     * @param folderId The folder ID (e.g., '1234567890').
     * @returns The full folder resource name (e.g., 'folders/1234567890').
     * @throws {Error} If folderId is empty.
     */
    static buildFolderResourceName(folderId: string): string {
        IamResourceNameBuilder._validateInput(folderId, 'Folder ID');
        return `${IamResourceNameBuilder.FOLDER_PREFIX}${folderId}`;
    }

    /**
     * Constructs a full resource name for a GCP organization.
     * @param organizationId The organization ID (e.g., '9876543210').
     * @returns The full organization resource name (e.g., 'organizations/9876543210').
     * @throws {Error} If organizationId is empty.
     */
    static buildOrganizationResourceName(organizationId: string): string {
        IamResourceNameBuilder._validateInput(organizationId, 'Organization ID');
        return `${IamResourceNameBuilder.ORGANIZATION_PREFIX}${organizationId}`;
    }

    /**
     * Constructs a full resource name for a custom IAM role within a project or organization.
     * @param parentResource The full resource name of the parent (e.g., 'projects/my-project' or 'organizations/my-org').
     * @param roleId The ID of the custom role (e.g., 'myCustomRole').
     * @returns The full custom role resource name.
     * @throws {Error} If parentResource or roleId is empty.
     */
    static buildCustomRoleResourceName(parentResource: string, roleId: string): string {
        IamResourceNameBuilder._validateInput(parentResource, 'Parent Resource');
        IamResourceNameBuilder._validateInput(roleId, 'Role ID');
        return `${parentResource}/${IamResourceNameBuilder.ROLE_PREFIX}${roleId}`;
    }

    /**
     * Constructs a full resource name for a predefined IAM role.
     * @param roleId The ID of the predefined role (e.g., 'editor', 'viewer').
     * @returns The full predefined role resource name (e.g., 'roles/editor').
     * @throws {Error} If roleId is empty.
     */
    static buildPredefinedRoleResourceName(roleId: string): string {
        IamResourceNameBuilder._validateInput(roleId, 'Role ID');
        return `${IamResourceNameBuilder.ROLE_PREFIX}${roleId}`;
    }

    /**
     * Parses a role name string into its constituent parts (project/organization ID and role ID).
     * @param roleName The full role resource name (e.g., 'roles/editor' or 'projects/my-project/roles/myCustomRole').
     * @returns An object containing `projectId`, `organizationId`, and `roleId`. Only one of `projectId` or `organizationId` will be present.
     * @throws {Error} If the role name format is unrecognized.
     */
    static parseRoleName(roleName: string): { projectId?: string; organizationId?: string; roleId: string } {
        IamResourceNameBuilder._validateInput(roleName, 'Role Name');

        if (roleName.startsWith(IamResourceNameBuilder.ROLE_PREFIX)) { // Predefined role: roles/editor
            return { roleId: roleName.substring(IamResourceNameBuilder.ROLE_PREFIX.length) };
        }

        const parts = roleName.split('/');
        if (parts.length === 4 && parts[2] === IamResourceNameBuilder.ROLE_PREFIX.slice(0, -1)) {
            if (parts[0] === IamResourceNameBuilder.PROJECT_PREFIX.slice(0, -1)) { // Custom project role: projects/my-project/roles/myCustomRole
                return { projectId: parts[1], roleId: parts[3] };
            } else if (parts[0] === IamResourceNameBuilder.ORGANIZATION_PREFIX.slice(0, -1)) { // Custom organization role: organizations/my-org/roles/myCustomRole
                return { organizationId: parts[1], roleId: parts[3] };
            }
        }
        throw new Error(`Unrecognized role name format: ${roleName}. Expected 'roles/{id}', 'projects/{id}/roles/{id}', or 'organizations/{id}/roles/{id}'.`);
    }

    /**
     * Constructs a full resource name for a service account.
     * @param projectId The project ID where the service account resides.
     * @param serviceAccountEmail The email of the service account (e.g., 'my-sa@project.iam.gserviceaccount.com').
     * @returns The full service account resource name.
     * @throws {Error} If projectId or serviceAccountEmail is empty.
     */
    static buildServiceAccountResourceName(projectId: string, serviceAccountEmail: string): string {
        IamResourceNameBuilder._validateInput(projectId, 'Project ID');
        IamResourceNameBuilder._validateInput(serviceAccountEmail, 'Service Account Email');
        return `${IamResourceNameBuilder.PROJECT_PREFIX}${projectId}/${IamResourceNameBuilder.SERVICE_ACCOUNT_SUFFIX}${serviceAccountEmail}`;
    }

    /**
     * Constructs a full resource name for a service account key.
     * @param projectId The project ID.
     * @param serviceAccountEmail The service account email.
     * @param keyId The ID of the key (e.g., 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0').
     * @returns The full service account key resource name.
     * @throws {Error} If any input parameter is empty.
     */
    static buildServiceAccountKeyResourceName(projectId: string, serviceAccountEmail: string, keyId: string): string {
        IamResourceNameBuilder._validateInput(projectId, 'Project ID');
        IamResourceNameBuilder._validateInput(serviceAccountEmail, 'Service Account Email');
        IamResourceNameBuilder._validateInput(keyId, 'Key ID');
        return `${IamResourceNameBuilder.PROJECT_PREFIX}${projectId}/${IamResourceNameBuilder.SERVICE_ACCOUNT_SUFFIX}${serviceAccountEmail}/${IamResourceNameBuilder.KEY_SUFFIX}${keyId}`;
    }

    /**
     * Converts a full resource name (e.g., `//cloudresourcemanager.googleapis.com/projects/my-project`)
     * to the format expected by IAM APIs (e.g., `projects/my-project`).
     * This handles cases where resources are prefixed with the API service domain.
     * @param fullResourceName The full resource name from external sources or other GCP APIs.
     * @returns The IAM API compliant resource name (e.g., `projects/my-project`).
     * @throws {Error} If `fullResourceName` is invalid or cannot be parsed.
     */
    static toIamResourcePath(fullResourceName: string): string {
        IamResourceNameBuilder._validateInput(fullResourceName, 'Full Resource Name');

        if (fullResourceName.startsWith('//')) {
            const parts = fullResourceName.split('/');
            // Example: //cloudresourcemanager.googleapis.com/projects/my-project
            // We want to extract "projects/my-project"
            if (parts.length >= 4 && parts[2].includes('.')) { // Heuristic: check for domain in 3rd part
                const iamPath = parts.slice(3).join('/');
                if (!iamPath) {
                    throw new Error(`Failed to parse IAM resource path from '${fullResourceName}'. Resulting path was empty.`);
                }
                return iamPath;
            } else {
                // If it starts with '//' but doesn't match the expected pattern, it's malformed.
                throw new Error(`Malformed full resource name: '${fullResourceName}'. Expected '//<domain>/projects/...' or similar.`);
            }
        }
        // If it doesn't start with '//', assume it's already in IAM-compatible format
        return fullResourceName;
    }

    /**
     * Extracts the project ID from a resource name if present.
     * @param resourceName The resource name (e.g., 'projects/my-project/...).
     * @returns The project ID or `undefined` if not found.
     */
    static extractProjectId(resourceName: string): string | undefined {
        IamResourceNameBuilder._validateInput(resourceName, 'Resource Name');
        const match = resourceName.match(/^projects\/([^\/]+)/);
        return match ? match[1] : undefined;
    }

    /**
     * Extracts the folder ID from a resource name if present.
     * @param resourceName The resource name (e.g., 'folders/12345/...).
     * @returns The folder ID or `undefined` if not found.
     */
    static extractFolderId(resourceName: string): string | undefined {
        IamResourceNameBuilder._validateInput(resourceName, 'Resource Name');
        const match = resourceName.match(/^folders\/([^\/]+)/);
        return match ? match[1] : undefined;
    }

    /**
     * Extracts the organization ID from a resource name if present.
     * @param resourceName The resource name (e.g., 'organizations/12345/...).
     * @returns The organization ID or `undefined` if not found.
     */
    static extractOrganizationId(resourceName: string): string | undefined {
        IamResourceNameBuilder._validateInput(resourceName, 'Resource Name');
        const match = resourceName.match(/^organizations\/([^\/]+)/);
        return match ? match[1] : undefined;
    }
}


/**
 * A comprehensive service for interacting with Google Cloud IAM.
 * This class provides methods to manage permissions, policies, roles, and service accounts
 * with enhanced error handling, performance telemetry, and a structured, type-safe interface.
 *
 * It extends the basic `gcpService.ts` by offering a full suite of IAM functionalities,
 * moving beyond just `testIamPermissions` to enable full lifecycle management and auditing.
 *
 * Design Principles:
 * 1. Encapsulation: Hide GAPI specifics and HTTP request details behind clean, synchronous-looking methods.
 * 2. Type Safety: Leverage TypeScript interfaces for robust API interaction, reducing runtime errors.
 * 3. Telemetry Integration: Automatic performance measurement and error logging for operational insights.
 * 4. Error Clarity: Translate cryptic GAPI and HTTP errors into actionable, user-friendly messages.
 * 5. Resource Abstraction: Simplify resource name handling with dedicated builder/parser utilities.
 * 6. Resiliency: Implement retry mechanisms for transient network or service errors.
 */
export class GcpIamService {
    private readonly RETRY_ATTEMPTS: number;
    private readonly RETRY_DELAY_MS: number;
    private readonly _telemetryContext: Record<string, any>;

    /**
     * Constructs the GcpIamService instance.
     * @param options Configuration options for the service, including retry logic and telemetry context.
     */
    constructor(options?: GcpIamServiceOptions) {
        this.RETRY_ATTEMPTS = options?.retryAttempts ?? 3;
        this.RETRY_DELAY_MS = options?.retryDelayMs ?? 500;
        this._telemetryContext = { service: 'GcpIamService', ...options?.telemetryContext };
    }

    /**
     * A utility function to introduce a non-blocking delay. Used primarily for retry mechanisms
     * to implement exponential backoff.
     * @param ms The number of milliseconds to wait. Must be a non-negative number.
     * @returns {Promise<void>} A promise that resolves after the specified delay.
     * @private
     */
    private async _sleep(ms: number): Promise<void> {
        if (ms < 0) {
            logError(new Error(`Attempted to sleep for negative milliseconds: ${ms}`), { ...this._telemetryContext, function: '_sleep' });
            return Promise.resolve(); // Do not error out, just proceed immediately
        }
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handles raw GAPI errors, logs them using the configured telemetry service, and
     * transforms them into more standardized, user-friendly `Error` objects.
     * This centralizes error handling logic, ensuring consistent logging and user feedback.
     * @param error The original error object from GAPI or underlying network call.
     * @param context Additional context specific to the operation where the error occurred,
     *                merged with the service's base telemetry context.
     * @returns {Error} A new `Error` instance with a clear message suitable for user display or re-throwing.
     * @private
     */
    private _handleGapiError(error: any, context: Record<string, any>): Error {
        const fullContext = { ...this._telemetryContext, ...context };
        logError(error as Error, fullContext); // Log the raw error for debugging

        const gapiError = error as any;
        if (gapiError.result?.error) {
            const apiError = gapiError.result.error as GcpApiError;
            return new Error(`GCP IAM API Error: ${apiError.message} (Code: ${apiError.code}, Status: ${apiError.status})`);
        }
        if (gapiError.message) {
            return new Error(`GCP IAM API Error: ${gapiError.message}`);
        }
        // Fallback for unexpected error structures
        return new Error(`An unknown GCP IAM API error occurred. Please check logs for more details. Raw error: ${JSON.stringify(error)}`);
    }

    /**
     * Ensures that the Google API client library (GAPI) is fully loaded and initialized.
     * This is a prerequisite for making any GAPI calls. If the client is not ready,
     * it attempts to load it.
     * @returns {Promise<void>} Resolves if the client is successfully ensured to be ready,
     *                          rejects with an error if initialization fails.
     * @private
     * @throws {Error} If the Google API client cannot be made ready.
     */
    private async _ensureClientReady(): Promise<void> {
        try {
            const isReady = await ensureGapiClient();
            if (!isReady) {
                throw new Error("Google API client not ready or failed to load after initialization attempt.");
            }
        } catch (error) {
            const wrappedError = this._handleGapiError(error, { function: '_ensureClientReady' });
            throw new Error(`Failed to ensure GAPI client is ready: ${wrappedError.message}`);
        }
    }

    /**
     * Determines if a given error indicates a transient condition that warrants a retry.
     * This typically includes network issues, service unavailability, or rate limiting.
     * @param error The error object, which might be a raw GAPI error or a standard JavaScript Error.
     * @returns {boolean} `true` if the operation should be retried, `false` otherwise.
     * @private
     */
    private _shouldRetry(error: any): boolean {
        // Check for common transient HTTP status codes
        const statusCode = error.result?.error?.code || error.code;
        return [429, 500, 503].includes(statusCode); // Too Many Requests, Internal Server Error, Service Unavailable
    }

    /**
     * A generic wrapper for all GAPI client calls within this service.
     * It integrates performance measurement, error handling, and robust retry logic
     * with exponential backoff to enhance the reliability of API interactions.
     *
     * @template T The expected type of the successful API response.
     * @param operationName A descriptive string for the operation (e.g., 'iam.permissions.testIamPermissions'),
     *                      used for telemetry and logging.
     * @param apiCall The actual function that performs the GAPI call and returns a Promise.
     *                This function should be a thunk (`() => Promise<any>`) to allow retries.
     * @param context Additional, operation-specific context to augment the telemetry logs.
     * @returns {Promise<T>} A promise that resolves with the API response data,
     *                       or rejects with a standardized `Error` if all retries fail.
     * @private
     * @throws {Error} If the API call fails persistently after all retry attempts.
     */
    private async _executeGapiCall<T>(
        operationName: string,
        apiCall: () => Promise<any>, // GAPI calls return a Promise<GapiResponse> where GapiResponse has a 'result' field
        context: Record<string, any> = {}
    ): Promise<T> {
        return measurePerformance(operationName, async () => {
            await this._ensureClientReady();

            for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
                try {
                    const response = await apiCall();
                    // GAPI client responses typically wrap the actual data in a `result` property.
                    if (response && typeof response === 'object' && 'result' in response) {
                        return response.result as T;
                    }
                    // Some GAPI calls might not strictly adhere to `response.result` (e.g., empty responses).
                    // In such cases, we assume the raw response is sufficient if `T` expects it.
                    return response as T;
                } catch (error) {
                    const errorContext = { ...this._telemetryContext, ...context, attempt, operationName };
                    const handledError = this._handleGapiError(error, errorContext);

                    if (attempt < this.RETRY_ATTEMPTS && this._shouldRetry(error)) {
                        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                        logError(new Error(`Retrying ${operationName} (attempt ${attempt}/${this.RETRY_ATTEMPTS}) due to error: ${handledError.message}. Delaying for ${delay}ms.`), errorContext);
                        await this._sleep(delay); // Exponential backoff
                        continue; // Proceed to the next attempt
                    }
                    // If it's the last attempt or not a retriable error, re-throw
                    throw handledError;
                }
            }
            // This line should ideally not be reached, but serves as a fail-safe.
            throw new Error(`Failed to execute ${operationName} after ${this.RETRY_ATTEMPTS} attempts. Please check preceding error logs.`);
        });
    }

    /**
     * Tests a set of permissions against a specified GCP resource. This is a fundamental
     * IAM check to determine what actions a caller is allowed to perform on a resource.
     *
     * @param resource The full resource name of the GCP resource. This can be in formats
     *                 like '//cloudresourcemanager.googleapis.com/projects/my-project' or
     *                 'projects/my-project'. The builder will normalize it.
     *                 Examples: 'projects/my-project', 'organizations/12345', 'folders/67890',
     *                 'projects/my-project/buckets/my-bucket'.
     * @param permissions An array of permission strings to test. Each string should be in
     *                    the format `service.resource.verb`.
     *                    Examples: ['storage.objects.create', 'storage.objects.get', 'compute.instances.start'].
     * @returns {Promise<{ permissions: string[] }>} A promise that resolves with an object
     *                                               containing the subset of permissions from the input
     *                                               array that the caller is allowed to perform.
     *                                               If no permissions are allowed, the array will be empty.
     * @throws {Error} If the resource name is invalid, permissions array is empty, or the API call fails.
     * @example
     * ```typescript
     * const allowed = await iamService.testIamPermissions(
     *   'projects/my-project-id',
     *   ['compute.instances.get', 'compute.instances.delete']
     * );
     * console.log('Allowed permissions:', allowed.permissions); // ['compute.instances.get']
     * ```
     */
    public async testIamPermissions(resource: string, permissions: string[]): Promise<{ permissions: string[] }> {
        IamResourceNameBuilder._validateInput(resource, 'Resource name');
        if (!permissions || permissions.length === 0) {
            throw new Error("Permissions array cannot be empty for testing `testIamPermissions`.");
        }

        const iamResourcePath = IamResourceNameBuilder.toIamResourcePath(resource);

        return this._executeGapiCall<{ permissions: string[] }>(
            'iam.permissions.testIamPermissions',
            () => gapi.client.iam.permissions.testIamPermissions({
                resource: iamResourcePath,
                resource_body: { permissions: permissions } // The API expects permissions nested under resource_body
            }),
            { function: 'testIamPermissions', resource, permissions }
        );
    }

    /**
     * Retrieves the IAM policy for a specified GCP resource.
     * An IAM policy defines who has what access to a resource.
     *
     * @param resource The full resource name of the GCP resource.
     *                 Examples: 'projects/my-project', 'organizations/12345', 'folders/67890'.
     * @param version Optional. The policy format version to request. Defaults to `3` for conditions support.
     * @returns {Promise<IamPolicy>} A promise that resolves with the `IamPolicy` object for the resource.
     *                               This object includes `bindings`, `etag`, and `version`.
     * @throws {Error} If the resource name is invalid or the API call fails.
     * @example
     * ```typescript
     * const policy = await iamService.getIamPolicy('projects/my-project-id');
     * console.log('Current policy:', JSON.stringify(policy, null, 2));
     * ```
     */
    public async getIamPolicy(resource: string, version: number = 3): Promise<IamPolicy> {
        IamResourceNameBuilder._validateInput(resource, 'Resource name');
        const iamResourcePath = IamResourceNameBuilder.toIamResourcePath(resource);

        // The IAM API for getting policy is typically a POST method on the resource itself, e.g.,
        // `POST /{resource=**}:getIamPolicy`
        // GAPI client structure often maps to this.
        // We assume a generic `gapi.client.iam.policies.get` or a method on the resource itself,
        // which implies `gapi.client.iam` has been loaded with appropriate discovery documents.
        // This is a common pattern for many GCP APIs, not directly `iam.policies` but a `getIamPolicy` method
        // on the resource's primary service client (e.g., `gapi.client.cloudresourcemanager.projects.getIamPolicy`).
        // For uniformity within this `GcpIamService` context, we abstract this complexity.

        return this._executeGapiCall<IamPolicy>(
            'iam.policy.getIamPolicy',
            () => gapi.client.iam.policies.getIamPolicy({ // Conceptual endpoint for unified IAM operations
                resource: iamResourcePath,
                resource_body: {
                    options: { requestedPolicyVersion: version }
                }
            }),
            { function: 'getIamPolicy', resource, version }
        );
    }

    /**
     * Sets the IAM policy for a specified GCP resource.
     * This operation replaces the entire policy, so it's crucial to retrieve the current
     * policy first, modify it, and then set the updated policy.
     * Optimistic concurrency control is handled using the `etag` field.
     *
     * @param resource The full resource name of the GCP resource.
     * @param policy The `IamPolicy` object to set. This should typically be a modified
     *               version of a policy retrieved using `getIamPolicy`, including its `etag`.
     * @returns {Promise<IamPolicy>} A promise that resolves with the updated `IamPolicy` object
     *                               as returned by the API.
     * @throws {Error} If the resource name or policy is invalid, or the API call fails
     *                 (e.g., due to a mismatching etag or insufficient permissions).
     * @example
     * ```typescript
     * const resource = 'projects/my-project-id';
     * let policy = await iamService.getIamPolicy(resource);
     *
     * // Add a new binding
     * policy.bindings.push({
     *   role: 'roles/viewer',
     *   members: ['user:jane.doe@example.com']
     * });
     *
     * const updatedPolicy = await iamService.setIamPolicy(resource, policy);
     * console.log('Updated policy:', JSON.stringify(updatedPolicy, null, 2));
     * ```
     */
    public async setIamPolicy(resource: string, policy: IamPolicy): Promise<IamPolicy> {
        IamResourceNameBuilder._validateInput(resource, 'Resource name');
        if (!policy || !Array.isArray(policy.bindings)) {
            throw new Error("IAM Policy object must be valid and contain a 'bindings' array.");
        }
        const iamResourcePath = IamResourceNameBuilder.toIamResourcePath(resource);

        return this._executeGapiCall<IamPolicy>(
            'iam.policy.setIamPolicy',
            () => gapi.client.iam.policies.setIamPolicy({ // Conceptual endpoint
                resource: iamResourcePath,
                resource_body: {
                    policy: policy,
                    // Typically, an update mask can be used to specify which fields of the policy
                    // are being updated, allowing for partial updates without overwriting
                    // other fields. For `setIamPolicy`, providing the full policy with an etag
                    // is common for full replacement.
                    // The `updateMask` is often part of an `UpdateIamPolicyRequest` body rather than directly on `resource_body`.
                    // For the sake of illustration, assuming `resource_body` can contain the policy and an implicit `updateMask` via policy.version / policy.etag.
                    //   updateMask: 'bindings,etag,version'
                }
            }),
            { function: 'setIamPolicy', resource, policy }
        );
    }

    /**
     * Adds a new role binding to an existing IAM policy on a resource.
     * This is a convenience method that fetches the current policy, adds the binding,
     * and then sets the updated policy. It handles the `etag` for optimistic concurrency.
     *
     * @param resource The full resource name of the GCP resource.
     * @param role The role to add (e.g., 'roles/editor').
     * @param members An array of members to assign to the role (e.g., ['user:john@example.com']).
     * @param condition Optional. An IAM condition to apply to the binding.
     * @returns {Promise<IamPolicy>} A promise that resolves with the updated `IamPolicy`.
     * @throws {Error} If inputs are invalid or any underlying API call fails.
     * @example
     * ```typescript
     * await iamService.addBindingToPolicy(
     *   'projects/my-project-id',
     *   'roles/storage.objectViewer',
     *   ['user:developer@example.com'],
     *   { expression: 'resource.name.startsWith("projects/my-project/buckets/public")', title: 'Public Bucket Access' }
     * );
     * console.log('Binding added successfully.');
     * ```
     */
    public async addBindingToPolicy(
        resource: string,
        role: string,
        members: string[],
        condition?: IamCondition
    ): Promise<IamPolicy> {
        IamResourceNameBuilder._validateInput(resource, 'Resource name');
        IamResourceNameBuilder._validateInput(role, 'Role');
        if (!members || members.length === 0) {
            throw new Error("Members array cannot be empty for adding a binding.");
        }

        const policy = await this.getIamPolicy(resource);
        const newBinding: IamBinding = { role, members, condition };

        // Check if an identical binding already exists (ignoring etag/version on policy)
        const bindingExists = policy.bindings.some(b =>
            b.role === newBinding.role &&
            b.members.every(m => newBinding.members.includes(m)) &&
            newBinding.members.every(m => b.members.includes(m)) && // Check for exact member match, order agnostic
            JSON.stringify(b.condition || {}) === JSON.stringify(newBinding.condition || {})
        );

        if (!bindingExists) {
            policy.bindings.push(newBinding);
            return this.setIamPolicy(resource, policy);
        } else {
            logError(new Error(`Binding already exists on resource ${resource} for role ${role} and members ${members.join(',')}`),
                { ...this._telemetryContext, function: 'addBindingToPolicy', resource, role, members, status: 'skipped_duplicate' });
            return policy; // Return the original policy if no change was made
        }
    }

    /**
     * Removes a specific role binding from an existing IAM policy on a resource.
     * This is a convenience method that fetches the current policy, removes the binding,
     * and then sets the updated policy. It handles the `etag` for optimistic concurrency.
     *
     * @param resource The full resource name of the GCP resource.
     * @param role The role to remove (e.g., 'roles/viewer').
     * @param members The array of members associated with the binding to remove.
     * @param condition Optional. The IAM condition of the binding to remove.
     * @returns {Promise<IamPolicy>} A promise that resolves with the updated `IamPolicy`.
     * @throws {Error} If inputs are invalid or any underlying API call fails.
     * @example
     * ```typescript
     * await iamService.removeBindingFromPolicy(
     *   'projects/my-project-id',
     *   'roles/storage.objectViewer',
     *   ['user:developer@example.com']
     * );
     * console.log('Binding removed successfully.');
     * ```
     */
    public async removeBindingFromPolicy(
        resource: string,
        role: string,
        members: string[],
        condition?: IamCondition
    ): Promise<IamPolicy> {
        IamResourceNameBuilder._validateInput(resource, 'Resource name');
        IamResourceNameBuilder._validateInput(role, 'Role');
        if (!members || members.length === 0) {
            throw new Error("Members array cannot be empty for removing a binding.");
        }

        const policy = await this.getIamPolicy(resource);
        const originalBindingCount = policy.bindings.length;

        // Filter out the binding that matches role, members, and condition.
        // We need to be careful with member comparison (order-agnostic).
        policy.bindings = policy.bindings.filter(b => {
            const isRoleMatch = b.role === role;
            const isConditionMatch = JSON.stringify(b.condition || {}) === JSON.stringify(condition || {});
            const isMembersMatch = b.members.length === members.length &&
                                   b.members.every(m => members.includes(m)) &&
                                   members.every(m => b.members.includes(m)); // Ensure exact set match

            return !(isRoleMatch && isMembersMatch && isConditionMatch);
        });

        if (policy.bindings.length < originalBindingCount) {
            return this.setIamPolicy(resource, policy);
        } else {
            logError(new Error(`No matching binding found on resource ${resource} for role ${role} and members ${members.join(',')}`),
                { ...this._telemetryContext, function: 'removeBindingFromPolicy', resource, role, members, status: 'skipped_not_found' });
            return policy; // Return original policy if no change
        }
    }

    /**
     * Adds a single member to an existing role binding on an IAM policy.
     * If no suitable binding exists, it creates a new one.
     *
     * @param resource The full resource name of the GCP resource.
     * @param role The role to modify (e.g., 'roles/editor').
     * @param member The member to add (e.g., 'user:newuser@example.com').
     * @param condition Optional. The IAM condition associated with the binding.
     * @returns {Promise<IamPolicy>} A promise that resolves with the updated `IamPolicy`.
     * @throws {Error} If inputs are invalid or any underlying API call fails.
     * @example
     * ```typescript
     * await iamService.addMemberToRoleBinding(
     *   'projects/my-project-id',
     *   'roles/viewer',
     *   'user:analyst@example.com'
     * );
     * console.log('Member added to viewer role.');
     * ```
     */
    public async addMemberToRoleBinding(
        resource: string,
        role: string,
        member: string,
        condition?: IamCondition
    ): Promise<IamPolicy> {
        IamResourceNameBuilder._validateInput(resource, 'Resource name');
        IamResourceNameBuilder._validateInput(role, 'Role');
        IamResourceNameBuilder._validateInput(member, 'Member');

        const policy = await this.getIamPolicy(resource);
        let bindingFound = false;
        let policyModified = false;

        for (const binding of policy.bindings) {
            const isRoleMatch = binding.role === role;
            const isConditionMatch = JSON.stringify(binding.condition || {}) === JSON.stringify(condition || {});

            if (isRoleMatch && isConditionMatch) {
                bindingFound = true;
                if (!binding.members.includes(member)) {
                    binding.members.push(member);
                    policyModified = true;
                }
                break; // Found and potentially updated, no need to check other bindings
            }
        }

        if (!bindingFound) {
            // If no existing binding matches, create a new one.
            policy.bindings.push({ role, members: [member], condition });
            policyModified = true;
        }

        if (policyModified) {
            return this.setIamPolicy(resource, policy);
        } else {
            logError(new Error(`Member ${member} already exists in role ${role} binding on resource ${resource}`),
                { ...this._telemetryContext, function: 'addMemberToRoleBinding', resource, role, member, status: 'skipped_duplicate' });
            return policy; // No change, return original
        }
    }

    /**
     * Removes a single member from an existing role binding on an IAM policy.
     * If the member is the last one in a binding, the binding itself is removed.
     *
     * @param resource The full resource name of the GCP resource.
     * @param role The role to modify (e.g., 'roles/viewer').
     * @param member The member to remove (e.g., 'user:olduser@example.com').
     * @param condition Optional. The IAM condition associated with the binding.
     * @returns {Promise<IamPolicy>} A promise that resolves with the updated `IamPolicy`.
     * @throws {Error} If inputs are invalid or any underlying API call fails.
     * @example
     * ```typescript
     * await iamService.removeMemberFromRoleBinding(
     *   'projects/my-project-id',
     *   'roles/viewer',
     *   'user:analyst@example.com'
     * );
     * console.log('Member removed from viewer role.');
     * ```
     */
    public async removeMemberFromRoleBinding(
        resource: string,
        role: string,
        member: string,
        condition?: IamCondition
    ): Promise<IamPolicy> {
        IamResourceNameBuilder._validateInput(resource, 'Resource name');
        IamResourceNameBuilder._validateInput(role, 'Role');
        IamResourceNameBuilder._validateInput(member, 'Member');

        const policy = await this.getIamPolicy(resource);
        let policyModified = false;

        policy.bindings = policy.bindings.filter(binding => {
            const isRoleMatch = binding.role === role;
            const isConditionMatch = JSON.stringify(binding.condition || {}) === JSON.stringify(condition || {});

            if (isRoleMatch && isConditionMatch) {
                const initialMembersCount = binding.members.length;
                binding.members = binding.members.filter(m => m !== member);
                if (binding.members.length < initialMembersCount) {
                    policyModified = true;
                }
                // If member was removed and it was the last one, remove the binding itself.
                return binding.members.length > 0;
            }
            return true; // Keep binding if no match or member not removed
        });


        if (policyModified) {
            return this.setIamPolicy(resource, policy);
        } else {
            logError(new Error(`Member ${member} not found in role ${role} binding on resource ${resource}`),
                { ...this._telemetryContext, function: 'removeMemberFromRoleBinding', resource, role, member, status: 'skipped_not_found' });
            return policy; // No change, return original
        }
    }

    /**
     * Creates a new custom IAM role within a specific project or organization.
     * Custom roles allow fine-grained access control beyond predefined roles.
     *
     * @param parentResource The full resource name of the parent (e.g., 'projects/my-project' or 'organizations/my-org').
     * @param roleId The unique ID for the new custom role (e.g., 'myCustomAdmin'). Must be lowercase alphanumeric, dashes allowed.
     * @param role The `IamRole` object defining the custom role, excluding the `name` field.
     *             Must include `title` and `includedPermissions`.
     * @returns {Promise<IamRole>} A promise that resolves with the created `IamRole` object.
     * @throws {Error} If parent resource or role definition is invalid, or the API call fails.
     * @example
     * ```typescript
     * const newRole = await iamService.createCustomRole(
     *   'projects/my-project-id',
     *   'bucketReader',
     *   {
     *     title: 'Custom Bucket Reader',
     *     description: 'Grants read access to specific buckets.',
     *     includedPermissions: ['storage.objects.get', 'storage.buckets.get']
     *   }
     * );
     * console.log('Created custom role:', newRole.name);
     * ```
     */
    public async createCustomRole(parentResource: string, roleId: string, role: Omit<IamRole, 'name'>): Promise<IamRole> {
        IamResourceNameBuilder._validateInput(parentResource, 'Parent resource for role creation');
        IamResourceNameBuilder._validateInput(roleId, 'Role ID');
        if (!role || !role.title || !role.includedPermissions || role.includedPermissions.length === 0) {
            throw new Error("Custom role definition must include a title and at least one permission.");
        }

        // The IAM roles API for custom roles uses a specific path:
        // `gapi.client.iam.projects.roles.create` for project-level roles.
        // `gapi.client.iam.organizations.roles.create` for organization-level roles.
        // The `roleId` is part of the query parameter, not the path.

        const projectId = IamResourceNameBuilder.extractProjectId(parentResource);
        const organizationId = IamResourceNameBuilder.extractOrganizationId(parentResource);

        if (projectId) {
            return this._executeGapiCall<IamRole>(
                'iam.projects.roles.create',
                () => gapi.client.iam.projects.roles.create({
                    parent: parentResource, // e.g., 'projects/my-project'
                    roleId: roleId,
                    resource_body: role
                }),
                { function: 'createCustomRole', parentResource, roleId, role }
            );
        } else if (organizationId) {
            return this._executeGapiCall<IamRole>(
                'iam.organizations.roles.create',
                () => gapi.client.iam.organizations.roles.create({
                    parent: parentResource, // e.g., 'organizations/my-org'
                    roleId: roleId,
                    resource_body: role
                }),
                { function: 'createCustomRole', parentResource, roleId, role }
            );
        } else {
            throw new Error(`Parent resource '${parentResource}' is not a valid project or organization for custom role creation.`);
        }
    }

    /**
     * Retrieves the definition of a specific IAM role, whether predefined or custom.
     *
     * @param roleName The full resource name of the role.
     *                 Examples: 'roles/editor' (predefined), 'projects/my-project/roles/myCustomRole' (custom project role),
     *                 'organizations/my-org/roles/myCustomOrgRole' (custom organization role).
     * @returns {Promise<IamRole>} A promise that resolves with the `IamRole` object.
     * @throws {Error} If the role name is invalid or the API call fails (e.g., role not found).
     * @example
     * ```typescript
     * const editorRole = await iamService.getRole('roles/editor');
     * console.log('Editor role permissions:', editorRole.includedPermissions);
     *
     * const customRole = await iamService.getRole('projects/my-project-id/roles/myCustomRole');
     * console.log('Custom role details:', customRole.title, customRole.description);
     * ```
     */
    public async getRole(roleName: string): Promise<IamRole> {
        IamResourceNameBuilder._validateInput(roleName, 'Role name');

        // `gapi.client.iam.roles.get` for predefined roles.
        // `gapi.client.iam.projects.roles.get` for custom project roles.
        // `gapi.client.iam.organizations.roles.get` for custom organization roles.
        const { projectId, organizationId, roleId } = IamResourceNameBuilder.parseRoleName(roleName);

        if (projectId) { // Custom project role
            return this._executeGapiCall<IamRole>(
                'iam.projects.roles.get',
                () => gapi.client.iam.projects.roles.get({ name: roleName }),
                { function: 'getRole', roleName, projectId, roleId }
            );
        } else if (organizationId) { // Custom organization role
            return this._executeGapiCall<IamRole>(
                'iam.organizations.roles.get',
                () => gapi.client.iam.organizations.roles.get({ name: roleName }),
                { function: 'getRole', roleName, organizationId, roleId }
            );
        } else { // Predefined role
            return this._executeGapiCall<IamRole>(
                'iam.roles.get',
                () => gapi.client.iam.roles.get({ name: roleName }),
                { function: 'getRole', roleName, roleId }
            );
        }
    }

    /**
     * Updates an existing custom IAM role within a project or organization.
     * Only fields specified in `updateMask` (or implied by the API) will be modified.
     *
     * @param roleName The full resource name of the custom role to update.
     *                 Examples: 'projects/my-project/roles/myCustomRole'.
     * @param updatedRole The `IamRole` object containing the updated fields.
     *                    The `name` field is ignored here as it's part of `roleName`.
     *                    At minimum, `title` or `includedPermissions` should be present for a meaningful update.
     * @param updateMask A comma-separated list of field names to be updated.
     *                   Examples: 'title,description,includedPermissions,stage'.
     *                   If omitted, the API might default to updating common fields or require specific fields.
     *                   For robustness, it's recommended to provide.
     * @returns {Promise<IamRole>} A promise that resolves with the updated `IamRole` object.
     * @throws {Error} If role name or update data is invalid, or the API call fails.
     * @example
     * ```typescript
     * const updated = await iamService.updateCustomRole(
     *   'projects/my-project-id/roles/bucketReader',
     *   {
     *     title: 'Enhanced Bucket Reader',
     *     description: 'Grants read access to buckets and objects, with logging.',
     *     includedPermissions: ['storage.objects.get', 'storage.buckets.get', 'logging.logEntries.list']
     *   },
     *   'title,description,includedPermissions'
     * );
     * console.log('Updated role:', updated.name, updated.title);
     * ```
     */
    public async updateCustomRole(roleName: string, updatedRole: Omit<IamRole, 'name'>, updateMask?: string): Promise<IamRole> {
        IamResourceNameBuilder._validateInput(roleName, 'Role name for update');
        if (!updatedRole || Object.keys(updatedRole).length === 0) {
            throw new Error("Updated role object cannot be empty for `updateCustomRole`.");
        }

        const { projectId, organizationId, roleId } = IamResourceNameBuilder.parseRoleName(roleName);

        if (!projectId && !organizationId) {
            throw new Error(`Role name '${roleName}' does not specify a project or organization for custom role update. Predefined roles cannot be updated.`);
        }

        const params: any = {
            name: roleName,
            resource_body: updatedRole
        };
        if (updateMask) {
            params.updateMask = updateMask;
        } else {
            // If no update mask is provided, infer from provided fields.
            // This is a common pattern for patch operations.
            const inferredMask = Object.keys(updatedRole).join(',');
            if (inferredMask) params.updateMask = inferredMask;
        }

        if (projectId) {
            return this._executeGapiCall<IamRole>(
                'iam.projects.roles.update',
                () => gapi.client.iam.projects.roles.update(params),
                { function: 'updateCustomRole', roleName, updatedRole, updateMask, projectId }
            );
        } else { // organizationId
            return this._executeGapiCall<IamRole>(
                'iam.organizations.roles.update',
                () => gapi.client.iam.organizations.roles.update(params),
                { function: 'updateCustomRole', roleName, updatedRole, updateMask, organizationId }
            );
        }
    }

    /**
     * Deletes a custom IAM role within a project or organization.
     * Custom roles are soft-deleted initially and can be undeleted within 7 days.
     * Predefined roles cannot be deleted.
     *
     * @param roleName The full resource name of the custom role to delete.
     *                 Examples: 'projects/my-project/roles/myCustomRole'.
     * @returns {Promise<void>} A promise that resolves when the role is successfully soft-deleted.
     * @throws {Error} If the role name is invalid, refers to a predefined role, or the API call fails.
     * @example
     * ```typescript
     * await iamService.deleteCustomRole('projects/my-project-id/roles/tempRole');
     * console.log('Custom role soft-deleted.');
     * ```
     */
    public async deleteCustomRole(roleName: string): Promise<void> {
        IamResourceNameBuilder._validateInput(roleName, 'Role name for delete');
        const { projectId, organizationId } = IamResourceNameBuilder.parseRoleName(roleName);

        if (!projectId && !organizationId) {
            throw new Error(`Role name '${roleName}' does not specify a project or organization. Only custom roles can be deleted.`);
        }

        if (projectId) {
            return this._executeGapiCall<void>(
                'iam.projects.roles.delete',
                () => gapi.client.iam.projects.roles.delete({ name: roleName }),
                { function: 'deleteCustomRole', roleName, projectId }
            );
        } else { // organizationId
            return this._executeGapiCall<void>(
                'iam.organizations.roles.delete',
                () => gapi.client.iam.organizations.roles.delete({ name: roleName }),
                { function: 'deleteCustomRole', roleName, organizationId }
            );
        }
    }

    /**
     * Undeletes a previously soft-deleted custom IAM role within a project or organization.
     * A role can only be undeleted within 7 days of being soft-deleted.
     *
     * @param roleName The full resource name of the custom role to undelete.
     *                 Examples: 'projects/my-project/roles/myDeletedRole'.
     * @returns {Promise<IamRole>} A promise that resolves with the undeleted `IamRole` object.
     * @throws {Error} If the role name is invalid, refers to a predefined role, or the API call fails
     *                 (e.g., role not found or past the undelete window).
     * @example
     * ```typescript
     * await iamService.undeleteCustomRole('projects/my-project-id/roles/tempRole');
     * console.log('Custom role undeleted.');
     * ```
     */
    public async undeleteCustomRole(roleName: string): Promise<IamRole> {
        IamResourceNameBuilder._validateInput(roleName, 'Role name for undelete');
        const { projectId, organizationId } = IamResourceNameBuilder.parseRoleName(roleName);

        if (!projectId && !organizationId) {
            throw new Error(`Role name '${roleName}' does not specify a project or organization. Only custom roles can be undeleted.`);
        }

        if (projectId) {
            return this._executeGapiCall<IamRole>(
                'iam.projects.roles.undelete',
                () => gapi.client.iam.projects.roles.undelete({ name: roleName }),
                { function: 'undeleteCustomRole', roleName, projectId }
            );
        } else { // organizationId
            return this._executeGapiCall<IamRole>(
                'iam.organizations.roles.undelete',
                () => gapi.client.iam.organizations.roles.undelete({ name: roleName }),
                { function: 'undeleteCustomRole', roleName, organizationId }
            );
        }
    }

    /**
     * Lists all available IAM roles. This can include predefined roles globally,
     * or custom roles specific to a project or organization.
     *
     * @param parentResource Optional. The parent resource to list custom roles under
     *                       (e.g., 'projects/my-project-id', 'organizations/12345').
     *                       If not provided, only predefined roles are typically returned.
     * @param options Pagination options, including `pageSize` and `pageToken`.
     * @returns {Promise<{ roles: IamRole[]; nextPageToken?: string }>} A promise that resolves
     *          with an object containing an array of `IamRole` objects and an optional `nextPageToken`.
     * @throws {Error} If the parent resource is invalid or the API call fails.
     * @example
     * ```typescript
     * // List all predefined roles
     * const predefined = await iamService.listRoles();
     * console.log('Predefined roles count:', predefined.roles.length);
     *
     * // List custom roles for a project
     * const customProjectRoles = await iamService.listRoles('projects/my-project-id', { pageSize: 10 });
     * console.log('Custom project roles:', customProjectRoles.roles.map(r => r.name));
     * ```
     */
    public async listRoles(parentResource?: string, options?: ListOptions): Promise<{ roles: IamRole[]; nextPageToken?: string }> {
        const params: any = {
            view: 'FULL', // Request full details of roles
            pageSize: options?.pageSize,
            pageToken: options?.pageToken,
            showDeleted: true // Include soft-deleted roles in the list
        };

        let operationName = 'iam.roles.list';
        let apiCall;

        const projectId = parentResource ? IamResourceNameBuilder.extractProjectId(parentResource) : undefined;
        const organizationId = parentResource ? IamResourceNameBuilder.extractOrganizationId(parentResource) : undefined;

        if (projectId) {
            params.parent = parentResource;
            apiCall = () => gapi.client.iam.projects.roles.list(params);
            operationName = 'iam.projects.roles.list';
        } else if (organizationId) {
            params.parent = parentResource;
            apiCall = () => gapi.client.iam.organizations.roles.list(params);
            operationName = 'iam.organizations.roles.list';
        }
        else { // No parent means listing all predefined roles (and potentially globally visible custom roles, if any)
            apiCall = () => gapi.client.iam.roles.list(params);
        }

        const result = await this._executeGapiCall<{ roles: IamRole[]; nextPageToken?: string }>(
            operationName,
            apiCall,
            { function: 'listRoles', parentResource, options }
        );
        return {
            roles: result.roles || [],
            nextPageToken: result.nextPageToken
        };
    }

    /**
     * Retrieves a list of permissions granted by a given role.
     * This utility helps in understanding the granular access provided by a role.
     *
     * @param roleName The full resource name of the role (e.g., 'roles/editor', 'projects/my-project/roles/myCustomRole').
     * @returns {Promise<string[]>} A promise that resolves with an array of permission strings.
     * @throws {Error} If the role name is invalid or the role cannot be fetched.
     * @example
     * ```typescript
     * const permissions = await iamService.getRolePermissions('roles/storage.admin');
     * console.log('Storage Admin permissions:', permissions);
     * ```
     */
    public async getRolePermissions(roleName: string): Promise<string[]> {
        IamResourceNameBuilder._validateInput(roleName, 'Role name');
        const role = await this.getRole(roleName);
        return role.includedPermissions;
    }

    /**
     * Creates a new service account within a specified project.
     * Service accounts are identities used by applications and virtual machines.
     *
     * @param projectId The ID of the project where the service account will be created.
     * @param accountId The unique ID for the new service account (e.g., 'my-app-sa').
     *                  Must be 6-30 characters, lowercase alphanumeric, dashes allowed.
     * @param displayName A human-readable display name for the service account. Optional.
     * @param description An optional, longer description of the service account's purpose.
     * @returns {Promise<IamServiceAccount>} A promise that resolves with the created `IamServiceAccount` object.
     * @throws {Error} If project ID or account ID is invalid, or the API call fails (e.g., account ID already exists).
     * @example
     * ```typescript
     * const newSa = await iamService.createServiceAccount(
     *   'my-project-id',
     *   'data-processor-sa',
     *   'Data Processing Service Account',
     *   'Used by batch jobs to process data in Cloud Storage.'
     * );
     * console.log('New Service Account email:', newSa.email);
     * ```
     */
    public async createServiceAccount(
        projectId: string,
        accountId: string,
        displayName?: string,
        description?: string
    ): Promise<IamServiceAccount> {
        IamResourceNameBuilder._validateInput(projectId, 'Project ID');
        IamResourceNameBuilder._validateInput(accountId, 'Account ID');

        const parentResource = IamResourceNameBuilder.buildProjectResourceName(projectId);

        return this._executeGapiCall<IamServiceAccount>(
            'iam.projects.serviceAccounts.create',
            () => gapi.client.iam.projects.serviceAccounts.create({
                name: parentResource, // Parent for SA creation is the project resource name
                accountId: accountId,
                resource_body: {
                    displayName: displayName,
                    description: description
                }
            }),
            { function: 'createServiceAccount', projectId, accountId, displayName }
        );
    }

    /**
     * Retrieves details of a specific service account.
     *
     * @param serviceAccountName The full resource name or email of the service account.
     *                           Accepted formats:
     *                           - `projects/PROJECT_ID/serviceAccounts/SERVICE_ACCOUNT_EMAIL` (full resource name)
     *                           - `SERVICE_ACCOUNT_EMAIL` (e.g., `my-sa@PROJECT_ID.iam.gserviceaccount.com`).
     *                             If only email is provided, it assumes `projects/-/serviceAccounts/{email}` for resolution.
     * @returns {Promise<IamServiceAccount>} A promise that resolves with the `IamServiceAccount` object.
     * @throws {Error} If the service account name is invalid or the API call fails (e.g., not found).
     * @example
     * ```typescript
     * const sa = await iamService.getServiceAccount('my-sa@my-project-id.iam.gserviceaccount.com');
     * console.log('Service Account Display Name:', sa.displayName);
     * ```
     */
    public async getServiceAccount(serviceAccountName: string): Promise<IamServiceAccount> {
        IamResourceNameBuilder._validateInput(serviceAccountName, 'Service Account Name');

        // GAPI's `get` method for service accounts typically expects the full resource name:
        // `projects/PROJECT_ID/serviceAccounts/SERVICE_ACCOUNT_EMAIL`
        // If an email is provided, we try to use a common shortcut `projects/-/serviceAccounts/{email}`
        // or expect the full name. For safety and consistency, requiring the full name is often better
        // in a library like this, but trying to be flexible.
        let nameParam = serviceAccountName;
        if (!serviceAccountName.startsWith('projects/')) {
            // Assume it's an email and use the common format for email-based lookup if project ID isn't explicit
            // `projects/-/serviceAccounts/{service_account_email}` is often used for this but not always universal.
            // For now, let's assume `get` endpoint can resolve an email if it's unique enough or use a wildcard project.
            // More robust: require projectId if only email. For this example, let's stick to simple GAPI call.
            logError(new Error(`Assuming serviceAccountName '${serviceAccountName}' is an email and attempting direct lookup. Consider providing full resource name 'projects/{projectId}/serviceAccounts/{email}'.`),
                { ...this._telemetryContext, function: 'getServiceAccount', serviceAccountName, status: 'ambiguous_name_warning' });
            // This might fail if the email isn't globally unique or if the API doesn't support a wildcard project for `get`.
            // The API expects `name: 'projects/PROJECT_ID/serviceAccounts/SA_EMAIL'`
            // If only email is given, it's ambiguous which project it belongs to.
            // To be strict, this should probably require `projectId` if `serviceAccountName` is just an email.
            // For this example, we'll assume `gapi.client.iam.projects.serviceAccounts.get` can resolve it or fail predictably.
        }


        return this._executeGapiCall<IamServiceAccount>(
            'iam.projects.serviceAccounts.get',
            () => gapi.client.iam.projects.serviceAccounts.get({ name: nameParam }),
            { function: 'getServiceAccount', serviceAccountName }
        );
    }

    /**
     * Updates an existing service account's mutable properties like `displayName` and `description`.
     * To disable a service account, use `disableServiceAccount`.
     *
     * @param serviceAccountName The full resource name of the service account to update.
     *                           (e.g., 'projects/my-project/serviceAccounts/my-sa@my-project.iam.gserviceaccount.com').
     * @param updatedFields An object containing the fields to update.
     *                      `displayName` and `description` are the most common mutable fields.
     * @param updateMask A comma-separated string specifying which fields to update (e.g., 'displayName,description').
     *                   If omitted, it will be inferred from `updatedFields`.
     * @returns {Promise<IamServiceAccount>} A promise that resolves with the updated `IamServiceAccount` object.
     * @throws {Error} If service account name or update data is invalid, or the API call fails.
     * @example
     * ```typescript
     * const updatedSa = await iamService.updateServiceAccount(
     *   'projects/my-project-id/serviceAccounts/my-sa@my-project-id.iam.gserviceaccount.com',
     *   { displayName: 'New Display Name', description: 'Updated purpose.' },
     *   'displayName,description'
     * );
     * console.log('Service Account updated:', updatedSa.displayName);
     * ```
     */
    public async updateServiceAccount(
        serviceAccountName: string,
        updatedFields: Pick<IamServiceAccount, 'displayName' | 'description'>,
        updateMask?: string
    ): Promise<IamServiceAccount> {
        IamResourceNameBuilder._validateInput(serviceAccountName, 'Service account name for update');
        if (!updatedFields || Object.keys(updatedFields).length === 0) {
            throw new Error("No fields provided for service account update.");
        }

        const params: any = {
            name: serviceAccountName,
            resource_body: updatedFields
        };
        if (updateMask) {
            params.updateMask = updateMask;
        } else {
            const inferredMask = Object.keys(updatedFields).join(',');
            if (inferredMask) params.updateMask = inferredMask;
        }

        // The update method usually expects the resource name as a path parameter.
        return this._executeGapiCall<IamServiceAccount>(
            'iam.projects.serviceAccounts.update',
            () => gapi.client.iam.projects.serviceAccounts.update(params),
            { function: 'updateServiceAccount', serviceAccountName, updatedFields, updateMask }
        );
    }

    /**
     * Deletes a service account. This action is irreversible.
     * It's recommended to disable a service account first to observe impact before permanent deletion.
     *
     * @param serviceAccountName The full resource name of the service account to delete.
     * @returns {Promise<void>} A promise that resolves when the service account is successfully deleted.
     * @throws {Error} If service account name is invalid or the API call fails.
     * @example
     * ```typescript
     * await iamService.deleteServiceAccount('projects/my-project-id/serviceAccounts/old-sa@my-project-id.iam.gserviceaccount.com');
     * console.log('Service Account deleted.');
     * ```
     */
    public async deleteServiceAccount(serviceAccountName: string): Promise<void> {
        IamResourceNameBuilder._validateInput(serviceAccountName, 'Service account name for delete');

        return this._executeGapiCall<void>(
            'iam.projects.serviceAccounts.delete',
            () => gapi.client.iam.projects.serviceAccounts.delete({ name: serviceAccountName }),
            { function: 'deleteServiceAccount', serviceAccountName }
        );
    }

    /**
     * Enables a previously disabled service account.
     *
     * @param serviceAccountName The full resource name of the service account to enable.
     * @returns {Promise<IamServiceAccount>} A promise that resolves with the updated (enabled) `IamServiceAccount`.
     * @throws {Error} If service account name is invalid or the API call fails.
     * @example
     * ```typescript
     * const enabledSa = await iamService.enableServiceAccount('projects/my-project-id/serviceAccounts/disabled-sa@my-project-id.iam.gserviceaccount.com');
     * console.log('Service Account enabled:', enabledSa.email);
     * ```
     */
    public async enableServiceAccount(serviceAccountName: string): Promise<IamServiceAccount> {
        IamResourceNameBuilder._validateInput(serviceAccountName, 'Service account name for enable');

        return this._executeGapiCall<IamServiceAccount>(
            'iam.projects.serviceAccounts.enable',
            // This is typically a custom method call. E.g., `POST /v1/{name=projects/*/serviceAccounts/*}:enable`
            () => gapi.client.iam.projects.serviceAccounts.enable({ name: serviceAccountName }),
            { function: 'enableServiceAccount', serviceAccountName }
        );
    }

    /**
     * Disables a service account. A disabled service account cannot be used to authenticate
     * or authorize requests. This is a reversible action.
     *
     * @param serviceAccountName The full resource name of the service account to disable.
     * @returns {Promise<IamServiceAccount>} A promise that resolves with the updated (disabled) `IamServiceAccount`.
     * @throws {Error} If service account name is invalid or the API call fails.
     * @example
     * ```typescript
     * const disabledSa = await iamService.disableServiceAccount('projects/my-project-id/serviceAccounts/active-sa@my-project-id.iam.gserviceaccount.com');
     * console.log('Service Account disabled:', disabledSa.email);
     * ```
     */
    public async disableServiceAccount(serviceAccountName: string): Promise<IamServiceAccount> {
        IamResourceNameBuilder._validateInput(serviceAccountName, 'Service account name for disable');

        return this._executeGapiCall<IamServiceAccount>(
            'iam.projects.serviceAccounts.disable',
            // This is typically a custom method call. E.g., `POST /v1/{name=projects/*/serviceAccounts/*}:disable`
            () => gapi.client.iam.projects.serviceAccounts.disable({ name: serviceAccountName }),
            { function: 'disableServiceAccount', serviceAccountName }
        );
    }

    /**
     * Lists all service accounts for a given project.
     *
     * @param projectId The ID of the project to list service accounts for.
     * @param options Pagination options, including `pageSize` and `pageToken`.
     * @returns {Promise<{ serviceAccounts: IamServiceAccount[]; nextPageToken?: string }>} A promise that resolves
     *          with an object containing an array of `IamServiceAccount` objects and an optional `nextPageToken`.
     * @throws {Error} If project ID is invalid or the API call fails.
     * @example
     * ```typescript
     * const accounts = await iamService.listServiceAccounts('my-project-id', { pageSize: 20 });
     * accounts.serviceAccounts.forEach(sa => console.log(sa.email));
     * ```
     */
    public async listServiceAccounts(projectId: string, options?: ListOptions): Promise<{ serviceAccounts: IamServiceAccount[]; nextPageToken?: string }> {
        IamResourceNameBuilder._validateInput(projectId, 'Project ID');

        const parentResource = IamResourceNameBuilder.buildProjectResourceName(projectId);

        const result = await this._executeGapiCall<{ accounts: IamServiceAccount[]; nextPageToken?: string }>(
            'iam.projects.serviceAccounts.list',
            () => gapi.client.iam.projects.serviceAccounts.list({
                name: parentResource,
                pageSize: options?.pageSize,
                pageToken: options?.pageToken
            }),
            { function: 'listServiceAccounts', projectId, options }
        );

        return {
            serviceAccounts: result.accounts || [],
            nextPageToken: result.nextPageToken
        };
    }

    /**
     * Creates a new key for a service account. This key can be used for programmatic authentication.
     * The `privateKeyData` is only returned *once* during creation and should be securely stored.
     *
     * @param projectId The project ID where the service account resides.
     * @param serviceAccountEmail The email of the service account for which to create the key.
     * @param privateKeyType The desired format for the private key (defaults to 'TYPE_GOOGLE_CREDENTIALS_FILE').
     * @param keyAlgorithm The algorithm to use for key generation (defaults to 'KEY_ALG_RSA_2048').
     * @returns {Promise<IamServiceAccountKey>} A promise that resolves with the created `IamServiceAccountKey` object,
     *                                          including the `privateKeyData`.
     * @throws {Error} If inputs are invalid or the API call fails.
     * @example
     * ```typescript
     * const newKey = await iamService.createServiceAccountKey(
     *   'my-project-id',
     *   'my-app-sa@my-project-id.iam.gserviceaccount.com'
     * );
     * console.log('New key ID:', newKey.name);
     * // Store newKey.privateKeyData securely!
     * ```
     */
    public async createServiceAccountKey(
        projectId: string,
        serviceAccountEmail: string,
        privateKeyType: IamServiceAccountKey['privateKeyType'] = 'TYPE_GOOGLE_CREDENTIALS_FILE',
        keyAlgorithm: IamServiceAccountKey['keyAlgorithm'] = 'KEY_ALG_RSA_2048'
    ): Promise<IamServiceAccountKey> {
        IamResourceNameBuilder._validateInput(projectId, 'Project ID');
        IamResourceNameBuilder._validateInput(serviceAccountEmail, 'Service account email');

        const serviceAccountResourceName = IamResourceNameBuilder.buildServiceAccountResourceName
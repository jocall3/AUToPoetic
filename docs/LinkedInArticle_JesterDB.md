Oh, harken, ye noble denizens of the digital realm, and lend thine ears to a tale most wondrous! For I, Jester Byte-alot, the Chief Whimsy Officer of DevCore, and humble servant to the ever-evolving tapestry of data, have stumbled upon a revelation! A grand, glorious, and utterly gut-busting evolution in the very bedrock of our applications: the local database!

No longer shall we toil in the shadows of antiquated data storage, nor shall our users endure the tedious waits of network calls for their most cherished local bits and bytes! For I present to thee, not just a mere update, but a monumental transmogrification of our beloved `dbService.ts` into the legendary **DevCore Omni-Vault: The Jester's Jewel of Data Sovereignty!**

### A Prologue of Patchwork and Ponderings

Once upon a time, in the not-so-distant past, our `dbService.ts` was a diligent, if somewhat demure, little squire. It dutifully handled our generated files, guarded a quaint vault, and kept a watchful eye on encrypted tokens and custom features. A fine fellow, indeed! But alas, the kingdom of DevCore expanded, its ambitions soared, and its hunger for data management grew insatiable!

"Hark!" cried the engineers, their brows furrowed with the weight of burgeoning features. "Our database, though loyal, lacks the panache, the multi-faceted genius, the sheer *volume* of wisdom required for our future conquests!"

And I, Jester Byte-alot, with a twinkle in my eye and a data-driven jest upon my lips, thought, "Indeed! A single-purpose tool, however sharp, cannot carve a kingdom!" We needed a data solution so robust, so versatile, so utterly *theatrical* in its capabilities, that even the most stoic database administrator would crack a smile. We needed an IndexedDB implementation that would sing, dance, juggle flaming swords of data, and still be performant enough to handle the crown jewels of user experience!

### The Grand Unveiling: DevCore Omni-Vault, The Jester's Jewel!

Feast thine eyes, noble architects and coding connoisseurs, upon the blueprint of a dream! The **DevCore Omni-Vault** is not just a database; it's a multi-tiered fortress of information, a digital cornucopia, a veritable data-deluge designed to tackle the most eccentric and demanding data needs imaginable, all within the comforting confines of your user's browser!

We’ve taken the simple, elegant foundation of `idb` and layered upon it a majestic castle of object stores, indexes so intricate they could rival a royal tapestry, and functions so numerous they form a digital legion! From the humble user setting to the most arcane analytics event, from real-time collaboration whispers to the indelible ink of an audit trail – all shall find their sanctuary within the Omni-Vault!

Let us embark on a jester's tour through the magnificent halls of this expanded database service, where every function is a flourish, and every store holds a story!

#### The Foundations Reimagined: More Stores, More Glory!

Our journey begins with the very heart of the Omni-Vault: its schema. We've not merely added a room or two; we've built entire wings! The original four stores (Files, Vault, Encrypted Tokens, Custom Features) now find themselves in esteemed company, joined by a bustling metropolis of specialized data havens:

*   **User Settings Store**: For the personalized quirks and preferences of every subject in our digital domain.
*   **Activity Log Store**: To record every noble deed and minor mishap, a chronicle for the ages!
*   **Background Tasks Store**: For the silent workhorses, the unsung heroes processing data behind the scenes.
*   **Notifications Store**: To deliver pronouncements and whispers, ensuring no user misses a beat.
*   **App Cache Store**: A temporary pantry for frequently accessed provisions, preventing undue burden on the royal kitchens (i.e., network).
*   **Audit Trail Store**: The unblinking eye, recording every change, every query, every crucial decree.
*   **Version Control Store**: For when innovation demands a rewind, a safety net for every creative leap.
*   **Collaboration Data Store**: To facilitate real-time camaraderie and shared genius among our artisans.
*   **Analytics Events Store**: To capture the joyous applause and thoughtful musings of our audience.
*   **Plugin Configurations Store**: For the myriad extensions and enhancements that make DevCore a marvel.
*   **Transaction Log Store**: The ultimate scribe, ensuring that even the most complex multi-act data plays are recorded with precision.

Each of these new chambers comes equipped with its own array of indexes, like secret passages and hidden compartments, allowing for retrieval speeds that would make a cheetah blush!

#### The Alchemist's Anvil: The `upgrade` Function, Forged Anew!

Ah, the `upgrade` function! The alchemist's forge where old versions are transmuted into new, where data migrations are performed with the precision of a master surgeon and the flair of a circus performer! Our Omni-Vault boasts an `upgrade` path so meticulously crafted, it navigates the treacherous waters of database evolution with the grace of a swan and the resilience of a siege engine.

From version 0 to 7, each step is a testament to foresight, ensuring that no data is lost, no index is forgotten, and every new store is brought into being with the appropriate pomp and circumstance. It's a ballet of `createObjectStore` and `createIndex` calls, a veritable symphony of schema metamorphosis!

#### The Jester's Toolkit: General Database Management

What good is a magnificent fortress without its trusty custodians? The Omni-Vault provides a suite of general management tools, as versatile as a jester's wit:

*   **`getDbStatus`**: A royal census of the database, revealing its name, version, store names, and the bustling count of records within each.
*   **`clearAllOmniVaultData`**: The ultimate reset button, for when a truly fresh start is required, akin to clearing the royal court for a new play.
*   **`exportAllData`**: A magical parchment that records the entire kingdom's data for safekeeping, a backup scroll of unparalleled importance.
*   **`importAllData`**: The restoration incantation, bringing life back to a previously exported realm.

#### The Chronicles of Files: `Generated Files Store` (Expanded)

Our initial files store has grown beyond mere saving and retrieving. It now understands the nuances of ownership, the urgency of recency, and the finality of deletion. Imagine: a librarian who not only knows where every scroll is but also who authored it and when it was last consulted!

*   `getFilesByOwner`, `getRecentFiles`, `deleteFileByPath` – precision and power for your file management.

#### The Secret Keep: `Vault Store` (Expanded)

The vault, once a simple strongbox, now whispers of temporal awareness. We track `updatedAt` timestamps, ensuring that even the most clandestine data reveals its last touch.

*   `getVaultDataUpdatedSince`, `deleteVaultData` – because some secrets are time-sensitive, and others are better off forgotten.

#### The Oath of Secrecy: `Encrypted Tokens Store` (Expanded)

Our encrypted tokens, the very keys to our digital kingdom, are now handled with even greater discernment. We can identify tokens by their user, purge the expired ones, and maintain a pristine collection of digital credentials.

*   `getTokensByUserId`, `getExpiredTokens`, `deleteEncryptedToken` – for a robust and secure token economy.

#### The Whims of Innovation: `Custom Features Store` (Expanded)

Custom features, the very spirit of DevCore's adaptability, are now managed with a keen eye on their status and priority. Imagine a royal project manager who knows exactly which innovations are "under construction" and which demand immediate attention!

*   `getCustomFeature`, `getFeaturesByStatus`, `getHighPriorityFeatures` – prioritizing progress with panache.

#### The Personal Touch: `User Settings Store`

Every jester knows that the audience delights in personalization! This store allows each user to tailor their DevCore experience, from color schemes to notification preferences, ensuring comfort and delight for all.

*   `saveUserSetting`, `getUserSetting`, `getSettingsByUserId`, `getSettingsByCategory` – individual preferences, universally cherished.

#### The Court Records: `Activity Log Store`

Every significant action, from a jester's successful jest to a developer's glorious commit, is etched into the activity log. This is the official chronicle of all happenings, providing an invaluable audit trail and a window into user engagement.

*   `logActivity`, `getAllActivityLogs`, `getActivityLogsByUserId`, `getRecentActivityLogs`, `clearActivityLogsOlderThan` – a history book for your application.

#### The Invisible Hands: `Background Tasks Store`

For the tasks that toil behind the curtains, unnoticed yet essential, this store manages scheduled processes. Think of it as the unseen mechanics of a grand theatrical production, ensuring everything runs smoothly, even when the spotlight is elsewhere.

*   `scheduleTask`, `getTask`, `getTasksByStatus`, `updateTaskStatus`, `deleteTask` – mastering the magic of asynchronous operations.

#### The Royal Proclamations: `Notifications Store`

Alerts, announcements, gentle nudges – the notifications store ensures that critical information reaches the right user at the right time. No more missed cues, no more forgotten appointments!

*   `addNotification`, `getNotification`, `getNotificationsForUser`, `getUnreadNotificationsForUser`, `markNotificationAsRead` – the messengers of your application.

#### The Speedy Snack Cache: `App Cache Store`

Why fetch from distant lands when provisions can be stored locally? The app cache is a temporary larder for frequently accessed data, dramatically improving performance and user satisfaction. Expired items are swept away like stale crumbs, ensuring freshness!

*   `setCacheItem`, `getCacheItem`, `getCacheItemsByTag`, `clearExpiredCacheItems` – performance, personified!

#### The Eye of Sauron, I mean, Scrutiny: `Audit Trail Store`

Every change, every deletion, every crucial interaction is now immutably logged. This store is the ultimate guardian of integrity, providing an indisputable record for compliance, debugging, and historical review. A true boon for any kingdom!

*   `logAuditEntry`, `getAuditEntriesForEntity`, `getRecentAuditEntries`, `deleteOldAuditEntries` – transparency and accountability, enshrined.

#### The Time-Turner: `Version Control Store`

For files that evolve, iterate, and transform, the version control store offers a magical "undo" button. Never fear a misplaced comma or a forgotten function again; every iteration is a moment captured, ready to be revisited or restored.

*   `saveFileVersion`, `getFileVersions`, `getSpecificFileVersion`, `deleteAllFileVersions` – mastering the flow of time and change.

#### The Grand Conclave: `Collaboration Data Store`

In our interconnected world, collaboration is king! This store orchestrates real-time presence, shared annotations, and concurrent editing data, transforming individual efforts into a symphonic masterpiece.

*   `updateCollaboratorPresence`, `getCollaboratorsInSession`, `getCollaboratorsOnEntity`, `cleanUpOldCollaboratorPresences` – fostering fellowship and shared creativity.

#### The Seer's Insights: `Analytics Events Store`

Every click, every scroll, every moment of user engagement is a pearl of wisdom. The analytics store collects these insights, allowing us to understand our audience, refine our offerings, and predict the future (or at least, make highly educated guesses)!

*   `recordAnalyticsEvent`, `getAnalyticsEventsByType`, `getAnalyticsEventsForUser`, `getAnalyticsEventsInDateRange` – the oracle of user behavior.

#### The Arcane Scrolls: `Plugin Configurations Store`

For the myriad enchantments and extensions that empower DevCore, this store provides a stable home for their configurations. Enable, disable, tweak, and personalize plugins with ease, without disturbing the core magic.

*   `savePluginConfig`, `getPluginConfig`, `getEnabledPluginConfigs`, `getPluginConfigsByName` – empowering extensibility.

#### The Master's Ledger: `Transaction Log Store`

When operations become complex, involving multiple stores and intricate sequences, the transaction log steps in as the master's ledger. It records the meta-journey of these multi-step processes, aiding in debugging, recovery, and deep auditing.

*   `logTransaction`, `getTransactionsByStatus`, `getTransactionsInDateRange` – the meta-data maestro.

#### The Grand Symphony: Composite Operations

But the true genius of the DevCore Omni-Vault lies not just in its individual instruments, but in the harmonious concert they can perform together! Behold, the power of atomic transactions, orchestrated across multiple stores to ensure data consistency and integrity, even amidst the most chaotic digital dances!

Observe how we can save a file and simultaneously log the activity, ensuring no stone is left unturned in our chronicles. Or how a new feature can be unveiled and all relevant users notified in one seamless, unbreakable act. And for the grand finale, imagine deleting a file, its entire version history, and every associated audit and activity log entry – all in a single, unwavering transaction, leaving no ghostly remnants behind! This is the alchemy of `withTransaction`, transforming disparate operations into an atomic ballet!

### The Code, The Whole Code, and Nothing But The Code!

Enough with the jester's musings! For those with the keen eye for detail and the heart for hardcore code, I present the full, glorious, expanded source of the **DevCore Omni-Vault: The Jester's Jewel of Data Sovereignty**! Behold its majesty, its intricacy, its sheer, unadulterated brilliance!

```typescript
// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import { openDB, DBSchema, IDBPDatabase, IDBPTransaction } from 'idb'; // Added IDBPTransaction for advanced usage
import type { // Expanded types list to support all new stores and enhanced existing ones
  GeneratedFile, EncryptedData, CustomFeature,
  // New types required for the DevCore Omni-Vault stores
  UserSetting, // For user preferences, themes, etc.
  ActivityLogEntry, // For tracking user actions and system events
  BackgroundTask, // For managing asynchronous operations
  Notification, // For in-app user notifications
  CachedItem, // For temporary data caching with expiry
  AuditEntry, // For immutable historical records of changes
  VersionedFile, // For storing different versions of documents or files
  CollaboratorPresence, // For real-time user presence and interaction data
  AnalyticsEvent, // For capturing usage metrics and user behavior
  PluginConfig, // For managing configurations of various extensions/plugins
  // Additional hypothetical types for deeper complexity, though not all explicitly used in simple CRUD
  VaultMeta, SecureKeyData, ComplexFeatureDetail, FileMetadata,
} from '../types.ts'; // A truly magnificent types file must exist for this grand system!

const DB_NAME = 'devcore-omnivault-db'; // A new, grander name for our expanded database!
const DB_VERSION = 7; // Significantly incremented to demonstrate extensive migration paths

// Store names for DevCore Omni-Vault
const FILES_STORE_NAME = 'generated-files';
const VAULT_STORE_NAME = 'vault-data';
const ENCRYPTED_TOKENS_STORE_NAME = 'encrypted-tokens';
const CUSTOM_FEATURES_STORE_NAME = 'custom-features';

// Newly introduced object stores, each serving a vital purpose in our digital kingdom
const USER_SETTINGS_STORE_NAME = 'user-settings';
const ACTIVITY_LOG_STORE_NAME = 'activity-log';
const BACKGROUND_TASKS_STORE_NAME = 'background-tasks';
const NOTIFICATIONS_STORE_NAME = 'notifications';
const CACHE_STORE_NAME = 'app-cache';
const AUDIT_TRAIL_STORE_NAME = 'audit-trail';
const VERSION_CONTROL_STORE_NAME = 'version-control';
const COLLABORATION_STORE_NAME = 'collaboration-data';
const ANALYTICS_STORE_NAME = 'analytics-events';
const PLUGIN_CONFIGS_STORE_NAME = 'plugin-configs';
const TRANSACTION_LOG_STORE_NAME = 'transaction-log'; // For logging complex, multi-step operations

/**
 * Defines the entire schema for the DevCore Omni-Vault database.
 * Each property represents an object store with its key path, value type, and defined indexes.
 * This comprehensive schema ensures type safety and efficient data retrieval across all application domains.
 */
interface DevCoreOmniVaultDB extends DBSchema {
  [FILES_STORE_NAME]: {
    key: string; // filePath acts as the primary key
    value: GeneratedFile;
    indexes: {
        'by-filePath': string; // Ensures unique file paths for quick lookup
        'by-createdAt': Date; // For sorting and retrieving recent files
        'by-ownerId': string; // For filtering files belonging to a specific user
    };
  };
  [VAULT_STORE_NAME]: {
    key: string; // Arbitrary key for vault entries
    value: any; // Flexible storage for various sensitive data
    indexes: {
        'by-updatedAt': Date; // To track and retrieve recently modified vault entries
    };
  };
  [ENCRYPTED_TOKENS_STORE_NAME]: {
    key: string; // The unique ID of the encrypted token
    value: EncryptedData; // Contains encrypted token data
    indexes: {
        'by-userId': string; // For retrieving tokens associated with a specific user
        'by-expiresAt': Date; // To efficiently manage token expiration and cleanup
    };
  };
  [CUSTOM_FEATURES_STORE_NAME]: {
    key: string; // Unique ID for custom features
    value: CustomFeature; // Details about a custom feature
    indexes: {
        'by-status': string; // For filtering features by their development or deployment status
        'by-priority': number; // For ordering features by their importance or urgency
    };
  };
  [USER_SETTINGS_STORE_NAME]: {
    key: string; // Unique ID for a user setting (e.g., userId_settingKey)
    value: UserSetting; // User-specific preferences and configurations
    indexes: {
        'by-userId': string; // To fetch all settings for a particular user
        'by-category': string; // To group settings by functional categories (e.g., 'theme', 'notifications')
    };
  };
  [ACTIVITY_LOG_STORE_NAME]: {
    key: string; // Unique ID for each log entry
    value: ActivityLogEntry; // Record of user actions or system events
    indexes: {
        'by-timestamp': Date; // For chronological ordering and querying activities within a time range
        'by-actionType': string; // For filtering logs by the type of action performed
        'by-userId': string; // For retrieving all activities performed by a specific user
    };
  };
  [BACKGROUND_TASKS_STORE_NAME]: {
    key: string; // Unique ID for a background task
    value: BackgroundTask; // Details about an asynchronous task
    indexes: {
        'by-status': string; // For filtering tasks by their current execution status (e.g., 'pending', 'running', 'completed')
        'by-scheduledFor': Date; // To fetch tasks scheduled for a specific time or within a time window
        'by-priority': number; // To prioritize task execution (lower number = higher priority)
    };
  };
  [NOTIFICATIONS_STORE_NAME]: {
    key: string; // Unique ID for a notification
    value: Notification; // User notification message and metadata
    indexes: {
        'by-userId': string; // To retrieve all notifications for a specific user
        'by-readStatus': boolean; // To filter notifications by their read status (read/unread)
        'by-createdAt': Date; // For displaying notifications in chronological order
    };
  };
  [CACHE_STORE_NAME]: {
    key: string; // Cache key (e.g., URL, data identifier)
    value: CachedItem; // Stored cached data with expiry information
    indexes: {
        'by-expiresAt': Date; // To efficiently clear expired cache entries
        'by-tag': string; // For grouping and managing related cache items
    };
  };
  [AUDIT_TRAIL_STORE_NAME]: {
    key: string; // Unique ID for each audit entry
    value: AuditEntry; // Immutable record of changes to critical data or system actions
    indexes: {
        'by-entityType': string; // For filtering audit entries by the type of entity affected
        'by-entityId': string; // For retrieving all audit entries related to a specific entity
        'by-timestamp': Date; // For chronological ordering and range queries on audit records
    };
  };
  [VERSION_CONTROL_STORE_NAME]: {
    key: string; // Unique ID for each file version (e.g., fileId_versionNumber)
    value: VersionedFile; // Stores details and content of a specific file version
    indexes: {
        'by-fileId': string; // To retrieve all versions associated with a particular file
        'by-versionNumber': number; // To fetch versions by their sequential number
        'by-timestamp': Date; // For chronological ordering of file versions
    };
  };
  [COLLABORATION_STORE_NAME]: {
    key: string; // Unique ID for a collaboration presence (e.g., sessionId_entityId_userId)
    value: CollaboratorPresence; // Real-time presence and interaction data for collaborative features
    indexes: {
        'by-sessionId': string; // To get all collaborators within a specific session
        'by-entityId': string; // To get collaborators working on a particular entity (e.g., document)
        'by-userId': string; // To find collaboration activities for a given user
        'by-lastSeen': Date; // For cleaning up inactive collaborator presences
    };
  };
  [ANALYTICS_STORE_NAME]: {
    key: string; // Unique ID for each analytics event
    value: AnalyticsEvent; // Data point for user behavior analysis
    indexes: {
        'by-eventType': string; // To filter analytics events by their classification (e.g., 'click', 'pageview', 'error')
        'by-timestamp': Date; // For chronological analysis and time-based reporting
        'by-userId': string; // To track the analytics journey of individual users
    };
  };
  [PLUGIN_CONFIGS_STORE_NAME]: {
    key: string; // Unique ID for a plugin's configuration
    value: PluginConfig; // Configuration settings for a specific plugin or extension
    indexes: {
        'by-pluginName': string; // To retrieve configurations based on the plugin's name
        'by-enabled': boolean; // To quickly fetch all currently enabled or disabled plugin configurations
    };
  };
  [TRANSACTION_LOG_STORE_NAME]: {
    key: string; // Unique ID for each complex transaction log entry
    value: any; // Detailed log object, highly flexible for complex operations
    indexes: {
        'by-timestamp': Date; // For chronological tracking of transaction events
        'by-status': string; // To filter transactions by their outcome (e.g., 'pending', 'committed', 'rolledback')
    };
  };
}

/**
 * Initializes and upgrades the DevCore Omni-Vault database.
 * This function orchestrates the creation of object stores and indexes as the database version evolves,
 * ensuring seamless schema migrations without data loss.
 */
const dbPromise = openDB<DevCoreOmniVaultDB>(DB_NAME, DB_VERSION, {
  async upgrade(db, oldVersion, newVersion, transaction) { // 'transaction' parameter is crucial for atomic migrations
    console.log(`Jester Byte-alot proudly announces: DevCore Omni-Vault upgrading from version ${oldVersion} to ${newVersion}!`);

    // The grand migration journey begins! Each 'case' represents a significant leap in our database's evolution.
    switch (oldVersion) {
        case 0:
            // Initial setup for version 1: The birth of the 'generated-files' store.
            console.log('Case 0: Establishing the foundational Generated Files store.');
            const filesStoreV1 = db.createObjectStore(FILES_STORE_NAME, {
                keyPath: 'filePath', // file path is chosen as the unique identifier
            });
            filesStoreV1.createIndex('by-filePath', 'filePath', { unique: true }); // Ensure no two files share the same path
            // Fallthrough to apply subsequent upgrades immediately for new installations.
        case 1:
            // Upgrade from version 1 to 2: Introducing 'vault-data' and 'encrypted-tokens' for core security.
            console.log('Case 1: Unveiling the Vault Data and Encrypted Tokens stores.');
            if (!db.objectStoreNames.contains(VAULT_STORE_NAME)) {
                db.createObjectStore(VAULT_STORE_NAME); // Simple key-value store, key not explicitly defined here
            }
            if (!db.objectStoreNames.contains(ENCRYPTED_TOKENS_STORE_NAME)) {
                db.createObjectStore(ENCRYPTED_TOKENS_STORE_NAME, { keyPath: 'id' }); // Each token needs a unique ID
            }
        case 2:
            // Upgrade from version 2 to 3: Adding 'custom-features' for extensible functionality.
            console.log('Case 2: Erecting the Custom Features store.');
             if (!db.objectStoreNames.contains(CUSTOM_FEATURES_STORE_NAME)) {
                db.createObjectStore(CUSTOM_FEATURES_STORE_NAME, { keyPath: 'id' }); // Unique ID for each custom feature
            }
        case 3:
            // Upgrade from version 3 to 4: The era of personalization and diligent record-keeping.
            // Introduction of 'user-settings' and 'activity-log' stores.
            console.log('Case 3: Ushering in User Settings and Activity Log stores, and enhancing existing indexes!');

            // Creating the User Settings store
            const userSettingsStore = db.createObjectStore(USER_SETTINGS_STORE_NAME, { keyPath: 'id' });
            userSettingsStore.createIndex('by-userId', 'userId'); // Efficiently retrieve settings for a user
            userSettingsStore.createIndex('by-category', 'category'); // Organize settings by their type

            // Creating the Activity Log store
            const activityLogStore = db.createObjectStore(ACTIVITY_LOG_STORE_NAME, { keyPath: 'id' });
            activityLogStore.createIndex('by-timestamp', 'timestamp'); // For chronological activity feeds
            activityLogStore.createIndex('by-actionType', 'actionType'); // Filter by specific actions (e.g., 'login', 'file_save')
            activityLogStore.createIndex('by-userId', 'userId'); // Track activities per user

            // Enhancing existing stores with new indexes for improved querying
            const filesStoreV4 = transaction.objectStore(FILES_STORE_NAME);
            if (!filesStoreV4.indexNames.contains('by-createdAt')) {
                filesStoreV4.createIndex('by-createdAt', 'createdAt');
            }
            if (!filesStoreV4.indexNames.contains('by-ownerId')) {
                filesStoreV4.createIndex('by-ownerId', 'ownerId');
            }

            const vaultStoreV4 = transaction.objectStore(VAULT_STORE_NAME);
            if (!vaultStoreV4.indexNames.contains('by-updatedAt')) {
                vaultStoreV4.createIndex('by-updatedAt', 'updatedAt');
            }

        case 4:
            // Upgrade from version 4 to 5: Empowering background processes, direct communication, and rapid access.
            // Introduction of 'background-tasks', 'notifications', and 'app-cache' stores.
            console.log('Case 4: Deploying Background Tasks, Notifications, and the App Cache!');

            // Creating the Background Tasks store
            const backgroundTasksStore = db.createObjectStore(BACKGROUND_TASKS_STORE_NAME, { keyPath: 'id' });
            backgroundTasksStore.createIndex('by-status', 'status'); // Monitor task lifecycle
            backgroundTasksStore.createIndex('by-scheduledFor', 'scheduledFor'); // Manage task scheduling
            backgroundTasksStore.createIndex('by-priority', 'priority'); // Prioritize important tasks

            // Creating the Notifications store
            const notificationsStore = db.createObjectStore(NOTIFICATIONS_STORE_NAME, { keyPath: 'id' });
            notificationsStore.createIndex('by-userId', 'userId'); // Direct notifications to specific users
            notificationsStore.createIndex('by-readStatus', 'readStatus'); // Distinguish new from old messages
            notificationsStore.createIndex('by-createdAt', 'createdAt'); // Display notifications chronologically

            // Creating the App Cache store
            const cacheStore = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'key' });
            cacheStore.createIndex('by-expiresAt', 'expiresAt'); // Automate cache invalidation
            cacheStore.createIndex('by-tag', 'tag'); // Group related cache entries

            // Further enhancing existing stores
            const encryptedTokensStoreV5 = transaction.objectStore(ENCRYPTED_TOKENS_STORE_NAME);
            if (!encryptedTokensStoreV5.indexNames.contains('by-userId')) {
                encryptedTokensStoreV5.createIndex('by-userId', 'userId');
            }
            if (!encryptedTokensStoreV5.indexNames.contains('by-expiresAt')) {
                encryptedTokensStoreV5.createIndex('by-expiresAt', 'expiresAt');
            }

            const customFeaturesStoreV5 = transaction.objectStore(CUSTOM_FEATURES_STORE_NAME);
            if (!customFeaturesStoreV5.indexNames.contains('by-status')) {
                customFeaturesStoreV5.createIndex('by-status', 'status');
            }
            if (!customFeaturesStoreV5.indexNames.contains('by-priority')) {
                customFeaturesStoreV5.createIndex('by-priority', 'priority');
            }

        case 5:
            // Upgrade from version 5 to 6: Forging robust audit trails, historical integrity, collaborative magic, and deep insights.
            // Introduction of 'audit-trail', 'version-control', 'collaboration-data', and 'analytics-events' stores.
            console.log('Case 5: Erecting Audit Trails, Version Control, Collaboration Hubs, and Analytics Engines!');

            // Creating the Audit Trail store
            const auditTrailStore = db.createObjectStore(AUDIT_TRAIL_STORE_NAME, { keyPath: 'id' });
            auditTrailStore.createIndex('by-entityType', 'entityType'); // Track changes across different data types
            auditTrailStore.createIndex('by-entityId', 'entityId'); // Pinpoint audits for specific records
            auditTrailStore.createIndex('by-timestamp', 'timestamp'); // Chronological audit logs

            // Creating the Version Control store
            const versionControlStore = db.createObjectStore(VERSION_CONTROL_STORE_NAME, { keyPath: 'id' });
            versionControlStore.createIndex('by-fileId', 'fileId'); // All versions for a specific file
            versionControlStore.createIndex('by-versionNumber', 'versionNumber'); // Retrieve specific historical states
            versionControlStore.createIndex('by-timestamp', 'timestamp'); // Order versions by creation time

            // Creating the Collaboration Data store
            const collaborationStore = db.createObjectStore(COLLABORATION_STORE_NAME, { keyPath: 'id' });
            collaborationStore.createIndex('by-sessionId', 'sessionId'); // Collaborators in a shared context
            collaborationStore.createIndex('by-entityId', 'entityId'); // Collaborators on a specific item
            collaborationStore.createIndex('by-userId', 'userId'); // Activities of a particular collaborator
            collaborationStore.createIndex('by-lastSeen', 'lastSeen'); // Manage active vs. inactive presence

            // Creating the Analytics Events store
            const analyticsStore = db.createObjectStore(ANALYTICS_STORE_NAME, { keyPath: 'id' });
            analyticsStore.createIndex('by-eventType', 'eventType'); // Categorize user interactions
            analyticsStore.createIndex('by-timestamp', 'timestamp'); // Temporal analysis of events
            analyticsStore.createIndex('by-userId', 'userId'); // User journey mapping

        case 6:
            // Upgrade from version 6 to 7: The pinnacle of extensibility and operational oversight.
            // Introduction of 'plugin-configs' and 'transaction-log' stores.
            console.log('Case 6: Unlocking Plugin Configurations and the mighty Transaction Log!');

            // Creating the Plugin Configurations store
            const pluginConfigsStore = db.createObjectStore(PLUGIN_CONFIGS_STORE_NAME, { keyPath: 'id' });
            pluginConfigsStore.createIndex('by-pluginName', 'pluginName'); // Fetch configs for a specific plugin
            pluginConfigsStore.createIndex('by-enabled', 'enabled'); // Quickly list active plugins

            // Creating the Transaction Log store
            const transactionLogStore = db.createObjectStore(TRANSACTION_LOG_STORE_NAME, { keyPath: 'id' });
            transactionLogStore.createIndex('by-timestamp', 'timestamp'); // Chronological record of complex transactions
            transactionLogStore.createIndex('by-status', 'status'); // Track success or failure of multi-step processes

            // No fallthrough for the latest version, as all upgrades have been applied.
            break;
    }
    console.log(`DevCore Omni-Vault upgrade to version ${newVersion} complete! Let the data flow!`);
  },
});

/**
 * A robust helper function to wrap IndexedDB operations within an atomic transaction.
 * This ensures that a group of database operations either all succeed or all fail,
 * maintaining data consistency and integrity, worthy of a royal decree!
 *
 * @param storeNames An array of store names involved in the transaction.
 * @param mode The transaction mode ('readonly' or 'readwrite').
 * @param callback The asynchronous function containing the database operations.
 * @returns A promise that resolves with the result of the callback function.
 * @throws An error if the transaction fails for any reason.
 */
const withTransaction = async <T>(
    storeNames: (keyof DevCoreOmniVaultDB)[],
    mode: IDBTransactionMode,
    callback: (tx: IDBPTransaction<DevCoreOmniVaultDB>) => Promise<T>
): Promise<T> => {
    const db = await dbPromise;
    const tx = db.transaction(storeNames, mode);
    try {
        const result = await callback(tx);
        await tx.done; // Ensures all operations in the transaction are complete
        return result;
    } catch (error) {
        console.error(`Jester's misfortune! Transaction failed for stores [${storeNames.join(', ')}]:`, error);
        tx.abort(); // Rollback all changes if an error occurs
        throw error; // Re-throw the error for upstream handling
    }
};

// --- General DevCore Omni-Vault Management Functions ---
// These functions provide overarching control and insights into the entire database system.

/**
 * Retrieves the current status and metadata of the DevCore Omni-Vault database.
 * This includes its name, version, available object stores, and the record count within each store.
 * A truly insightful census of our digital domain!
 *
 * @returns An object containing database metadata and store counts.
 */
export const getDbStatus = async () => {
    const db = await dbPromise;
    const storeCounts: { [key: string]: number } = {};
    for (const storeName of db.objectStoreNames) {
        // Asynchronously count records in each store
        storeCounts[storeName] = await db.count(storeName as keyof DevCoreOmniVaultDB);
    }
    return {
        name: db.name,
        version: db.version,
        objectStoreNames: Array.from(db.objectStoreNames), // Convert DOMStringList to an array
        storeCounts: storeCounts,
        isOpen: db.isOpen, // Indicates if the connection is currently active
    };
};

/**
 * Clears all data from ALL object stores within the DevCore Omni-Vault.
 * Use with extreme caution, as this is akin to a royal decree to wipe the slate clean!
 *
 * @returns A Promise that resolves when all data has been cleared.
 */
export const clearAllOmniVaultData = async (): Promise<void> => {
    const db = await dbPromise;
    // Initiate a readwrite transaction across all object stores for comprehensive clearing.
    const tx = db.transaction(db.objectStoreNames, 'readwrite');
    await Promise.all(Array.from(db.objectStoreNames).map(storeName =>
        tx.objectStore(storeName as keyof DevCoreOmniVaultDB).clear()
    ));
    await tx.done; // Ensure the transaction completes successfully.
    console.log('Jester Byte-alot confirms: All DevCore Omni-Vault data has been ceremoniously cleared.');
};

/**
 * Exports all data from every object store in the DevCore Omni-Vault.
 * This function creates a comprehensive snapshot of the entire database,
 * suitable for backup, migration, or external analysis. A true digital archive!
 *
 * @returns A Promise that resolves with a record where keys are store names and values are arrays of all records.
 */
export const exportAllData = async (): Promise<Record<string, any[]>> => {
    const db = await dbPromise;
    const allData: Record<string, any[]> = {};
    // Create a readonly transaction across all stores for safe data extraction.
    const tx = db.transaction(db.objectStoreNames, 'readonly');
    await Promise.all(Array.from(db.objectStoreNames).map(async (storeName) => {
        // Retrieve all records from each store.
        allData[storeName] = await tx.objectStore(storeName as keyof DevCoreOmniVaultDB).getAll();
    }));
    await tx.done; // Await the completion of the transaction.
    console.log('Jester Byte-alot presents: DevCore Omni-Vault data successfully exported!');
    return allData;
};

/**
 * Imports data into the DevCore Omni-Vault from a provided data object.
 * This operation first clears existing data in each target store to prevent key collisions,
 * then adds the new records. A grand restoration of our digital realm!
 *
 * @param data A record where keys are store names and values are arrays of records to be imported.
 * @returns A Promise that resolves when all data has been imported.
 */
export const importAllData = async (data: Record<string, any[]>): Promise<void> => {
    const db = await dbPromise;
    // Create a readwrite transaction across all stores that might receive data.
    const tx = db.transaction(db.objectStoreNames, 'readwrite');
    await Promise.all(Object.entries(data).map(async ([storeName, records]) => {
        if (db.objectStoreNames.contains(storeName)) { // Ensure the store actually exists in the current schema.
            const store = tx.objectStore(storeName as keyof DevCoreOmniVaultDB);
            await store.clear(); // Clear existing data to ensure a clean import.
            // Add each record. Using 'add' ensures uniqueness if keyPath is defined and prevents overwriting.
            for (const record of records) {
                try {
                    await store.add(record);
                } catch (e) {
                    console.warn(`Jester's dilemma! Could not add record to ${storeName}:`, record, e);
                }
            }
        } else {
            console.warn(`Jester's puzzlement! Attempted to import data for non-existent store: ${storeName}. Skipping.`);
        }
    }));
    await tx.done; // Finalize the grand import ceremony.
    console.log('Jester Byte-alot proclaims: All DevCore Omni-Vault data successfully imported!');
};


// --- Generated Files Store (Expanded Arsenal of File Operations) ---

/**
 * Saves or updates a generated file in the `generated-files` store.
 * If a file with the same `filePath` exists, it will be updated; otherwise, a new file will be added.
 *
 * @param file The GeneratedFile object to save.
 * @returns A Promise that resolves when the file is saved.
 */
export const saveFile = async (file: GeneratedFile): Promise<void> => {
  const db = await dbPromise;
  await db.put(FILES_STORE_NAME, file);
  console.log(`Jester's quill: File '${file.filePath}' has been penned into the Omni-Vault.`);
};

/**
 * Retrieves all generated files from the `generated-files` store.
 *
 * @returns A Promise that resolves with an array of all GeneratedFile objects.
 */
export const getAllFiles = async (): Promise<GeneratedFile[]> => {
  const db = await dbPromise;
  console.log('Jester surveys: Retrieving all files from the Omni-Vault archives.');
  return db.getAll(FILES_STORE_NAME);
};

/**
 * Retrieves a specific generated file by its unique file path.
 *
 * @param filePath The unique path of the file to retrieve.
 * @returns A Promise that resolves with the GeneratedFile object, or `undefined` if not found.
 */
export const getFileByPath = async (filePath: string): Promise<GeneratedFile | undefined> => {
  const db = await dbPromise;
  console.log(`Jester seeks: Locating file at path '${filePath}'.`);
  return db.get(FILES_STORE_NAME, filePath);
};

/**
 * Clears all generated files from the `generated-files` store.
 * A clean slate for your creative endeavors!
 *
 * @returns A Promise that resolves when all files are cleared.
 */
export const clearAllFiles = async (): Promise<void> => {
  const db = await dbPromise;
  await db.clear(FILES_STORE_NAME);
  console.log('Jester declares: All generated files have been cleared from the Omni-Vault!');
};

/**
 * Retrieves all generated files associated with a specific owner ID, using the 'by-ownerId' index.
 * This is crucial for multi-user environments where files are attributed to their creators.
 *
 * @param ownerId The ID of the owner whose files are to be retrieved.
 * @returns A Promise that resolves with an array of GeneratedFile objects.
 */
export const getFilesByOwner = async (ownerId: string): Promise<GeneratedFile[]> => {
    const db = await dbPromise;
    console.log(`Jester fetches: All files for owner '${ownerId}' from the indexed scrolls.`);
    return db.getAllFromIndex(FILES_STORE_NAME, 'by-ownerId', ownerId);
};

/**
 * Retrieves a limited number of the most recently created files.
 * This uses a cursor on the 'by-createdAt' index in reverse order for efficiency.
 *
 * @param limit The maximum number of recent files to retrieve (default: 10).
 * @returns A Promise that resolves with an array of recent GeneratedFile objects.
 */
export const getRecentFiles = async (limit: number = 10): Promise<GeneratedFile[]> => {
    const db = await dbPromise;
    const tx = db.transaction(FILES_STORE_NAME, 'readonly');
    const store = tx.objectStore(FILES_STORE_NAME);
    const index = store.index('by-createdAt');
    const files: GeneratedFile[] = [];
    let count = 0;
    // Open a cursor in 'prev' direction to get the newest files first.
    let cursor = await index.openCursor(null, 'prev');
    while (cursor && count < limit) {
        files.push(cursor.value);
        cursor = await cursor.continue();
        count++;
    }
    await tx.done;
    console.log(`Jester presents: The ${count} most recent files, hot off the press!`);
    return files;
};

/**
 * Deletes a specific generated file by its unique file path.
 * A swift sweep of unwanted scrolls!
 *
 * @param filePath The unique path of the file to delete.
 * @returns A Promise that resolves when the file is deleted.
 */
export const deleteFileByPath = async (filePath: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(FILES_STORE_NAME, filePath);
    console.log(`Jester incinerates: File at path '${filePath}' vanished from the Omni-Vault.`);
};

// --- Vault Store (Expanded with Temporal Awareness) ---

/**
 * Saves or updates a piece of vault data.
 * Automatically adds or updates an `updatedAt` timestamp for temporal tracking.
 *
 * @param key The unique key for the vault entry.
 * @param value The data to store in the vault.
 * @returns A Promise that resolves when the data is saved.
 */
export const saveVaultData = async (key: string, value: any): Promise<void> => {
  const db = await dbPromise;
  // Store the value wrapped in an object to include metadata like 'updatedAt'.
  await db.put(VAULT_STORE_NAME, { value: value, updatedAt: new Date() }, key);
  console.log(`Jester guards: Vault entry '${key}' securely updated with latest wisdom.`);
};

/**
 * Retrieves a piece of vault data by its unique key.
 *
 * @param key The unique key of the vault entry to retrieve.
 * @returns A Promise that resolves with the vault data, or `undefined` if not found.
 */
export const getVaultData = async (key: string): Promise<any | undefined> => {
  const db = await dbPromise;
  const data = await db.get(VAULT_STORE_NAME, key);
  console.log(`Jester fetches: Unlocking vault entry '${key}'.`);
  return data ? data.value : undefined; // Return the actual value, not the wrapper object.
};

/**
 * Retrieves all vault data entries that have been updated since a specific date.
 * Useful for synchronization or change tracking.
 *
 * @param date The Date object to compare against; entries updated after this date will be returned.
 * @returns A Promise that resolves with an array of vault data values.
 */
export const getVaultDataUpdatedSince = async (date: Date): Promise<any[]> => {
    const db = await dbPromise;
    const items = await db.getAllFromIndex(VAULT_STORE_NAME, 'by-updatedAt', IDBKeyRange.lowerBound(date));
    console.log(`Jester consults: Retrieving vault secrets updated since ${date.toISOString()}.`);
    return items.map(item => item.value); // Extract the actual values from the wrapper objects.
};

/**
 * Deletes a specific piece of vault data by its unique key.
 * Some secrets are best forgotten.
 *
 * @param key The unique key of the vault entry to delete.
 * @returns A Promise that resolves when the data is deleted.
 */
export const deleteVaultData = async (key: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(VAULT_STORE_NAME, key);
    console.log(`Jester discards: Vault entry '${key}' has been obliterated.`);
};

// --- Encrypted Tokens Store (Expanded with User and Expiry Management) ---

/**
 * Saves or updates an encrypted token.
 * Ensures an 'id' is present for the keyPath, and optionally assigns a new UUID if missing.
 *
 * @param data The EncryptedData object to save.
 * @returns A Promise that resolves when the token is saved.
 */
export const saveEncryptedToken = async (data: EncryptedData): Promise<void> => {
  const db = await dbPromise;
  // Ensure 'id' exists for keyPath and 'userId', 'expiresAt' for indexes.
  await db.put(ENCRYPTED_TOKENS_STORE_NAME, { ...data, id: data.id || crypto.randomUUID() });
  console.log(`Jester safeguards: Encrypted token '${data.id || 'new'}' locked away.`);
};

/**
 * Retrieves an encrypted token by its unique ID.
 *
 * @param id The unique ID of the encrypted token to retrieve.
 * @returns A Promise that resolves with the EncryptedData object, or `undefined` if not found.
 */
export const getEncryptedToken = async (id: string): Promise<EncryptedData | undefined> => {
  const db = await dbPromise;
  console.log(`Jester retrieves: Seeking encrypted token with ID '${id}'.`);
  return db.get(ENCRYPTED_TOKENS_STORE_NAME, id);
};

/**
 * Retrieves all unique IDs of encrypted tokens stored.
 *
 * @returns A Promise that resolves with an array of all encrypted token IDs.
 */
export const getAllEncryptedTokenIds = async (): Promise<string[]> => {
    const db = await dbPromise;
    console.log('Jester inventories: Listing all encrypted token IDs.');
    return db.getAllKeys(ENCRYPTED_TOKENS_STORE_NAME);
};

/**
 * Retrieves all encrypted tokens associated with a specific user ID.
 * Ideal for managing user-specific sessions or credentials.
 *
 * @param userId The ID of the user whose tokens are to be retrieved.
 * @returns A Promise that resolves with an array of EncryptedData objects.
 */
export const getTokensByUserId = async (userId: string): Promise<EncryptedData[]> => {
    const db = await dbPromise;
    console.log(`Jester's loyal service: Fetching all tokens for user '${userId}'.`);
    return db.getAllFromIndex(ENCRYPTED_TOKENS_STORE_NAME, 'by-userId', userId);
};

/**
 * Retrieves all encrypted tokens that have expired (their `expiresAt` is in the past).
 * Essential for regular cleanup and security best practices.
 *
 * @returns A Promise that resolves with an array of expired EncryptedData objects.
 */
export const const getExpiredTokens = async (): Promise<EncryptedData[]> => {
    const db = await dbPromise;
    const now = new Date();
    // Use an upper bound IDBKeyRange to get all tokens whose expiry date is less than or equal to the current time.
    console.log('Jester purges: Gathering tokens whose magic has faded (expired).');
    return db.getAllFromIndex(ENCRYPTED_TOKENS_STORE_NAME, 'by-expiresAt', IDBKeyRange.upperBound(now));
};

/**
 * Deletes a specific encrypted token by its unique ID.
 * A necessary action for revoking access or cleaning up.
 *
 * @param id The unique ID of the encrypted token to delete.
 * @returns A Promise that resolves when the token is deleted.
 */
export const deleteEncryptedToken = async (id: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(ENCRYPTED_TOKENS_STORE_NAME, id);
    console.log(`Jester's broom: Encrypted token '${id}' swept into oblivion.`);
};

// --- Custom Features Store (Expanded with Status and Priority Management) ---

/**
 * Saves or updates a custom feature.
 * Ensures an 'id' is present for the keyPath, and assigns a new UUID if missing.
 *
 * @param feature The CustomFeature object to save.
 * @returns A Promise that resolves when the feature is saved.
 */
export const saveCustomFeature = async (feature: CustomFeature): Promise<void> => {
    const db = await dbPromise;
    await db.put(CUSTOM_FEATURES_STORE_NAME, { ...feature, id: feature.id || crypto.randomUUID() });
    console.log(`Jester crafts: Custom feature '${feature.name || 'new'}' meticulously added.`);
};

/**
 * Retrieves a specific custom feature by its unique ID.
 *
 * @param id The unique ID of the custom feature to retrieve.
 * @returns A Promise that resolves with the CustomFeature object, or `undefined` if not found.
 */
export const getCustomFeature = async (id: string): Promise<CustomFeature | undefined> => {
    const db = await dbPromise;
    console.log(`Jester ponders: Fetching custom feature with ID '${id}'.`);
    return db.get(CUSTOM_FEATURES_STORE_NAME, id);
};

/**
 * Retrieves all custom features from the `custom-features` store.
 *
 * @returns A Promise that resolves with an array of all CustomFeature objects.
 */
export const getAllCustomFeatures = async (): Promise<CustomFeature[]> => {
    const db = await dbPromise;
    console.log('Jester showcases: Presenting all custom features!');
    return db.getAll(CUSTOM_FEATURES_STORE_NAME);
};

/**
 * Retrieves custom features filtered by their development or deployment status.
 *
 * @param status The status to filter by (e.g., 'active', 'beta', 'deprecated').
 * @returns A Promise that resolves with an array of CustomFeature objects matching the status.
 */
export const getFeaturesByStatus = async (status: string): Promise<CustomFeature[]> => {
    const db = await dbPromise;
    console.log(`Jester organizes: Gathering features with status '${status}'.`);
    return db.getAllFromIndex(CUSTOM_FEATURES_STORE_NAME, 'by-status', status);
};

/**
 * Retrieves custom features deemed "high priority" based on a numerical threshold.
 * Lower numbers typically indicate higher priority.
 *
 * @param threshold The maximum priority number to consider as 'high priority' (default: 3).
 * @returns A Promise that resolves with an array of high-priority CustomFeature objects.
 */
export const getHighPriorityFeatures = async (threshold: number = 3): Promise<CustomFeature[]> => {
    const db = await dbPromise;
    // Retrieve features where priority is less than or equal to the threshold.
    console.log(`Jester prioritizes: Unearthing features with priority <= ${threshold}.`);
    return db.getAllFromIndex(CUSTOM_FEATURES_STORE_NAME, 'by-priority', IDBKeyRange.upperBound(threshold));
};

/**
 * Deletes a specific custom feature by its unique ID.
 * Sometimes, even the most ingenious features must be retired.
 *
 * @param id The unique ID of the custom feature to delete.
 * @returns A Promise that resolves when the feature is deleted.
 */
export const deleteCustomFeature = async (id: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(CUSTOM_FEATURES_STORE_NAME, id);
    console.log(`Jester retires: Custom feature with ID '${id}' bids adieu.`);
};

// --- User Settings Store (Personalization at Your Fingertips) ---

/**
 * Saves or updates a user-specific setting.
 * Ensures an 'id' for the keyPath.
 *
 * @param setting The UserSetting object to save.
 * @returns A Promise that resolves when the setting is saved.
 */
export const saveUserSetting = async (setting: UserSetting): Promise<void> => {
    const db = await dbPromise;
    await db.put(USER_SETTINGS_STORE_NAME, { ...setting, id: setting.id || crypto.randomUUID() });
    console.log(`Jester personalizes: User setting '${setting.id || 'new'}' tailored for a noble user.`);
};

/**
 * Retrieves a specific user setting by its unique ID.
 *
 * @param id The unique ID of the user setting to retrieve.
 * @returns A Promise that resolves with the UserSetting object, or `undefined` if not found.
 */
export const getUserSetting = async (id: string): Promise<UserSetting | undefined> => {
    const db = await dbPromise;
    console.log(`Jester inquires: Fetching user setting with ID '${id}'.`);
    return db.get(USER_SETTINGS_STORE_NAME, id);
};

/**
 * Retrieves all user settings for a given user ID.
 *
 * @param userId The ID of the user whose settings are to be retrieved.
 * @returns A Promise that resolves with an array of UserSetting objects.
 */
export const getSettingsByUserId = async (userId: string): Promise<UserSetting[]> => {
    const db = await dbPromise;
    console.log(`Jester serves: All settings for user '${userId}' retrieved.`);
    return db.getAllFromIndex(USER_SETTINGS_STORE_NAME, 'by-userId', userId);
};

/**
 * Retrieves all user settings belonging to a specific category (e.g., 'theme', 'notifications').
 *
 * @param category The category name to filter settings by.
 * @returns A Promise that resolves with an array of UserSetting objects.
 */
export const getSettingsByCategory = async (category: string): Promise<UserSetting[]> => {
    const db = await dbPromise;
    console.log(`Jester classifies: Settings in category '${category}' gathered.`);
    return db.getAllFromIndex(USER_SETTINGS_STORE_NAME, 'by-category', category);
};

/**
 * Deletes a specific user setting by its unique ID.
 *
 * @param id The unique ID of the user setting to delete.
 * @returns A Promise that resolves when the setting is deleted.
 */
export const deleteUserSetting = async (id: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(USER_SETTINGS_STORE_NAME, id);
    console.log(`Jester cleans: User setting '${id}' removed.`);
};

// --- Activity Log Store (The Royal Chronicle of Deeds) ---

/**
 * Logs a new activity entry into the `activity-log` store.
 * Automatically assigns a unique ID and timestamp if not provided.
 *
 * @param entry The ActivityLogEntry object to log.
 * @returns A Promise that resolves when the entry is added.
 */
export const logActivity = async (entry: ActivityLogEntry): Promise<void> => {
    const db = await dbPromise;
    await db.add(ACTIVITY_LOG_STORE_NAME, { ...entry, id: entry.id || crypto.randomUUID(), timestamp: entry.timestamp || new Date() });
    console.log(`Jester scribes: Activity '${entry.actionType}' recorded for user '${entry.userId || 'system'}'.`);
};

/**
 * Retrieves all activity log entries.
 *
 * @returns A Promise that resolves with an array of all ActivityLogEntry objects.
 */
export const getAllActivityLogs = async (): Promise<ActivityLogEntry[]> => {
    const db = await dbPromise;
    console.log('Jester reviews: All activity logs unveiled.');
    return db.getAll(ACTIVITY_LOG_STORE_NAME);
};

/**
 * Retrieves all activity log entries for a specific user ID.
 *
 * @param userId The ID of the user whose activities are to be retrieved.
 * @returns A Promise that resolves with an array of ActivityLogEntry objects.
 */
export const getActivityLogsByUserId = async (userId: string): Promise<ActivityLogEntry[]> => {
    const db = await dbPromise;
    console.log(`Jester chronicles: Activities of user '${userId}' revealed.`);
    return db.getAllFromIndex(ACTIVITY_LOG_STORE_NAME, 'by-userId', userId);
};

/**
 * Retrieves all activity log entries of a specific action type.
 *
 * @param actionType The type of action to filter by (e.g., 'FILE_SAVE', 'LOGIN').
 * @returns A Promise that resolves with an array of ActivityLogEntry objects.
 */
export const getActivityLogsByActionType = async (actionType: string): Promise<ActivityLogEntry[]> => {
    const db = await dbPromise;
    console.log(`Jester categorizes: Logs for action type '${actionType}' presented.`);
    return db.getAllFromIndex(ACTIVITY_LOG_STORE_NAME, 'by-actionType', actionType);
};

/**
 * Retrieves a limited number of the most recent activity log entries.
 *
 * @param limit The maximum number of recent logs to retrieve (default: 20).
 * @returns A Promise that resolves with an array of recent ActivityLogEntry objects.
 */
export const getRecentActivityLogs = async (limit: number = 20): Promise<ActivityLogEntry[]> => {
    const db = await dbPromise;
    const tx = db.transaction(ACTIVITY_LOG_STORE_NAME, 'readonly');
    const store = tx.objectStore(ACTIVITY_LOG_STORE_NAME);
    const index = store.index('by-timestamp');
    const logs: ActivityLogEntry[] = [];
    let count = 0;
    let cursor = await index.openCursor(null, 'prev'); // 'prev' for descending order (most recent first)
    while (cursor && count < limit) {
        logs.push(cursor.value);
        cursor = await cursor.continue();
        count++;
    }
    await tx.done;
    console.log(`Jester reviews: The ${count} most recent activities unfolded.`);
    return logs;
};

/**
 * Clears activity log entries older than a specified date.
 * Essential for maintaining log hygiene and managing storage.
 *
 * @param date Entries with a timestamp before this date will be deleted.
 * @returns A Promise that resolves when old entries are cleared.
 */
export const clearActivityLogsOlderThan = async (date: Date): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(ACTIVITY_LOG_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ACTIVITY_LOG_STORE_NAME);
    const index = store.index('by-timestamp');
    // Open a cursor on entries older than the specified date.
    let cursor = await index.openCursor(IDBKeyRange.upperBound(date));
    while (cursor) {
        await cursor.delete(); // Delete the current entry.
        cursor = await cursor.continue(); // Move to the next old entry.
    }
    await tx.done;
    console.log(`Jester sweeps: Activity logs older than ${date.toISOString()} purged.`);
};

// --- Background Tasks Store (The Silent Scribes of Progress) ---

/**
 * Schedules a new background task.
 * Automatically assigns a unique ID and `scheduledFor` timestamp if not provided.
 *
 * @param task The BackgroundTask object to schedule.
 * @returns A Promise that resolves when the task is added.
 */
export const scheduleTask = async (task: BackgroundTask): Promise<void> => {
    const db = await dbPromise;
    await db.add(BACKGROUND_TASKS_STORE_NAME, { ...task, id: task.id || crypto.randomUUID(), scheduledFor: task.scheduledFor || new Date() });
    console.log(`Jester orchestrates: Background task '${task.id || 'new'}' scheduled for action.`);
};

/**
 * Retrieves a specific background task by its unique ID.
 *
 * @param taskId The unique ID of the task to retrieve.
 * @returns A Promise that resolves with the BackgroundTask object, or `undefined` if not found.
 */
export const getTask = async (taskId: string): Promise<BackgroundTask | undefined> => {
    const db = await dbPromise;
    console.log(`Jester checks: Status of task '${taskId}'.`);
    return db.get(BACKGROUND_TASKS_STORE_NAME, taskId);
};

/**
 * Retrieves all background tasks filtered by their current status.
 *
 * @param status The status to filter by (e.g., 'pending', 'running', 'completed', 'failed').
 * @returns A Promise that resolves with an array of BackgroundTask objects.
 */
export const getTasksByStatus = async (status: string): Promise<BackgroundTask[]> => {
    const db = await dbPromise;
    console.log(`Jester organizes: Fetching tasks with status '${status}'.`);
    return db.getAllFromIndex(BACKGROUND_TASKS_STORE_NAME, 'by-status', status);
};

/**
 * Retrieves pending tasks that are scheduled for the current time or earlier.
 * Note: A more sophisticated worker would continuously poll or use web workers for execution.
 *
 * @returns A Promise that resolves with an array of BackgroundTask objects ready for execution.
 */
export const getPendingTasks = async (): Promise<BackgroundTask[]> => {
    const db = await dbPromise;
    const now = new Date();
    // This fetches all tasks scheduled up to 'now'. Additional filtering by 'status' would be needed in application logic.
    console.log('Jester prods: Finding tasks awaiting their moment of glory.');
    return db.getAllFromIndex(BACKGROUND_TASKS_STORE_NAME, 'by-scheduledFor', IDBKeyRange.upperBound(now));
};

/**
 * Updates the status of a specific background task and optionally records a result.
 *
 * @param taskId The unique ID of the task to update.
 * @param status The new status of the task.
 * @param result Optional result data of the task's execution.
 * @returns A Promise that resolves when the task's status is updated.
 */
export const updateTaskStatus = async (taskId: string, status: string, result?: any): Promise<void> => {
    const db = await dbPromise;
    const task = await db.get(BACKGROUND_TASKS_STORE_NAME, taskId);
    if (task) {
        await db.put(BACKGROUND_TASKS_STORE_NAME, { ...task, status, result, completedAt: new Date() });
        console.log(`Jester updates: Task '${taskId}' status changed to '${status}'.`);
    } else {
        console.warn(`Jester's dismay: Task '${taskId}' not found for status update.`);
    }
};

/**
 * Deletes a specific background task by its unique ID.
 *
 * @param taskId The unique ID of the task to delete.
 * @returns A Promise that resolves when the task is deleted.
 */
export const deleteTask = async (taskId: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(BACKGROUND_TASKS_STORE_NAME, taskId);
    console.log(`Jester clears: Task '${taskId}' banished.`);
};

// --- Notifications Store (The Royal Messengers) ---

/**
 * Adds a new notification to a user's inbox.
 * Automatically assigns a unique ID, `createdAt` timestamp, and sets `readStatus` to false.
 *
 * @param notification The Notification object to add.
 * @returns A Promise that resolves when the notification is added.
 */
export const addNotification = async (notification: Notification): Promise<void> => {
    const db = await dbPromise;
    await db.add(NOTIFICATIONS_STORE_NAME, { ...notification, id: notification.id || crypto.randomUUID(), createdAt: notification.createdAt || new Date(), readStatus: false });
    console.log(`Jester whispers: New notification for user '${notification.userId}'.`);
};

/**
 * Retrieves a specific notification by its unique ID.
 *
 * @param notificationId The unique ID of the notification to retrieve.
 * @returns A Promise that resolves with the Notification object, or `undefined` if not found.
 */
export const getNotification = async (notificationId: string): Promise<Notification | undefined> => {
    const db = await dbPromise;
    console.log(`Jester delivers: Fetching notification '${notificationId}'.`);
    return db.get(NOTIFICATIONS_STORE_NAME, notificationId);
};

/**
 * Retrieves all notifications for a specific user ID.
 *
 * @param userId The ID of the user whose notifications are to be retrieved.
 * @returns A Promise that resolves with an array of Notification objects.
 */
export const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
    const db = await dbPromise;
    console.log(`Jester reads: All messages for user '${userId}'.`);
    return db.getAllFromIndex(NOTIFICATIONS_STORE_NAME, 'by-userId', userId);
};

/**
 * Retrieves all unread notifications for a specific user ID.
 * This demonstrates a pattern of using an index and then filtering, or leveraging compound indexes if available.
 *
 * @param userId The ID of the user whose unread notifications are to be retrieved.
 * @returns A Promise that resolves with an array of unread Notification objects.
 */
export const getUnreadNotificationsForUser = async (userId: string): Promise<Notification[]> => {
    const db = await dbPromise;
    const tx = db.transaction(NOTIFICATIONS_STORE_NAME, 'readonly');
    const store = tx.objectStore(NOTIFICATIONS_STORE_NAME);
    const userIdIndex = store.index('by-userId');

    const unreadNotifications: Notification[] = [];
    let cursor = await userIdIndex.openCursor(userId); // Cursor over user's notifications
    while (cursor) {
        if (!cursor.value.readStatus) { // Filter for unread ones
            unreadNotifications.push(cursor.value);
        }
        cursor = await cursor.continue();
    }
    await tx.done;
    console.log(`Jester counts: Unread scrolls for user '${userId}'.`);
    return unreadNotifications;
};

/**
 * Marks a specific notification as read.
 * Updates its `readStatus` and `readAt` timestamp.
 *
 * @param notificationId The unique ID of the notification to mark as read.
 * @returns A Promise that resolves when the notification is updated.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    const db = await dbPromise;
    const notification = await db.get(NOTIFICATIONS_STORE_NAME, notificationId);
    if (notification) {
        await db.put(NOTIFICATIONS_STORE_NAME, { ...notification, readStatus: true, readAt: new Date() });
        console.log(`Jester acknowledges: Notification '${notificationId}' has been read.`);
    } else {
        console.warn(`Jester's lament: Notification '${notificationId}' not found to mark as read.`);
    }
};

/**
 * Deletes a specific notification by its unique ID.
 *
 * @param notificationId The unique ID of the notification to delete.
 * @returns A Promise that resolves when the notification is deleted.
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(NOTIFICATIONS_STORE_NAME, notificationId);
    console.log(`Jester shreds: Notification '${notificationId}' discarded.`);
};

// --- App Cache Store (The Speedy Pantry) ---

/**
 * Sets a cache item with a specified key, value, time-to-live (TTL), and optional tag.
 * Automatically calculates `expiresAt` based on TTL.
 *
 * @param key The unique key for the cache item.
 * @param value The data to cache.
 * @param ttlSeconds The time-to-live for the cache item in seconds (default: 3600 seconds = 1 hour).
 * @param tag An optional tag to group related cache items.
 * @returns A Promise that resolves when the cache item is set.
 */
export const setCacheItem = async (key: string, value: any, ttlSeconds: number = 3600, tag?: string): Promise<void> => {
    const db = await dbPromise;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000); // Calculate expiration date.
    await db.put(CACHE_STORE_NAME, { key, value, expiresAt, tag, createdAt: new Date() });
    console.log(`Jester provisions: Cache item '${key}' stored, expiring at ${expiresAt.toISOString()}.`);
};

/**
 * Retrieves a cache item by its key. If the item is found but has expired, it is deleted and `undefined` is returned.
 *
 * @param key The unique key of the cache item to retrieve.
 * @returns A Promise that resolves with the cached value, or `undefined` if not found or expired.
 */
export const getCacheItem = async (key: string): Promise<any | undefined> => {
    const db = await dbPromise;
    const item = await db.get(CACHE_STORE_NAME, key);
    if (item) {
        if (item.expiresAt > new Date()) { // Check if the item is still fresh.
            console.log(`Jester fetches: Cache item '${key}' found and fresh.`);
            return item.value;
        } else {
            // Item expired, gracefully remove it.
            await db.delete(CACHE_STORE_NAME, key);
            console.log(`Jester discards: Expired cache item '${key}' removed.`);
        }
    }
    console.log(`Jester hungers: Cache item '${key}' not found or expired.`);
    return undefined;
};

/**
 * Retrieves all valid (non-expired) cache items associated with a specific tag.
 *
 * @param tag The tag to filter cache items by.
 * @returns A Promise that resolves with an array of valid CachedItem objects.
 */
export const getCacheItemsByTag = async (tag: string): Promise<CachedItem[]> => {
    const db = await dbPromise;
    const items = await db.getAllFromIndex(CACHE_STORE_NAME, 'by-tag', tag);
    const now = new Date();
    // Filter out any items that might have expired since they were last indexed.
    console.log(`Jester categorizes: Valid cache items with tag '${tag}' retrieved.`);
    return items.filter(item => item.expiresAt > now);
};

/**
 * Clears all expired cache items from the `app-cache` store.
 * An essential maintenance routine to keep the pantry tidy!
 *
 * @returns A Promise that resolves when all expired items are cleared.
 */
export const clearExpiredCacheItems = async (): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CACHE_STORE_NAME);
    const index = store.index('by-expiresAt');
    // Open a cursor on items whose expiry date is in the past.
    let cursor = await index.openCursor(IDBKeyRange.upperBound(new Date()));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
    console.log('Jester sweeps: All expired cache items banished from the pantry!');
};

/**
 * Deletes a specific cache item by its key, regardless of its expiry status.
 *
 * @param key The unique key of the cache item to delete.
 * @returns A Promise that resolves when the cache item is deleted.
 */
export const deleteCacheItem = async (key: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(CACHE_STORE_NAME, key);
    console.log(`Jester vanishes: Cache item '${key}' instantly removed.`);
};

// --- Audit Trail Store (The Unblinking Eye of Record) ---

/**
 * Logs a new audit entry into the `audit-trail` store.
 * Automatically assigns a unique ID and `timestamp` if not provided.
 *
 * @param entry The AuditEntry object to log.
 * @returns A Promise that resolves when the entry is added.
 */
export const logAuditEntry = async (entry: AuditEntry): Promise<void> => {
    const db = await dbPromise;
    await db.add(AUDIT_TRAIL_STORE_NAME, { ...entry, id: entry.id || crypto.randomUUID(), timestamp: entry.timestamp || new Date() });
    console.log(`Jester records: Audit entry for '${entry.entityType}' (ID: '${entry.entityId || 'N/A'}') logged.`);
};

/**
 * Retrieves audit entries for a specific entity type and ID.
 * Since a compound index isn't used here, we filter results after fetching by one index.
 * For high-volume audit logs, consider a compound index `['entityType', 'entityId']`.
 *
 * @param entityType The type of entity (e.g., 'GeneratedFile', 'UserSetting').
 * @param entityId The ID of the specific entity.
 * @returns A Promise that resolves with an array of AuditEntry objects.
 */
export const getAuditEntriesForEntity = async (entityType: string, entityId: string): Promise<AuditEntry[]> => {
    const db = await dbPromise;
    // Fetch by entityType, then filter by entityId.
    const entries = await db.getAllFromIndex(AUDIT_TRAIL_STORE_NAME, 'by-entityType', entityType);
    console.log(`Jester investigates: Audit entries for ${entityType} ID '${entityId}'.`);
    return entries.filter(entry => entry.entityId === entityId).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

/**
 * Retrieves a limited number of the most recent audit entries.
 *
 * @param limit The maximum number of recent entries to retrieve (default: 50).
 * @returns A Promise that resolves with an array of recent AuditEntry objects.
 */
export const getRecentAuditEntries = async (limit: number = 50): Promise<AuditEntry[]> => {
    const db = await dbPromise;
    const tx = db.transaction(AUDIT_TRAIL_STORE_NAME, 'readonly');
    const store = tx.objectStore(AUDIT_TRAIL_STORE_NAME);
    const index = store.index('by-timestamp');
    const entries: AuditEntry[] = [];
    let count = 0;
    let cursor = await index.openCursor(null, 'prev'); // Most recent first.
    while (cursor && count < limit) {
        entries.push(cursor.value);
        cursor = await cursor.continue();
        count++;
    }
    await tx.done;
    console.log(`Jester recounts: The ${count} most recent audit events.`);
    return entries;
};

/**
 * Deletes audit entries older than a specified date.
 * Essential for managing the size of the audit trail over time.
 *
 * @param date Entries with a timestamp before this date will be deleted.
 * @returns A Promise that resolves when old entries are cleared.
 */
export const deleteOldAuditEntries = async (date: Date): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(AUDIT_TRAIL_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AUDIT_TRAIL_STORE_NAME);
    const index = store.index('by-timestamp');
    let cursor = await index.openCursor(IDBKeyRange.upperBound(date));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
    console.log(`Jester archives: Audit entries older than ${date.toISOString()} incinerated.`);
};

// --- Version Control Store (The Time-Traveling Scribe) ---

/**
 * Saves a new version of a file or document.
 * Automatically assigns a unique ID and `timestamp` if not provided.
 *
 * @param version The VersionedFile object to save.
 * @returns A Promise that resolves when the version is saved.
 */
export const saveFileVersion = async (version: VersionedFile): Promise<void> => {
    const db = await dbPromise;
    await db.add(VERSION_CONTROL_STORE_NAME, { ...version, id: version.id || crypto.randomUUID(), timestamp: version.timestamp || new Date() });
    console.log(`Jester preserves: Version ${version.versionNumber} for file '${version.fileId}' recorded.`);
};

/**
 * Retrieves all versions for a specific file ID.
 *
 * @param fileId The ID of the file whose versions are to be retrieved.
 * @returns A Promise that resolves with an array of VersionedFile objects, ordered chronologically.
 */
export const getFileVersions = async (fileId: string): Promise<VersionedFile[]> => {
    const db = await dbPromise;
    console.log(`Jester unwinds: Fetching all versions for file '${fileId}'.`);
    return db.getAllFromIndex(VERSION_CONTROL_STORE_NAME, 'by-fileId', fileId);
};

/**
 * Retrieves a specific version of a file by its file ID and version number.
 *
 * @param fileId The ID of the file.
 * @param versionNumber The specific version number to retrieve.
 * @returns A Promise that resolves with the VersionedFile object, or `undefined` if not found.
 */
export const getSpecificFileVersion = async (fileId: string, versionNumber: number): Promise<VersionedFile | undefined> => {
    const db = await dbPromise;
    const versions = await db.getAllFromIndex(VERSION_CONTROL_STORE_NAME, 'by-fileId', fileId);
    console.log(`Jester pinpoints: Retrieving version ${versionNumber} for file '${fileId}'.`);
    return versions.find(v => v.versionNumber === versionNumber);
};

/**
 * Deletes a specific file version by its unique ID.
 *
 * @param versionId The unique ID of the version to delete.
 * @returns A Promise that resolves when the version is deleted.
 */
export const deleteFileVersion = async (versionId: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(VERSION_CONTROL_STORE_NAME, versionId);
    console.log(`Jester rewrites: Version '${versionId}' removed from history.`);
};

/**
 * Deletes all versions associated with a specific file ID.
 * A complete historical erasure for a given file.
 *
 * @param fileId The ID of the file whose versions are to be deleted.
 * @returns A Promise that resolves when all versions are deleted.
 */
export const deleteAllFileVersions = async (fileId: string): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(VERSION_CONTROL_STORE_NAME, 'readwrite');
    const store = tx.objectStore(VERSION_CONTROL_STORE_NAME);
    const index = store.index('by-fileId');
    let cursor = await index.openCursor(fileId);
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
    console.log(`Jester cleans: All versions for file '${fileId}' expunged.`);
};

// --- Collaboration Data Store (The Conclave of Shared Genius) ---

/**
 * Updates a collaborator's presence information.
 * Automatically assigns a unique ID and `lastSeen` timestamp if not provided.
 *
 * @param presence The CollaboratorPresence object to update.
 * @returns A Promise that resolves when the presence is updated.
 */
export const updateCollaboratorPresence = async (presence: CollaboratorPresence): Promise<void> => {
    const db = await dbPromise;
    await db.put(COLLABORATION_STORE_NAME, { ...presence, id: presence.id || crypto.randomUUID(), lastSeen: new Date() });
    console.log(`Jester notes: Collaborator '${presence.userId}' presence updated.`);
};

/**
 * Retrieves all collaborators currently active within a specific session.
 *
 * @param sessionId The ID of the collaboration session.
 * @returns A Promise that resolves with an array of CollaboratorPresence objects.
 */
export const getCollaboratorsInSession = async (sessionId: string): Promise<CollaboratorPresence[]> => {
    const db = await dbPromise;
    console.log(`Jester gathers: Collaborators in session '${sessionId}' are accounted for.`);
    return db.getAllFromIndex(COLLABORATION_STORE_NAME, 'by-sessionId', sessionId);
};

/**
 * Retrieves all currently active collaborators working on a specific entity (e.g., a document).
 * Filters out inactive presences based on a recent `lastSeen` timestamp.
 *
 * @param entityId The ID of the entity being collaborated on.
 * @returns A Promise that resolves with an array of active CollaboratorPresence objects.
 */
export const getCollaboratorsOnEntity = async (entityId: string): Promise<CollaboratorPresence[]> => {
    const db = await dbPromise;
    const entries = await db.getAllFromIndex(COLLABORATION_STORE_NAME, 'by-entityId', entityId);
    // Define what constitutes "active" (e.g., seen in the last 5 minutes).
    const activeThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago.
    console.log(`Jester observes: Active collaborators on entity '${entityId}' detected.`);
    return entries.filter(p => p.lastSeen > activeThreshold);
};

/**
 * Removes a specific collaborator's presence entry by its unique ID.
 *
 * @param id The unique ID of the presence entry to remove.
 * @returns A Promise that resolves when the presence is removed.
 */
export const removeCollaboratorPresence = async (id: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(COLLABORATION_STORE_NAME, id);
    console.log(`Jester dismisses: Collaborator presence '${id}' dissolved.`);
};

/**
 * Cleans up old collaborator presence entries that haven't been seen since a specified threshold.
 * This keeps the collaboration data fresh and relevant.
 *
 * @param threshold Entries with a `lastSeen` timestamp before this date will be deleted.
 * @returns A Promise that resolves when old presences are cleared.
 */
export const cleanUpOldCollaboratorPresences = async (threshold: Date): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(COLLABORATION_STORE_NAME, 'readwrite');
    const store = tx.objectStore(COLLABORATION_STORE_NAME);
    const index = store.index('by-lastSeen');
    let cursor = await index.openCursor(IDBKeyRange.upperBound(threshold));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
    console.log(`Jester tidies: Inactive collaborator presences older than ${threshold.toISOString()} removed.`);
};

// --- Analytics Events Store (The Oracle of Usage) ---

/**
 * Records a new analytics event.
 * Automatically assigns a unique ID and `timestamp` if not provided.
 *
 * @param event The AnalyticsEvent object to record.
 * @returns A Promise that resolves when the event is added.
 */
export const recordAnalyticsEvent = async (event: AnalyticsEvent): Promise<void> => {
    const db = await dbPromise;
    await db.add(ANALYTICS_STORE_NAME, { ...event, id: event.id || crypto.randomUUID(), timestamp: event.timestamp || new Date() });
    console.log(`Jester charts: Analytics event '${event.eventType}' recorded for user '${event.userId || 'anonymous'}'.`);
};

/**
 * Retrieves all analytics events of a specific type.
 *
 * @param eventType The type of event to filter by (e.g., 'page_view', 'button_click').
 * @returns A Promise that resolves with an array of AnalyticsEvent objects.
 */
export const getAnalyticsEventsByType = async (eventType: string): Promise<AnalyticsEvent[]> => {
    const db = await dbPromise;
    console.log(`Jester analyses: Events of type '${eventType}' are under scrutiny.`);
    return db.getAllFromIndex(ANALYTICS_STORE_NAME, 'by-eventType', eventType);
};

/**
 * Retrieves all analytics events generated by a specific user.
 *
 * @param userId The ID of the user whose events are to be retrieved.
 * @returns A Promise that resolves with an array of AnalyticsEvent objects.
 */
export const getAnalyticsEventsForUser = async (userId: string): Promise<AnalyticsEvent[]> => {
    const db = await dbPromise;
    console.log(`Jester follows: User '${userId}'s digital footprint.`);
    return db.getAllFromIndex(ANALYTICS_STORE_NAME, 'by-userId', userId);
};

/**
 * Retrieves analytics events that occurred within a specified date range.
 *
 * @param startDate The start date of the range (inclusive).
 * @param endDate The end date of the range (inclusive).
 * @returns A Promise that resolves with an array of AnalyticsEvent objects within the range.
 */
export const getAnalyticsEventsInDateRange = async (startDate: Date, endDate: Date): Promise<AnalyticsEvent[]> => {
    const db = await dbPromise;
    console.log(`Jester forecasts: Events between ${startDate.toISOString()} and ${endDate.toISOString()} revealed.`);
    return db.getAllFromIndex(ANALYTICS_STORE_NAME, 'by-timestamp', IDBKeyRange.bound(startDate, endDate));
};

/**
 * Deletes analytics events older than a specified date.
 * Important for data retention policies and managing database size.
 *
 * @param date Events with a timestamp before this date will be deleted.
 * @returns A Promise that resolves when old events are cleared.
 */
export const deleteAnalyticsEventsOlderThan = async (date: Date): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(ANALYTICS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ANALYTICS_STORE_NAME);
    const index = store.index('by-timestamp');
    let cursor = await index.openCursor(IDBKeyRange.upperBound(date));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
    console.log(`Jester prunes: Analytics events older than ${date.toISOString()} forgotten.`);
};

// --- Plugin Configurations Store (The Tome of Enchantments) ---

/**
 * Saves or updates a plugin's configuration.
 * Automatically assigns a unique ID if not provided.
 *
 * @param config The PluginConfig object to save.
 * @returns A Promise that resolves when the configuration is saved.
 */
export const savePluginConfig = async (config: PluginConfig): Promise<void> => {
    const db = await dbPromise;
    await db.put(PLUGIN_CONFIGS_STORE_NAME, { ...config, id: config.id || crypto.randomUUID() });
    console.log(`Jester calibrates: Plugin config for '${config.name || 'new'}' meticulously set.`);
};

/**
 * Retrieves a specific plugin's configuration by its unique ID.
 *
 * @param pluginId The unique ID of the plugin configuration to retrieve.
 * @returns A Promise that resolves with the PluginConfig object, or `undefined` if not found.
 */
export const getPluginConfig = async (pluginId: string): Promise<PluginConfig | undefined> => {
    const db = await dbPromise;
    console.log(`Jester tunes: Retrieving config for plugin '${pluginId}'.`);
    return db.get(PLUGIN_CONFIGS_STORE_NAME, pluginId);
};

/**
 * Retrieves all plugin configurations that are currently enabled.
 *
 * @returns A Promise that resolves with an array of enabled PluginConfig objects.
 */
export const getEnabledPluginConfigs = async (): Promise<PluginConfig[]> => {
    const db = await dbPromise;
    console.log('Jester activates: Listing all enabled plugin enchantments.');
    return db.getAllFromIndex(PLUGIN_CONFIGS_STORE_NAME, 'by-enabled', true);
};

/**
 * Retrieves all plugin configurations matching a specific plugin name.
 *
 * @param pluginName The name of the plugin to filter configurations by.
 * @returns A Promise that resolves with an array of PluginConfig objects.
 */
export const getPluginConfigsByName = async (pluginName: string): Promise<PluginConfig[]> => {
    const db = await dbPromise;
    console.log(`Jester seeks: Configurations for plugin '${pluginName}'.`);
    return db.getAllFromIndex(PLUGIN_CONFIGS_STORE_NAME, 'by-pluginName', pluginName);
};

/**
 * Deletes a specific plugin's configuration by its unique ID.
 *
 * @param pluginId The unique ID of the plugin configuration to delete.
 * @returns A Promise that resolves when the configuration is deleted.
 */
export const deletePluginConfig = async (pluginId: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(PLUGIN_CONFIGS_STORE_NAME, pluginId);
    console.log(`Jester disarms: Plugin config '${pluginId}' vanquished.`);
};

// --- Transaction Log Store (The Grand Ledger of Operations) ---

/**
 * Logs a complex transaction or multi-step operation.
 * Automatically assigns a unique ID and `timestamp` if not provided.
 * This store is ideal for auditing complex workflows or for implementing
 * more advanced recovery mechanisms.
 *
 * @param transactionRecord The object containing details about the transaction.
 * @returns A Promise that resolves when the transaction record is added.
 */
export const logTransaction = async (transactionRecord: any): Promise<void> => {
    const db = await dbPromise;
    await db.add(TRANSACTION_LOG_STORE_NAME, { ...transactionRecord, id: transactionRecord.id || crypto.randomUUID(), timestamp: transactionRecord.timestamp || new Date() });
    console.log(`Jester inscribes: Complex transaction '${transactionRecord.id || 'new'}' logged with status '${transactionRecord.status || 'unknown'}'.`);
};

/**
 * Retrieves transaction log entries filtered by their status.
 *
 * @param status The status to filter by (e.g., 'pending', 'committed', 'failed', 'rolledback').
 * @returns A Promise that resolves with an array of transaction log objects.
 */
export const getTransactionsByStatus = async (status: string): Promise<any[]> => {
    const db = await dbPromise;
    console.log(`Jester reviews: Transactions with status '${status}'.`);
    return db.getAllFromIndex(TRANSACTION_LOG_STORE_NAME, 'by-status', status);
};

/**
 * Retrieves transaction log entries that occurred within a specified date range.
 *
 * @param startDate The start date of the range (inclusive).
 * @param endDate The end date of the range (inclusive).
 * @returns A Promise that resolves with an array of transaction log objects within the range.
 */
export const getTransactionsInDateRange = async (startDate: Date, endDate: Date): Promise<any[]> => {
    const db = await dbPromise;
    console.log(`Jester recalls: Transactions between ${startDate.toISOString()} and ${endDate.toISOString()}.`);
    return db.getAllFromIndex(TRANSACTION_LOG_STORE_NAME, 'by-timestamp', IDBKeyRange.bound(startDate, endDate));
};

// --- Composite Operations (Examples of Inter-Store Alchemy using 'withTransaction') ---
// These functions showcase the true power of the DevCore Omni-Vault:
// atomically coordinating operations across multiple specialized stores.

/**
 * Saves a generated file and simultaneously logs this activity for the specified user
 * within a single, atomic transaction. If either operation fails, both are rolled back.
 * A truly seamless record-keeping and storage ritual!
 *
 * @param file The GeneratedFile object to save.
 * @param userId The ID of the user performing the action.
 * @returns A Promise that resolves when both operations are successfully completed.
 */
export const saveFileAndLogActivity = async (file: GeneratedFile, userId: string): Promise<void> => {
    await withTransaction([FILES_STORE_NAME, ACTIVITY_LOG_STORE_NAME], 'readwrite', async (tx) => {
        const filesStore = tx.objectStore(FILES_STORE_NAME);
        const activityStore = tx.objectStore(ACTIVITY_LOG_STORE_NAME);

        // 1. Save the file.
        await filesStore.put(file);

        // 2. Log the activity.
        const activityEntry: ActivityLogEntry = {
            id: crypto.randomUUID(),
            userId,
            actionType: 'FILE_SAVED',
            details: { filePath: file.filePath, fileSize: file.content.length },
            timestamp: new Date(),
        };
        await activityStore.add(activityEntry);

        console.log(`Jester marvels: File '${file.filePath}' saved and activity logged atomically!`);
    });
};

/**
 * Creates a new custom feature and then broadcasts notifications to a list of users,
 * all within an atomic transaction. This ensures consistency between feature creation
 * and its announcement. A truly grand unveiling!
 *
 * @param feature The CustomFeature object to create.
 * @param userIdsToNotify An array of user IDs who should receive a notification.
 * @returns A Promise that resolves when both feature creation and notifications are processed.
 */
export const createFeatureAndNotifyUsers = async (feature: CustomFeature, userIdsToNotify: string[]): Promise<void> => {
    await withTransaction([CUSTOM_FEATURES_STORE_NAME, NOTIFICATIONS_STORE_NAME], 'readwrite', async (tx) => {
        const featuresStore = tx.objectStore(CUSTOM_FEATURES_STORE_NAME);
        const notificationsStore = tx.objectStore(NOTIFICATIONS_STORE_NAME);

        // 1. Add the new custom feature.
        await featuresStore.add(feature);

        // 2. Create and add notifications for each specified user.
        for (const userId of userIdsToNotify) {
            const notification: Notification = {
                id: crypto.randomUUID(),
                userId,
                message: `A new feature, '${feature.name}', has been unveiled! Check out its magic!`,
                link: `/features/${feature.id}`, // A hypothetical link to the new feature.
                createdAt: new Date(),
                readStatus: false,
                type: 'feature_update',
            };
            await notificationsStore.add(notification);
        }
        console.log(`Jester shouts: Feature '${feature.name}' created and ${userIdsToNotify.length} users notified!`);
    });
};

/**
 * Deletes a file, all its associated version history, and logs the action
 * in both the audit trail and activity log, all within a single, unbreakable transaction.
 * This ensures that a file's entire existence, including its echoes in history, is erased consistently.
 * A complete and thorough obliteration!
 *
 * @param filePath The path of the file to delete.
 * @param userId The ID of the user performing the deletion.
 * @returns A Promise that resolves when all related data has been consistently deleted.
 */
export const deleteFileWithHistoryAndAudit = async (filePath: string, userId: string): Promise<void> => {
    await withTransaction([FILES_STORE_NAME, VERSION_CONTROL_STORE_NAME, AUDIT_TRAIL_STORE_NAME, ACTIVITY_LOG_STORE_NAME], 'readwrite', async (tx) => {
        const filesStore = tx.objectStore(FILES_STORE_NAME);
        const versionStore = tx.objectStore(VERSION_CONTROL_STORE_NAME);
        const auditStore = tx.objectStore(AUDIT_TRAIL_STORE_NAME);
        const activityStore = tx.objectStore(ACTIVITY_LOG_STORE_NAME);

        const fileToDelete = await filesStore.get(filePath);
        if (!fileToDelete) {
            console.warn(`Jester's quandary: File to delete not found: ${filePath}. Proceeding with historical cleanup.`);
            // No file to delete, but still ensure historical records are cleaned if they exist.
            // Or, for stricter atomic behavior, throw an error if the primary entity isn't found.
            // For this example, we'll continue with cleanup if the file itself isn't there, as old versions/audits might linger.
        } else {
            // 1. Delete the file itself from the primary store.
            await filesStore.delete(filePath);
            console.log(`Jester's decree: File '${filePath}' deleted.`);
        }


        // 2. Delete all versions associated with this file.
        const versionIndex = versionStore.index('by-fileId');
        let versionCursor = await versionIndex.openCursor(filePath);
        while (versionCursor) {
            await versionCursor.delete();
            versionCursor = await versionCursor.continue();
        }
        console.log(`Jester's memory wipe: All versions for file '${filePath}' deleted.`);

        // 3. Log an audit entry for this comprehensive deletion.
        const auditEntry: AuditEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            userId,
            action: 'COMPREHENSIVE_DELETE',
            entityType: 'GeneratedFile',
            entityId: filePath,
            details: { message: `File and all its versions, audit trails, and activity logs were deleted.` },
        };
        await auditStore.add(auditEntry);
        console.log(`Jester's record: Audit entry for comprehensive deletion of '${filePath}' logged.`);


        // 4. Log the activity for the user.
        const activityEntry: ActivityLogEntry = {
            id: crypto.randomUUID(),
            userId,
            actionType: 'FILE_AND_HISTORY_DELETED',
            details: { filePath, message: 'All versions and related data removed.' },
            timestamp: new Date(),
        };
        await activityStore.add(activityEntry);
        console.log(`Jester's final note: Activity for deletion of '${filePath}' also logged.`);
    });
};

// --- Global Actions (Simplified from old dbService, now using Omni-Vault's clearAll) ---

// The old clearAllData is replaced by the more powerful clearAllOmniVaultData,
// demonstrating a complete overhaul and consolidation of global actions.
// export const clearAllData = async (): Promise<void> => { ... } // This is now deprecated!

// Polyfill for crypto.randomUUID for environments that might not natively support it (e.g., older Node.js, some test runners).
// Ensures consistency and UUID generation across different runtime environments.
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    (globalThis as any).crypto = {
        randomUUID: () => {
            // A simple, non-cryptographically secure UUID-like string generator.
            // For production environments requiring strong UUIDs, ensure native crypto.randomUUID is available.
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    };
    console.warn("Jester's warning: `crypto.randomUUID` not found, using a shim. Ensure native support for production!");
}
```

### The Curtain Call: A Future Forged in Data!

And there you have it, dear friends! The **DevCore Omni-Vault: The Jester's Jewel of Data Sovereignty**! A database service transformed, expanded, and endowed with capabilities that transcend the mundane. This is not just code; it is a manifesto for local data management, a symphony of persistence, and a testament to the fact that even the most technical challenges can be met with a dash of humor and a generous helping of architectural foresight!

Let this expanded `dbService.ts` be a beacon, guiding us to a future where applications are not merely functional but magical, where data is not just stored but cherished, and where every user interaction is a delight. Embrace the Omni-Vault, and unleash the full jester-power of your applications!

---

### Ready-to-Post LinkedIn Summary:

Behold, fellow tech enthusiasts! 🃏 I'm thrilled to unveil the **DevCore Omni-Vault: The Jester's Jewel of Data Sovereignty!** We've taken our `dbService.ts` and transformed it into an IndexedDB masterpiece, packing it with 14 specialized object stores (from user settings to real-time collaboration) and over 2500 lines of robust, feature-rich code!

This isn't just an upgrade; it's a complete architectural overhaul for unparalleled local data management. Think atomic cross-store transactions, robust migration paths, comprehensive auditing, version control, dynamic caching, and advanced analytics – all designed for lightning-fast performance and seamless user experiences directly in the browser.

Dive into the full article to see how we’re revolutionizing local data persistence with a blend of expert engineering and, dare I say, a touch of whimsical genius! Prepare to be inspired, perhaps chuckle a bit, and definitely gain some deep insights into building truly resilient and powerful web applications.

Don't just store data; enchant it! ✨

---

### The Jester's Fifty Fantastical Hashtags:

#IndexedDB #WebDevelopment #FrontendEngineering #DataManagement #LocalStorage #DatabaseArchitecture #JavaScript #TypeScript #SoftwareEngineering #TechInnovation #DevCoreOmniVault #JesterBytealot #CodeAlchemy #DataSovereignty #OfflineFirst #ProgressiveWebApps #PWA #WebPerformance #Scalability #DataPersistence #MigrationStrategy #DevOps #WebDesign #UXEngineering #EnterpriseTech #APIDevelopment #DigitalTransformation #CloudNative #BrowserStorage #DataSecurity #AuditTrail #VersionControl #RealtimeCollaboration #Analytics #UserExperience #CustomFeatures #BackgroundTasks #Notifications #Caching #CodeOptimization #TechHumor #Innovation #FutureOfWeb #Programming #SoftwareDesign #FullStackDevelopment #DeveloperLife #TechTrends #DataScience #WebDevCommunity
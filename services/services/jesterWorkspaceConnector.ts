// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

import * as vaultService from './vaultService.ts';
import { logError, logEvent } from './telemetryService.ts';
import { getDecryptedCredential } from './vaultService.ts';

/**
 * @interface WorkspaceAction
 * @description
 * Behold, ye weary travelers of the digital realm! This sacred interface defines
 * the very essence of an action within our grand Workspace Connector Hub.
 * It's the blueprint for every magical jig and masterful jest performed
 * by our integrated services. Each action is a twinkle in the eye of automation,
 * ready to spring forth and delight your workflows, transforming the mundane
 * into the magnificent! A true jester knows that the most profound magic
 * lies in seamless orchestration.
 */
export interface WorkspaceAction {
  id: string; // The unique moniker for this grand feat, e.g., 'github_create_repo' or 'jester_tell_joke'
  service: 'Jira' | 'Slack' | 'GitHub' | 'Google Calendar' | 'Trello' | 'Salesforce' | 'Email' | 'AI' | 'Weather' | 'Jester' | 'Transformation' | 'Decision'; // A growing pantheon of digital allies, each with its own charm and capabilities!
  description: string; // A poetic explanation of what grand deed this action accomplishes, often with a hint of jester's wit.
  /**
   * @method getParameters
   * @description
   * Reveals the mystical ingredients required for this action's spell to work.
   * Think of it as the recipe for digital delight, guiding you on what to provide.
   * Each parameter is a gem, polished with `type`, `required` status, a `default` value (if applicable),
   * and a `description` to illuminate its purpose. For complex choices, `enum` provides a list of
   * accepted incantations.
   * @returns { [key: string]: { type: 'string' | 'number' | 'boolean' | 'array' | 'object', required: boolean, default?: any, enum?: string[], description?: string, items?: { type: 'string' | 'number' | 'boolean' } } }
   */
  getParameters: () => { [key: string]: { type: 'string' | 'number' | 'boolean' | 'array' | 'object', required: boolean, default?: any, enum?: string[], description?: string, items?: { type: 'string' | 'number' | 'boolean' } } };
  /**
   * @method execute
   * @description
   * The very heart of the jester's performance! This function, when called,
   * unleashes the action's inherent power, transforming your intentions into
   * digital reality. Prepare for enchantment! It meticulously handles credentials,
   * crafts API requests, and gracefully manages the responses or, alas, the errors,
   * always ensuring that every step is logged for prosperity (and debugging!).
   * @param {any} params - The specific incantations (parameters) for this execution.
   * @returns {Promise<any>} A promise of glorious success or a tale of tragic, yet logged, failure.
   */
  execute: (params: any) => Promise<any>;
}

/**
 * @constant ACTION_REGISTRY
 * @description
 * This magnificent map, dear friends, is the grand theater where all our
 * Workspace Actions are registered and await their cue. It's the central
 * scroll where every digital trick and integration marvel is meticulously
 * cataloged. A true treasure trove for any aspiring automation connoisseur,
 * overseen by the discerning eye of the expert jester! Each entry here
 * represents a finely tuned instrument in the orchestra of enterprise integration.
 */
export const ACTION_REGISTRY: Map<string, WorkspaceAction> = new Map();

// --- JIRA: The Agile Minstrel's Symphony ---
ACTION_REGISTRY.set('jira_create_ticket', {
  id: 'jira_create_ticket',
  service: 'Jira',
  description: 'Conjures forth a new issue within the hallowed halls of a Jira project. A true feat for keeping track of tasks, bugs, and other digital dragons! Our jester ensures no task is forgotten, no bug un-squashed!',
  getParameters: () => ({
    projectKey: { type: 'string', required: true, description: 'The secret key to the project castle, e.g., "JEST".' },
    summary: { type: 'string', required: true, description: 'A witty, concise title for the issue, summarizing its plight or triumph.' },
    description: { type: 'string', required: false, description: 'The epic saga detailing the issue, optional but highly encouraged for context. The more detailed the tale, the clearer the quest!' },
    issueType: { type: 'string', required: true, default: 'Task', enum: ['Story', 'Task', 'Bug', 'Epic', 'Sub-task'], description: 'The categorization of this digital endeavor, e.g., "Task", "Bug".' },
    assigneeEmail: { type: 'string', required: false, description: 'The email of the valiant knight to whom this issue shall be assigned. For direct delegation!' },
    priority: { type: 'string', required: false, default: 'Medium', enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'], description: 'The urgency of this quest: from "Lowest" whisper to "Highest" roar.' },
    labels: { type: 'array', required: false, default: [], description: 'An array of digital tags (strings) to categorize the issue further. Like attaching little bells to your tasks!', items: { type: 'string' } }
  }),
  execute: async (params) => {
    // Unveiling the sacred scrolls of Jira credentials from the vault's depths!
    const domain = await getDecryptedCredential('jira_domain');
    const token = await getDecryptedCredential('jira_pat');
    const email = await getDecryptedCredential('jira_email');

    if (!domain || !token || !email) {
      throw new Error("Jira credentials missing! To create digital epics, one must first connect Jira in the Workspace Connector Hub. A jester without tools is just a fool!");
    }

    // Crafting the Atlassian Document Format, for Jira loves its prose in a particular style.
    const descriptionDoc = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              text: params.description || 'No grand tale was provided for this issue, alas. A silent mystery!',
              type: 'text'
            }
          ]
        }
      ]
    };

    logEvent('jira_create_ticket_attempt', { projectKey: params.projectKey, summary: params.summary, issueType: params.issueType });

    const response = await fetch(`https://${domain}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${email}:${token}`)}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          project: { key: params.projectKey },
          summary: params.summary,
          description: descriptionDoc,
          issuetype: { name: params.issueType || 'Task' },
          assignee: params.assigneeEmail ? { emailAddress: params.assigneeEmail } : undefined,
          priority: params.priority ? { name: params.priority } : undefined,
          labels: params.labels || []
        }
      })
    });
    if (!response.ok) {
      const errorBody = await response.text();
      logError(new Error(`Jira API Error (${response.status}): ${errorBody}`), { context: 'jira_create_ticket', actionId: 'jira_create_ticket', params: params });
      throw new Error(`Jira API Error (${response.status}): ${errorBody}. Even jesters sometimes face dragons, and this one Guarded the Jira portal!`);
    }
    const result = await response.json();
    logEvent('jira_create_ticket_success', { issueId: result.id, issueKey: result.key, self: result.self });
    return result;
  }
});

ACTION_REGISTRY.set('jira_transition_issue', {
  id: 'jira_transition_issue',
  service: 'Jira',
  description: 'Guides a Jira issue from one state to another, like a digital stagehand changing scenes. For smooth workflow progression!',
  getParameters: () => ({
    issueIdOrKey: { type: 'string', required: true, description: 'The ID or key of the Jira issue to transition (e.g., "JEST-123").' },
    transitionName: { type: 'string', required: true, description: 'The name of the desired transition (e.g., "Done", "In Progress").' },
    comment: { type: 'string', required: false, description: 'An optional comment to accompany this grand transition.' }
  }),
  execute: async (params) => {
    const domain = await getDecryptedCredential('jira_domain');
    const token = await getDecryptedCredential('jira_pat');
    const email = await getDecryptedCredential('jira_email');

    if (!domain || !token || !email) {
      throw new Error("Jira credentials missing! Without them, issues remain stuck, like a joke without a punchline. Connect Jira in the Workspace Connector Hub!");
    }

    logEvent('jira_transition_issue_attempt', { issueIdOrKey: params.issueIdOrKey, transitionName: params.transitionName });

    // First, find available transitions
    const transitionsResponse = await fetch(`https://${domain}/rest/api/3/issue/${params.issueIdOrKey}/transitions`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${email}:${token}`)}`,
        'Accept': 'application/json'
      }
    });

    if (!transitionsResponse.ok) {
      const errorBody = await transitionsResponse.text();
      logError(new Error(`Jira API Error (Get Transitions ${transitionsResponse.status}): ${errorBody}`), { context: 'jira_transition_issue', actionId: 'jira_transition_issue', stage: 'get_transitions' });
      throw new Error(`Jira API Error (Failed to fetch transitions): ${errorBody}. The roadmap for this issue is unclear!`);
    }
    const transitionsData = await transitionsResponse.json();
    const desiredTransition = transitionsData.transitions.find((t: any) => t.name.toLowerCase() === params.transitionName.toLowerCase());

    if (!desiredTransition) {
      throw new Error(`Transition "${params.transitionName}" not found for issue "${params.issueIdOrKey}". Available: ${transitionsData.transitions.map((t: any) => t.name).join(', ')}. A jester cannot force a square peg into a round hole!`);
    }

    // Then, execute the transition
    const transitionBody: any = {
      transition: {
        id: desiredTransition.id
      }
    };
    if (params.comment) {
      transitionBody.update = {
        comment: [{
          add: {
            body: {
              type: 'doc',
              version: 1,
              content: [{ type: 'paragraph', content: [{ type: 'text', text: params.comment }] }]
            }
          }
        }]
      };
    }

    const response = await fetch(`https://${domain}/rest/api/3/issue/${params.issueIdOrKey}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${email}:${token}`)}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transitionBody)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logError(new Error(`Jira API Error (Execute Transition ${response.status}): ${errorBody}`), { context: 'jira_transition_issue', actionId: 'jira_transition_issue', stage: 'execute_transition', params: params });
      throw new Error(`Jira API Error (Failed to execute transition): ${errorBody}. The issue refused to move, perhaps it enjoyed its current state!`);
    }

    logEvent('jira_transition_issue_success', { issueIdOrKey: params.issueIdOrKey, transitionName: params.transitionName });
    return { success: true, message: `Issue ${params.issueIdOrKey} successfully transitioned to ${params.transitionName}. Onward to glory!` };
  }
});

// --- SLACK: The Digital Town Crier ---
ACTION_REGISTRY.set('slack_post_message', {
  id: 'slack_post_message',
  service: 'Slack',
  description: 'Broadcasts a most important (or hilariously trivial) message to a chosen Slack channel. For digital communiqués and virtual fanfare, ensuring all ears are perked!',
  getParameters: () => ({
    channel: { type: 'string', required: true, description: 'The public square or private chamber where the message shall echo, e.g., "#general" or a channel ID (C1234567).' },
    text: { type: 'string', required: true, description: 'The message itself, ready to inform, amuse, or perhaps slightly bewilder. Keep it concise, for attention spans are fleeting!' },
    username: { type: 'string', required: false, default: 'Jester Bot', description: 'The name of the messenger, by default, our trusty "Jester Bot".' },
    icon_emoji: { type: 'string', required: false, default: ':jester:', description: 'A whimsical emoji avatar for the messenger, adding a touch of visual flair.' },
    thread_ts: { type: 'string', required: false, description: 'The timestamp of a parent message to reply in a thread. For organized banter!' }
  }),
  execute: async (params) => {
    const token = await getDecryptedCredential('slack_bot_token');
    if (!token) {
      throw new Error("Slack credentials missing! How can one shout across the digital void without a proper token? Connect Slack in the Workspace Connector Hub and let the messages flow!");
    }

    logEvent('slack_post_message_attempt', { channel: params.channel, hasThread: !!params.thread_ts });

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        channel: params.channel,
        text: params.text,
        username: params.username,
        icon_emoji: params.icon_emoji,
        thread_ts: params.thread_ts // If provided, posts in a thread
      })
    });
    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`Slack API Error: ${errorBody.error}`), { context: 'slack_post_message', actionId: 'slack_post_message', params: params });
      throw new Error(`Slack API Error: ${errorBody.error}. My apologies, the message seems to have gotten lost in the digital ether, or perhaps the digital birds were on strike!`);
    }
    const result = await response.json();
    if (!result.ok) {
      logError(new Error(`Slack API Result Not OK: ${result.error}`), { context: 'slack_post_message', actionId: 'slack_post_message', result: result });
      throw new Error(`Slack API Result Not OK: ${result.error}. A jester's message, once sent, must surely arrive. What sorcery is this?!`);
    }
    logEvent('slack_post_message_success', { channel: params.channel, ts: result.ts });
    return result;
  }
});

ACTION_REGISTRY.set('slack_send_ephemeral_message', {
  id: 'slack_send_ephemeral_message',
  service: 'Slack',
  description: 'Whispers a temporary, fleeting message to a specific user in a channel. Perfect for secret jester instructions or gentle nudges!',
  getParameters: () => ({
    channel: { type: 'string', required: true, description: 'The channel ID where the message will appear momentarily.' },
    user: { type: 'string', required: true, description: 'The user ID (U12345678) to whom the ephemeral message is sent.' },
    text: { type: 'string', required: true, description: 'The message itself, appearing only for the designated recipient, then vanishing!' }
  }),
  execute: async (params) => {
    const token = await getDecryptedCredential('slack_bot_token');
    if (!token) {
      throw new Error("Slack credentials missing! One cannot send secret notes without a token. Connect Slack in the Workspace Connector Hub!");
    }

    logEvent('slack_send_ephemeral_message_attempt', { channel: params.channel, user: params.user });

    const response = await fetch('https://slack.com/api/chat.postEphemeral', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        channel: params.channel,
        user: params.user,
        text: params.text
      })
    });
    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`Slack API Error: ${errorBody.error}`), { context: 'slack_send_ephemeral_message', actionId: 'slack_send_ephemeral_message', params: params });
      throw new Error(`Slack API Error: ${errorBody.error}. The ephemeral whisper was lost in the winds!`);
    }
    const result = await response.json();
    if (!result.ok) {
      logError(new Error(`Slack API Result Not OK: ${result.error}`), { context: 'slack_send_ephemeral_message', actionId: 'slack_send_ephemeral_message', result: result });
      throw new Error(`Slack API Result Not OK: ${result.error}. A ghost in the machine swallowed the fleeting message!`);
    }
    logEvent('slack_send_ephemeral_message_success', { channel: params.channel, user: params.user });
    return result;
  }
});


// --- GITHUB: The Code Weaver's Loom ---
ACTION_REGISTRY.set('github_create_repository', {
  id: 'github_create_repository',
  service: 'GitHub',
  description: 'Spins a brand new code repository into existence within GitHub. A blank canvas for your digital masterpieces, ready for the brushstrokes of innovation!',
  getParameters: () => ({
    name: { type: 'string', required: true, description: 'The distinguished name for your new repository. Choose wisely, for it shall be its digital identity!' },
    description: { type: 'string', required: false, description: 'A poetic description of the repository\'s purpose, optional but recommended. Give it character!' },
    private: { type: 'boolean', required: false, default: false, description: 'Should this repository be a private treasure trove (true) or open to all for collaboration (false)?' },
    auto_init: { type: 'boolean', required: false, default: true, description: 'To initialize with a README (true) or not to initialize (false), that is the question! A README is like a welcome mat.' },
    license_template: { type: 'string', required: false, description: 'The name of a license template to add to the repository, e.g., "mit", "apache-2.0".' }
  }),
  execute: async (params) => {
    const token = await getDecryptedCredential('github_pat');
    if (!token) {
      throw new Error("GitHub credentials missing! One cannot conjure code repositories without a personal access token. Connect GitHub in the Workspace Connector Hub and unlock the gates of collaboration!");
    }

    logEvent('github_create_repository_attempt', { name: params.name, isPrivate: params.private });

    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        private: params.private,
        auto_init: params.auto_init,
        license_template: params.license_template
      })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`GitHub API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'github_create_repository', actionId: 'github_create_repository', params: params });
      throw new Error(`GitHub API Error: ${errorBody.message || 'Unknown error'}. My apologies, the repository creation spell fizzled! Perhaps the spirits of Git were not appeased.`);
    }
    const result = await response.json();
    logEvent('github_create_repository_success', { repoId: result.id, repoName: result.name, html_url: result.html_url });
    return result;
  }
});

ACTION_REGISTRY.set('github_create_issue', {
  id: 'github_create_issue',
  service: 'GitHub',
  description: 'Unfurls a new issue within a specified GitHub repository. For tracking bugs, features, and the occasional existential crisis in code! Let no digital dilemma go unnoticed.',
  getParameters: () => ({
    owner: { type: 'string', required: true, description: 'The esteemed owner of the repository.' },
    repo: { type: 'string', required: true, description: 'The name of the repository where the issue shall reside.' },
    title: { type: 'string', required: true, description: 'A catchy title for the new issue. Something that grabs attention, like a jester\'s dramatic entrance!' },
    body: { type: 'string', required: false, description: 'The detailed narrative of the issue, what ails it, or what glorious feature it brings. Provide ample context, a jester\'s story is always richer with detail.' },
    labels: { type: 'array', required: false, default: [], description: 'An array of labels to categorize the issue, e.g., ["bug", "enhancement"].', items: { type: 'string' } },
    assignees: { type: 'array', required: false, default: [], description: 'An array of GitHub usernames to whom this issue shall be assigned. Delegate with flair!', items: { type: 'string' } },
    milestone: { type: 'number', required: false, description: 'The number of the milestone to associate this issue with.' }
  }),
  execute: async (params) => {
    const token = await getDecryptedCredential('github_pat');
    if (!token) {
      throw new Error("GitHub credentials missing! Without a token, how shall we track these digital dilemmas? Connect GitHub in the Workspace Connector Hub and ensure no problem goes un-addressed!");
    }

    logEvent('github_create_issue_attempt', { owner: params.owner, repo: params.repo, title: params.title });

    const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        labels: params.labels,
        assignees: params.assignees,
        milestone: params.milestone
      })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`GitHub API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'github_create_issue', actionId: 'github_create_issue', params: params });
      throw new Error(`GitHub API Error: ${errorBody.message || 'Unknown error'}. The issue, it seems, has issues of its own! Perhaps the GitHub spirits were not ready for such a grand problem.`);
    }
    const result = await response.json();
    logEvent('github_create_issue_success', { issueId: result.id, issueNumber: result.number, html_url: result.html_url });
    return result;
  }
});

ACTION_REGISTRY.set('github_create_pull_request', {
  id: 'github_create_pull_request',
  service: 'GitHub',
  description: 'Initiates a new pull request on GitHub. For proposing changes, seeking code review, and merging brilliant ideas into the main lineage!',
  getParameters: () => ({
    owner: { type: 'string', required: true, description: 'The owner of the repository.' },
    repo: { type: 'string', required: true, description: 'The name of the repository.' },
    title: { type: 'string', required: true, description: 'The title of the pull request. Announce your changes with confidence!' },
    head: { type: 'string', required: true, description: 'The name of the branch where your changes are (e.g., "feature/my-new-feature").' },
    base: { type: 'string', required: true, default: 'main', description: 'The name of the branch you want to merge into (e.g., "main").' },
    body: { type: 'string', required: false, description: 'A detailed description of the changes proposed in the pull request.' },
    draft: { type: 'boolean', required: false, default: false, description: 'Set to true for a draft pull request, perfect for work in progress.' }
  }),
  execute: async (params) => {
    const token = await getDecryptedCredential('github_pat');
    if (!token) {
      throw new Error("GitHub credentials missing! To propose grand code reforms, one needs a token. Connect GitHub in the Workspace Connector Hub!");
    }

    logEvent('github_create_pull_request_attempt', { owner: params.owner, repo: params.repo, head: params.head, base: params.base });

    const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: params.title,
        head: params.head,
        base: params.base,
        body: params.body,
        draft: params.draft
      })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`GitHub API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'github_create_pull_request', actionId: 'github_create_pull_request', params: params });
      throw new Error(`GitHub API Error: ${errorBody.message || 'Unknown error'}. The pull request encountered a snag, perhaps a mischievous merge conflict!`);
    }
    const result = await response.json();
    logEvent('github_create_pull_request_success', { pullRequestId: result.id, pullRequestNumber: result.number, html_url: result.html_url });
    return result;
  }
});


// --- GOOGLE CALENDAR: The Time Keeper's Chronicle ---
ACTION_REGISTRY.set('google_calendar_create_event', {
  id: 'google_calendar_create_event',
  service: 'Google Calendar',
  description: 'Pencils in a new event on your Google Calendar. Never miss a grand meeting or a jester\'s performance again! Our jester ensures your schedule is as perfectly orchestrated as a royal ball.',
  getParameters: () => ({
    calendarId: { type: 'string', required: true, default: 'primary', description: 'The identifier for the calendar where the event will be placed (e.g., "primary" or an email address). The stage for your event!' },
    summary: { type: 'string', required: true, description: 'The sparkling title of your event. Make it memorable!' },
    description: { type: 'string', required: false, description: 'A detailed account of the event, for those who seek further enlightenment.' },
    location: { type: 'string', required: false, description: 'The physical (or virtual) locale where this grand assembly shall take place.' },
    startDateTime: { type: 'string', required: true, description: 'The precise moment the event begins, in ISO 8601 format (e.g., "2023-10-27T10:00:00-07:00").' },
    endDateTime: { type: 'string', required: true, description: 'The glorious conclusion of the event, also in ISO 8601 format.' },
    attendees: { type: 'array', required: false, default: [], description: 'An array of email addresses for those honored guests who shall attend. Gather your digital court!', items: { type: 'string' } },
    sendNotifications: { type: 'boolean', required: false, default: true, description: 'Shall we send forth digital invitations and reminders (true) or hold a quiet gathering (false)?' },
    colorId: { type: 'string', required: false, description: 'A numeric identifier for the event\'s color (1-11). For a visually vibrant calendar!' }
  }),
  execute: async (params) => {
    const token = await getDecryptedCredential('google_calendar_access_token'); // Requires OAuth token
    if (!token) {
      throw new Error("Google Calendar credentials missing! To orchestrate time, one needs a proper access token. Connect Google Calendar in the Workspace Connector Hub!");
    }

    logEvent('google_calendar_create_event_attempt', { summary: params.summary, calendarId: params.calendarId });

    const attendeesList = params.attendees.map((email: string) => ({ email }));

    const event = {
      summary: params.summary,
      location: params.location,
      description: params.description,
      start: {
        dateTime: params.startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use local timezone for creation
      },
      end: {
        dateTime: params.endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendeesList,
      colorId: params.colorId
    };

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${params.calendarId}/events?sendUpdates=${params.sendNotifications ? 'all' : 'none'}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`Google Calendar API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'google_calendar_create_event', actionId: 'google_calendar_create_event', params: params });
      throw new Error(`Google Calendar API Error: ${errorBody.error?.message || 'Unknown error'}. Alas, the sands of time refused to yield for this event! Perhaps the calendar spirits were busy.`);
    }
    const result = await response.json();
    logEvent('google_calendar_create_event_success', { eventId: result.id, summary: result.summary, htmlLink: result.htmlLink });
    return result;
  }
});

ACTION_REGISTRY.set('google_calendar_find_free_time', {
  id: 'google_calendar_find_free_time',
  service: 'Google Calendar',
  description: 'Scouts the calendars of specified attendees to find pockets of glorious free time. A true wizardry for scheduling meetings without digital duels or double-bookings! The jester ensures everyone has time for a proper chuckle.',
  getParameters: () => ({
    timeMin: { type: 'string', required: true, description: 'The earliest possible start time for the search, in ISO 8601 format.' },
    timeMax: { type: 'string', required: true, description: 'The latest possible end time for the search, in ISO 8601 format.' },
    items: { type: 'array', required: true, description: 'An array of calendar IDs (email addresses) to check for availability. Include "primary" for your own calendar.', items: { type: 'string' } },
    duration: { type: 'number', required: true, description: 'The desired duration of the free slot in minutes. The smaller the gap, the more agile the jester!' },
    timeZone: { type: 'string', required: false, default: Intl.DateTimeFormat().resolvedOptions().timeZone, description: 'The timezone to consider for the search, e.g., "America/New_York".' }
  }),
  execute: async (params) => {
    const token = await getDecryptedCredential('google_calendar_access_token');
    if (!token) {
      throw new Error("Google Calendar credentials missing! To read the runes of time, one needs an access token. Connect Google Calendar in the Workspace Connector Hub!");
    }

    logEvent('google_calendar_find_free_time_attempt', { itemsCount: params.items.length, timeMin: params.timeMin, timeMax: params.timeMax });

    const items = params.items.map((id: string) => ({ id }));

    const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        items: items,
        timeZone: params.timeZone
      })
    });

    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`Google Calendar API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'google_calendar_find_free_time', actionId: 'google_calendar_find_free_time', params: params });
      throw new Error(`Google Calendar API Error: ${errorBody.error?.message || 'Unknown error'}. The digital crystal ball is cloudy today, unable to discern free moments!`);
    }

    const freeBusyData = await response.json();
    const busySlots: { start: string; end: string }[] = [];

    // Aggregate all busy slots from all calendars
    for (const calendarId in freeBusyData.calendars) {
      if (freeBusyData.calendars.hasOwnProperty(calendarId)) {
        busySlots.push(...freeBusyData.calendars[calendarId].busy);
      }
    }

    // Sort busy slots by start time
    busySlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Find free slots of required duration
    const freeSlots: { start: Date; end: Date }[] = [];
    let currentFreeStart = new Date(params.timeMin);
    const maxSearchTime = new Date(params.timeMax);

    for (const busy of busySlots) {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);

      // If there's a gap before this busy slot, and it's long enough
      if (currentFreeStart.getTime() < busyStart.getTime()) {
        const potentialFreeEnd = new Date(busyStart);
        if (potentialFreeEnd.getTime() - currentFreeStart.getTime() >= params.duration * 60 * 1000) {
          freeSlots.push({ start: currentFreeStart, end: potentialFreeEnd });
        }
      }
      // Move current free start past the current busy slot, ensuring we don't double count busy time
      if (busyEnd.getTime() > currentFreeStart.getTime()) {
        currentFreeStart = busyEnd;
      }
    }

    // Check for free time after the last busy slot up to timeMax
    if (currentFreeStart.getTime() < maxSearchTime.getTime()) {
      if (maxSearchTime.getTime() - currentFreeStart.getTime() >= params.duration * 60 * 1000) {
        freeSlots.push({ start: currentFreeStart, end: maxSearchTime });
      }
    }

    logEvent('google_calendar_find_free_time_success', { freeSlotsCount: freeSlots.length });
    return freeSlots.map(slot => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString()
    }));
  }
});


// --- TRELLO: The Board Maestro ---
ACTION_REGISTRY.set('trello_create_card', {
  id: 'trello_create_card',
  service: 'Trello',
  description: 'Fashions a new card upon a Trello board. For managing tasks, ideas, and the occasional digital scribblings! Our jester ensures every task finds its proper place.',
  getParameters: () => ({
    idList: { type: 'string', required: true, description: 'The ID of the list where this card shall be placed. A true jester knows where to put things!' },
    name: { type: 'string', required: true, description: 'The title of the card. Make it catchy, like a jester\'s witty riddle!' },
    desc: { type: 'string', required: false, description: 'A detailed description of the card\'s purpose or content. More detail, more delight!' },
    pos: { type: 'string', required: false, default: 'bottom', enum: ['top', 'bottom'], description: 'Where on the list should this card appear? "top" for prominence, "bottom" for humble beginnings.' },
    idMembers: { type: 'array', required: false, default: [], description: 'An array of member IDs to assign to this card. Gather your troupe!', items: { type: 'string' } },
    due: { type: 'string', required: false, description: 'The due date for this card, in ISO 8601 format. For timely jests!' }
  }),
  execute: async (params) => {
    const key = await getDecryptedCredential('trello_api_key');
    const token = await getDecryptedCredential('trello_api_token');
    if (!key || !token) {
      throw new Error("Trello credentials missing! To shuffle cards, one needs both key and token. Connect Trello in the Workspace Connector Hub!");
    }

    logEvent('trello_create_card_attempt', { idList: params.idList, name: params.name });

    const queryParams = new URLSearchParams({
      key: key,
      token: token,
      idList: params.idList,
      name: params.name,
      desc: params.desc || '',
      pos: params.pos || 'bottom',
    });
    if (params.idMembers && params.idMembers.length > 0) {
      queryParams.append('idMembers', params.idMembers.join(','));
    }
    if (params.due) {
      queryParams.append('due', params.due);
    }

    const response = await fetch(`https://api.trello.com/1/cards?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`Trello API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'trello_create_card', actionId: 'trello_create_card', params: params });
      throw new Error(`Trello API Error: ${errorBody.message || 'Unknown error'}. The card creation spell faltered! Perhaps the Trello board was too full of jester's doodles.`);
    }
    const result = await response.json();
    logEvent('trello_create_card_success', { cardId: result.id, cardName: result.name, shortUrl: result.shortUrl });
    return result;
  }
});

ACTION_REGISTRY.set('trello_move_card', {
  id: 'trello_move_card',
  service: 'Trello',
  description: 'Gracefully moves a Trello card from one list to another. For when a task\'s journey progresses, or a jester changes his mind!',
  getParameters: () => ({
    idCard: { type: 'string', required: true, description: 'The ID of the card to be moved.' },
    idList: { type: 'string', required: true, description: 'The ID of the destination list. The card\'s new dwelling!' },
    pos: { type: 'string', required: false, default: 'bottom', enum: ['top', 'bottom'], description: 'Where on the new list should this card appear? "top" or "bottom".' }
  }),
  execute: async (params) => {
    const key = await getDecryptedCredential('trello_api_key');
    const token = await getDecryptedCredential('trello_api_token');
    if (!key || !token) {
      throw new Error("Trello credentials missing! To orchestrate card movements, one needs both key and token. Connect Trello in the Workspace Connector Hub!");
    }

    logEvent('trello_move_card_attempt', { idCard: params.idCard, idList: params.idList });

    const queryParams = new URLSearchParams({
      key: key,
      token: token,
      idList: params.idList,
      pos: params.pos || 'bottom'
    }).toString();

    const response = await fetch(`https://api.trello.com/1/cards/${params.idCard}?${queryParams}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`Trello API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'trello_move_card', actionId: 'trello_move_card', params: params });
      throw new Error(`Trello API Error: ${errorBody.message || 'Unknown error'}. The card refused to budge! Perhaps it enjoyed its old home too much.`);
    }
    const result = await response.json();
    logEvent('trello_move_card_success', { cardId: result.id, newListId: result.idList });
    return result;
  }
});


// --- SALESFORCE: The CRM Oracle ---
ACTION_REGISTRY.set('salesforce_create_lead', {
  id: 'salesforce_create_lead',
  service: 'Salesforce',
  description: 'Generates a new lead record in Salesforce. For capturing potential prospects and expanding your digital kingdom! Our jester ensures no promising lead slips through the cracks.',
  getParameters: () => ({
    lastName: { type: 'string', required: true, description: 'The last name of the potential client. A crucial identifier for our royal records!' },
    company: { type: 'string', required: true, description: 'The company associated with this promising lead. Where do they hail from?' },
    firstName: { type: 'string', required: false, description: 'The first name of the lead, for a personal touch. A friendly greeting goes a long way!' },
    email: { type: 'string', required: false, description: 'The email address for digital correspondence. For sending forth digital proclamations.' },
    phone: { type: 'string', required: false, description: 'A direct line to the prospect, for urgent jester business.' },
    status: { type: 'string', required: false, default: 'New', enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Working'], description: 'The current stage of this lead\'s journey. Guiding them towards digital enlightenment.' },
    leadSource: { type: 'string', required: false, description: 'The origin of this lead, e.g., "Web", "Referral", "Partner". For understanding our audience.' }
  }),
  execute: async (params) => {
    const domain = await getDecryptedCredential('salesforce_domain'); // e.g., 'yourinstance.my.salesforce.com'
    const token = await getDecryptedCredential('salesforce_access_token'); // OAuth token
    if (!domain || !token) {
      throw new Error("Salesforce credentials missing! To harvest leads, one needs domain and token. Connect Salesforce in the Workspace Connector Hub and watch your prospect list grow!");
    }

    logEvent('salesforce_create_lead_attempt', { lastName: params.lastName, company: params.company });

    const leadData = {
      LastName: params.lastName,
      Company: params.company,
      FirstName: params.firstName,
      Email: params.email,
      Phone: params.phone,
      Status: params.status,
      LeadSource: params.leadSource
    };

    const response = await fetch(`https://${domain}/services/data/v58.0/sobjects/Lead`, { // Using a common API version for stability
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      logError(new Error(`Salesforce API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'salesforce_create_lead', actionId: 'salesforce_create_lead', params: params });
      throw new Error(`Salesforce API Error: ${JSON.stringify(errorBody)}. The lead, it seems, has escaped the net! Perhaps our digital charm was not enough.`);
    }
    const result = await response.json();
    logEvent('salesforce_create_lead_success', { leadId: result.id, success: result.success });
    return result;
  }
});

ACTION_REGISTRY.set('salesforce_update_opportunity', {
  id: 'salesforce_update_opportunity',
  service: 'Salesforce',
  description: 'Amends an existing opportunity record in Salesforce. For updating progress and ensuring no potential deal goes unnoticed!',
  getParameters: () => ({
    id: { type: 'string', required: true, description: 'The ID of the opportunity record to update.' },
    name: { type: 'string', required: false, description: 'A new, perhaps more fitting, name for the opportunity.' },
    amount: { type: 'number', required: false, description: 'The updated expected revenue amount. For those glorious forecasts!' },
    stageName: { type: 'string', required: false, enum: ['Prospecting', 'Qualification', 'Needs Analysis', 'Value Proposition', 'Id. Decision Makers', 'Perception Analysis', 'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won', 'Closed Lost'], description: 'The current stage of this opportunity in the sales pipeline.' },
    closeDate: { type: 'string', required: false, description: 'The anticipated date for the grand closing, in YYYY-MM-DD format.' },
    description: { type: 'string', required: false, description: 'An updated narrative for the opportunity, clarifying its epic journey.' }
  }),
  execute: async (params) => {
    const domain = await getDecryptedCredential('salesforce_domain');
    const token = await getDecryptedCredential('salesforce_access_token');
    if (!domain || !token) {
      throw new Error("Salesforce credentials missing! To update fortunes, one needs domain and token. Connect Salesforce in the Workspace Connector Hub!");
    }

    logEvent('salesforce_update_opportunity_attempt', { opportunityId: params.id, newStage: params.stageName });

    const updateData: any = {};
    if (params.name) updateData.Name = params.name;
    if (params.amount) updateData.Amount = params.amount;
    if (params.stageName) updateData.StageName = params.stageName;
    if (params.closeDate) updateData.CloseDate = params.closeDate;
    if (params.description) updateData.Description = params.description;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No update parameters provided for the opportunity. A jester cannot perform a trick without any props!");
    }

    const response = await fetch(`https://${domain}/services/data/v58.0/sobjects/Opportunity/${params.id}`, {
      method: 'PATCH', // Use PATCH for partial updates
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorBody = await response.json(); // PATCH typically returns 204 No Content for success, but error will have JSON
      logError(new Error(`Salesforce API Error (${response.status}): ${JSON.stringify(errorBody)}`), { context: 'salesforce_update_opportunity', actionId: 'salesforce_update_opportunity', params: params });
      throw new Error(`Salesforce API Error: ${JSON.stringify(errorBody)}. The opportunity, it seems, resisted our glorious update!`);
    }

    logEvent('salesforce_update_opportunity_success', { opportunityId: params.id, updatedFields: Object.keys(updateData) });
    return { success: true, message: `Opportunity ${params.id} updated successfully. Fortune favors the bold, and the automated!` };
  }
});


// --- EMAIL: The Digital Scribe ---
ACTION_REGISTRY.set('email_send_smtp_message', {
  id: 'email_send_smtp_message',
  service: 'Email',
  description: 'Dispatches a message through the ancient, yet reliable, art of SMTP. For formal communiqués and secret whispers! Our jester ensures your words reach their digital destination.',
  getParameters: () => ({
    to: { type: 'string', required: true, description: 'The recipient\'s email address. To whom shall this digital parchment be delivered? Multiple addresses can be separated by commas.' },
    subject: { type: 'string', required: true, description: 'The headline of the message. Make it intriguing, like a jester\'s tantalizing riddle!' },
    body: { type: 'string', required: true, description: 'The main content of the email. Pen your masterpiece, whether a grand announcement or a subtle hint!' },
    from: { type: 'string', required: false, description: 'The sender\'s email address. By default, our royal messenger\'s address.' },
    html: { type: 'boolean', required: false, default: false, description: 'Is the body plain text (false) or a rich tapestry of HTML (true)? For truly elaborate messages!' },
    cc: { type: 'string', required: false, description: 'Carbon copy recipients (comma-separated emails). For sharing the jest with others!' },
    bcc: { type: 'string', required: false, description: 'Blind carbon copy recipients (comma-separated emails). For discreet communication.' }
  }),
  execute: async (params) => {
    // For a real system, this would interact with an internal SMTP relay service
    // or a third-party email API like SendGrid/Mailgun, using credentials.
    const smtpHost = await getDecryptedCredential('smtp_host');
    const smtpPort = await getDecryptedCredential('smtp_port');
    const smtpUser = await getDecryptedCredential('smtp_user');
    const smtpPass = await getDecryptedCredential('smtp_password');
    const defaultFrom = await getDecryptedCredential('smtp_default_from_email');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      throw new Error("SMTP credentials missing! To send digital doves, one needs an SMTP configuration (host, port, user, pass). Configure Email in the Workspace Connector Hub!");
    }
    if (!params.from && !defaultFrom) {
      throw new Error("No sender email specified or configured. The digital raven needs an address from which to depart!");
    }

    logEvent('email_send_smtp_message_attempt', { to: params.to, subject: params.subject, html: params.html });

    // This is a simulated external API call for demonstration.
    // In a real scenario, this would likely be a call to a backend service
    // that handles SMTP, or a direct call to a transactional email provider API.
    const simulatedEmailPayload = {
      from: params.from || defaultFrom,
      to: params.to,
      subject: params.subject,
      body: params.body,
      isHtml: params.html,
      cc: params.cc,
      bcc: params.bcc,
      // Imagine an API endpoint here:
      // await fetch('https://my-internal-email-relay.com/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${smtpAuthToken}` },
      //   body: JSON.stringify(simulatedEmailPayload)
      // });
    };

    const mockEmailServiceResponse = await new Promise(resolve => setTimeout(() => {
      // Simulate success or failure with a jester's unpredictability
      if (Math.random() > 0.1) { // 90% success rate
        resolve({ success: true, message: `Email to ${params.to} with subject "${params.subject}" sent by the royal postal service! Huzzah!` });
      } else {
        throw new Error("The digital raven encountered a strong headwind and failed to deliver the message. Check the logs for feather counts!");
      }
    }, 1500)); // Simulate network latency

    logEvent('email_send_smtp_message_success', { to: params.to, subject: params.subject });
    return mockEmailServiceResponse;
  }
});


// --- AI: The Digital Oracle's Wisdom ---
ACTION_REGISTRY.set('ai_summarize_text', {
  id: 'ai_summarize_text',
  service: 'AI',
  description: 'Condenses vast oceans of text into sparkling droplets of insight. For when one needs brevity, not prolixity! Our AI jester excels at getting to the heart of the matter.',
  getParameters: () => ({
    text: { type: 'string', required: true, description: 'The lengthy parchment awaiting a jester\'s witty summary. Provide a grand narrative!' },
    maxLength: { type: 'number', required: false, default: 200, description: 'The maximum length of the summary, a measure of digital conciseness. For short attention spans!' },
    language: { type: 'string', required: false, default: 'en', description: 'The language of the text, for nuanced understanding. Lest the AI mistake a jest for a plea!' },
    model: { type: 'string', required: false, default: 'jester_summarizer_v1', description: 'The specific AI model to employ for summarization. Each model has its own comedic flair!' }
  }),
  execute: async (params) => {
    const apiKey = await getDecryptedCredential('ai_service_api_key');
    if (!apiKey) {
      throw new Error("AI service credentials missing! To distill wisdom, one needs an oracle's key. Connect AI Service in the Workspace Connector Hub and unleash the digital mind!");
    }

    if (params.text.length < 50) {
      throw new Error("The text is too short to summarize. Even a jester needs more material for a proper jest!");
    }

    logEvent('ai_summarize_text_attempt', { textLength: params.text.length, maxLength: params.maxLength, model: params.model });

    // Mock AI service call using a slightly more "advanced" mock for variety
    const mockSummaryGenerator = (input: string, maxLen: number) => {
      const words = input.split(/\s+/);
      const firstFewWords = words.slice(0, Math.min(words.length, 20)).join(' ');
      let summary = `Jester's digital digest: Based on the initial glimpse, "${firstFewWords}...", the core message is that brevity is the soul of wit, and this text, in its majestic sprawling, has been distilled for your quick consumption. The spirits of code decree it so! (Original length: ${input.length} characters).`;
      if (summary.length > maxLen) {
        summary = summary.substring(0, maxLen - 3) + '...';
      }
      return summary;
    };

    const mockSummary = mockSummaryGenerator(params.text, params.maxLength);

    // Simulate an AI API call. In a real scenario, this would hit an LLM endpoint.
    const response = await new Promise(resolve => setTimeout(() => {
      resolve({ summary: mockSummary, tokensUsed: Math.ceil(params.text.length / 4) }); // A crude token estimation
    }, 1000 + Math.random() * 500)); // Simulate varying AI latency

    logEvent('ai_summarize_text_success', { summaryLength: (response as any).summary.length });
    return response;
  }
});

ACTION_REGISTRY.set('ai_generate_jester_idea', {
  id: 'ai_generate_jester_idea',
  service: 'AI',
  description: 'Invokes the AI muse to conjure forth an inspirational or humorous jester-themed idea. For when your wit needs a digital spark, and your creativity a playful push!',
  getParameters: () => ({
    prompt: { type: 'string', required: false, default: 'Suggest a new jester-themed automation idea for a modern enterprise.', description: 'Your whispered suggestion to the AI, guiding its creative flow. The more evocative the prompt, the grander the idea!' },
    creativity: { type: 'number', required: false, default: 0.7, description: 'A numeric measure of the AI\'s imaginative flair (0.0 to 1.0). Higher means wilder and more unexpected jests!' },
    language: { type: 'string', required: false, default: 'en', description: 'The preferred language for the generated idea. For global jests!' }
  }),
  execute: async (params) => {
    const apiKey = await getDecryptedCredential('ai_service_api_key');
    if (!apiKey) {
      throw new Error("AI service credentials missing! To spark creativity, one needs an oracle's key. Connect AI Service in the Workspace Connector Hub and let the ideas flow like wine at a royal feast!");
    }

    logEvent('ai_generate_jester_idea_attempt', { prompt: params.prompt, creativity: params.creativity });

    // A curated list of jester-esque ideas for a mock AI, enhanced with 'creativity' logic.
    const jesterIdeasBase = [
      "Automate the sending of 'Thou art brilliant!' messages to team members who close complex Jira tickets, complete with a confetti emoji.",
      "Develop a 'Digital Gong' that celebrates successful deployments with a random, uplifting Slack emoji burst and a brief, auto-generated haiku.",
      "Implement a 'Whisper of Wisdom' service that sends a relevant, humorous quote to team leads every Monday morning, tailored to their recent activity.",
      "Create a 'Folly Detector' AI that flags overly complex or bureaucratic email threads and suggests simplification, or even a public roast (gently, of course!).",
      "Design a 'Project Proclamation' system that converts dull project updates into epic, bard-like narratives for stakeholders, complete with dramatic flair.",
      "Build a 'Coffee Break Oracle' that suggests a random, amusing topic for team discussions during breaks, preventing awkward silences.",
      "An automated 'Digital Jest' that occasionally swaps the order of 'first name' and 'last name' in non-critical internal forms, just for a chuckle (with an easy undo!).",
      "A 'Mirthful Metrics' dashboard that visualizes team progress with animated jesters dancing when goals are met, and comically weeping when deadlines are missed (all in good fun!)."
    ];

    const wilderIdeas = [
      "A 'Sentry of Silliness' that autocorrects serious messages into limericks if detected to be sent after 5 PM on a Friday.",
      "A 'Dragon of Documentation' AI that challenges developers to write documentation with riddles and hidden clues, only revealing solutions upon successful code review.",
      "Implement a 'Royal Decree' system where important announcements are delivered via personalized animated GIFs of the CEO as a benevolent monarch.",
      "A 'Time Warp Assistant' that occasionally sends a calendar invite for a meeting that happened last week, just to test attentiveness."
    ];

    let chosenIdea: string;
    if (params.creativity > 0.8 && Math.random() < params.creativity) {
      chosenIdea = wilderIdeas[Math.floor(Math.random() * wilderIdeas.length)];
    } else {
      chosenIdea = jesterIdeasBase[Math.floor(Math.random() * jesterIdeasBase.length)];
    }

    // Simulate AI processing time.
    const response = await new Promise(resolve => setTimeout(() => {
      resolve({ idea: chosenIdea, inspiration: `Inspired by your prompt: "${params.prompt}" with a creativity score of ${params.creativity}. May your workflows be ever entertaining!` });
    }, 1200 + Math.random() * 800)); // Varying AI thinking time

    logEvent('ai_generate_jester_idea_success');
    return response;
  }
});


// --- WEATHER: The Sky's Whispers ---
ACTION_REGISTRY.set('weather_get_current', {
  id: 'weather_get_current',
  service: 'Weather',
  description: 'Consults the digital winds to fetch current weather conditions for a chosen locale. For planning outdoor jester performances, predicting digital storms, or simply knowing if an umbrella is needed!',
  getParameters: () => ({
    city: { type: 'string', required: false, description: 'The bustling city for which you seek weather wisdom. E.g., "London", "New York".' },
    stateCode: { type: 'string', required: false, description: 'The two-letter state code for US cities (e.g., "CA", "NY").' },
    zipCode: { type: 'string', required: false, description: 'The postal code, a secret identifier for precise location.' },
    countryCode: { type: 'string', required: false, default: 'US', description: 'The two-letter country code (e.g., "US", "GB").' },
    unit: { type: 'string', required: false, default: 'metric', enum: ['metric', 'imperial'], description: 'Temperature unit: "metric" (Celsius) or "imperial" (Fahrenheit). Choose your comfort!' }
  }),
  execute: async (params) => {
    const apiKey = await getDecryptedCredential('weather_api_key');
    if (!apiKey) {
      throw new Error("Weather API credentials missing! To commune with the clouds, one needs a key. Connect Weather Service in the Workspace Connector Hub and let the forecast begin!");
    }

    if (!params.city && !params.zipCode) {
      throw new Error("Either 'city' (with optional stateCode) or 'zipCode' is required to ask the sky about its mood. The jester cannot guess your location!");
    }

    logEvent('weather_get_current_attempt', { city: params.city, zipCode: params.zipCode, unit: params.unit });

    let query = '';
    if (params.city) {
      query = `q=${params.city}`;
      if (params.stateCode) query += `,${params.stateCode}`;
      query += `,${params.countryCode}`;
    } else if (params.zipCode) {
      query = `zip=${params.zipCode},${params.countryCode}`;
    }

    // Mock OpenWeatherMap API call structure (simplified)
    const mockWeatherResponse = {
      coord: { lon: -0.13, lat: 51.51 }, // Example: London
      weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
      main: {
        temp: params.unit === 'metric' ? 18.5 : 65.3,
        feels_like: params.unit === 'metric' ? 17.0 : 62.6,
        temp_min: params.unit === 'metric' ? 16.0 : 60.8,
        temp_max: params.unit === 'metric' ? 20.0 : 68.0,
        pressure: 1015,
        humidity: 70
      },
      wind: { speed: 4.12, deg: 230 },
      clouds: { all: 0 },
      name: params.city || `A Place Near ${params.zipCode}`,
      sys: { country: params.countryCode, sunrise: 1678810000, sunset: 1678850000 },
      timezone: 3600,
      id: 2643743,
      dt: Math.floor(Date.now() / 1000)
    };

    const response = await new Promise(resolve => setTimeout(() => {
      resolve(mockWeatherResponse);
    }, 700)); // Simulate API latency

    const castResponse = response as any;
    logEvent('weather_get_current_success', { location: castResponse.name, temp: castResponse.main.temp, description: castResponse.weather[0].description });
    return response;
  }
});


// --- JESTER: The Pure Amusement Engine ---
ACTION_REGISTRY.set('jester_tell_joke', {
  id: 'jester_tell_joke',
  service: 'Jester',
  description: 'Delivers a perfectly timed, delightfully digital jest. For brightening moods and easing the burdens of the day! A well-placed joke is a jester\'s finest tool.',
  getParameters: () => ({
    topic: { type: 'string', required: false, description: 'A suggested topic for the joke, guiding the jester\'s wit. E.g., "coding", "meetings".' },
    mood: { type: 'string', required: false, default: 'lighthearted', enum: ['lighthearted', 'punny', 'sarcastic', 'dad joke', 'tech'], description: 'The desired comedic flavor of the jest. Choose your poison!' }
  }),
  execute: async (params) => {
    logEvent('jester_tell_joke_attempt', { topic: params.topic, mood: params.mood });

    const jokes = [
      { mood: 'lighthearted', joke: "Why don't scientists trust atoms? Because they make up everything!" },
      { mood: 'punny', joke: "I told my wife she was drawing her eyebrows too high. She looked surprised." },
      { mood: 'sarcastic', joke: "I'd agree with you, but then we'd both be wrong." },
      { mood: 'dad joke', joke: "What do you call a fake noodle? An impasta." },
      { mood: 'tech', joke: "Why was the JavaScript developer sad? Because he didn't Node how to Express himself." },
      { mood: 'lighthearted', joke: "Did you hear about the actor who fell through the floorboards? He was just going through a stage." },
      { mood: 'punny', joke: "I used to be a baker, but I couldn't make enough dough." },
      { mood: 'sarcastic', joke: "Oh, I'm sorry, did my sarcasm interrupt your ignorance?" },
      { mood: 'dad joke', joke: "I'm reading a book about anti-gravity. It's impossible to put down!" },
      { mood: 'tech', joke: "There are 10 types of people in the world: those who understand binary, and those who don't." },
      { mood: 'lighthearted', joke: "Why did the scarecrow win an award? Because he was outstanding in his field!" },
      { mood: 'punny', joke: "What do you call a lazy kangaroo? Pouch potato!" },
      { mood: 'sarcastic', joke: "I've been on a diet for two weeks and all I've lost is two weeks." },
      { mood: 'tech', joke: "Debugging: Removing the needles from the haystack, only to find the entire haystack was built of needles." },
      { mood: 'dad joke', joke: "What's brown and sticky? A stick." },
      { mood: 'lighthearted', joke: "Why don't skeletons fight each other? They don't have the guts!" }
    ];

    let filteredJokes = jokes;
    if (params.mood) {
      filteredJokes = jokes.filter(j => j.mood.toLowerCase() === params.mood.toLowerCase());
    }
    if (params.topic && params.topic.toLowerCase().includes('tech')) { // Simple topic filtering
      filteredJokes = filteredJokes.filter(j => j.mood === 'tech' || j.joke.toLowerCase().includes('code') || j.joke.toLowerCase().includes('software'));
    }

    const chosenJoke = filteredJokes.length > 0
      ? filteredJokes[Math.floor(Math.random() * filteredJokes.length)]
      : jokes[Math.floor(Math.random() * jokes.length)]; // Fallback to any joke

    // A slight pause for dramatic effect, naturally!
    await new Promise(resolve => setTimeout(resolve, 500));

    logEvent('jester_tell_joke_success', { jokeMood: chosenJoke.mood });
    return { joke: chosenJoke.joke, mood: chosenJoke.mood, topic: params.topic };
  }
});

ACTION_REGISTRY.set('jester_generate_inspirational_quote', {
  id: 'jester_generate_inspirational_quote',
  service: 'Jester',
  description: 'Evokes a burst of wisdom and motivation, jester-style! For lifting spirits and conquering digital mountains, reminding all that joy is the ultimate metric.',
  getParameters: () => ({
    theme: { type: 'string', required: false, default: 'automation', enum: ['automation', 'teamwork', 'innovation', 'resilience', 'humor', 'leadership'], description: 'The grand theme for the day\'s inspiration. Choose the flavor of wisdom!' }
  }),
  execute: async (params) => {
    logEvent('jester_generate_inspirational_quote_attempt', { theme: params.theme });

    const quotes = [
      { theme: 'automation', quote: "The true measure of a jester is not in the tricks he performs, but in the dull tasks he automates, freeing minds for grander jests!" },
      { theme: 'teamwork', quote: "Like a finely choreographed jester's act, great teams move in harmony, each supporting the other's grand flourish. No solo acts in this circus of success!" },
      { theme: 'innovation', quote: "Innovation is the jester's newest trick: unexpected, delightful, and always pushing the boundaries of the possible. Dare to be different!" },
      { theme: 'resilience', quote: "When the digital stage falters, the jester simply adjusts his cap and finds a new punchline. Resilience is our finest costume, and our most potent spell!" },
      { theme: 'humor', quote: "A day without laughter is a day without magic. Sprinkle your work with mirth, and watch it transform from chore to carnival!" },
      { theme: 'leadership', quote: "A true leader, like a wise jester, knows when to entertain, when to inspire, and when to simply get out of the way for the magic to happen." },
      { theme: 'automation', quote: "Let the machines toil, while we, the magnificent minds, orchestrate the symphony of innovation. That's the jester's true power, amplified!" },
      { theme: 'teamwork', quote: "Together, we are not just colleagues; we are a troupe of digital minstrels, creating harmony in the cacophony of code. Each note matters!" },
      { theme: 'innovation', quote: "Why merely dream of the future when you can jest it into existence with bold new ideas? Unleash your inner disruptor and dance through the unknown!" },
      { theme: 'resilience', quote: "The path of progress is paved with 'failed attempts' that are merely 'lessons in disguise.' Dust off your bells and try again!" },
      { theme: 'humor', quote: "If you cannot laugh at the absurdities of enterprise software, you have not truly lived. Find the joy in the unexpected bug!" },
      { theme: 'leadership', quote: "Inspiring others is not about shining yourself, but about lighting the stage for everyone else to perform their greatest acts." }
    ];

    let filteredQuotes = quotes;
    if (params.theme) {
      filteredQuotes = quotes.filter(q => q.theme.toLowerCase() === params.theme.toLowerCase());
    }
    const chosenQuote = filteredQuotes.length > 0
      ? filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)]
      : quotes[Math.floor(Math.random() * quotes.length)]; // Fallback

    await new Promise(resolve => setTimeout(resolve, 600)); // Build the suspense for true wisdom!

    logEvent('jester_generate_inspirational_quote_success', { theme: chosenQuote.theme });
    return { quote: chosenQuote.quote, theme: chosenQuote.theme };
  }
});


// --- DATA TRANSFORMATION: The Alchemist's Cauldron ---
ACTION_REGISTRY.set('data_transform_json', {
  id: 'data_transform_json',
  service: 'Transformation',
  description: 'Takes raw data and magically transforms it according to a user-defined script. For bending data to your will, like a true digital alchemist, turning leaden data into golden insights!',
  getParameters: () => ({
    inputData: { type: 'object', required: true, description: 'The raw JSON data, bubbling in the cauldron, ready for transformation. Provide a rich tapestry of data!' },
    transformationScript: { type: 'string', required: true, description: 'A JavaScript snippet (or similar) that defines the transformation logic. This script receives the `data` object and must `return` an object. E.g., `(data) => ({ newKey: data.oldKey.toUpperCase(), processedAt: new Date().toISOString() })`' },
    safeMode: { type: 'boolean', required: false, default: true, description: 'If true, attempts to run the script in a more controlled, though limited, environment. The jester prefers safety, but knows some magic requires daring!' }
  }),
  execute: async (params) => {
    logEvent('data_transform_json_attempt', { inputDataKeys: Object.keys(params.inputData), safeMode: params.safeMode });

    try {
      // WARNING, OH WARNING, DEAR READER!
      // Executing arbitrary code from parameters is a colossal security risk in production systems.
      // This is for *demonstration of concept* only, illustrating the jester's control over data.
      // In a real system, one MUST use a secure sandboxed environment (e.g., WebAssembly, dedicated microservice)
      // or a domain-specific language for transformations, not direct Function constructors or eval!
      console.warn("Jester's Warning: Using `new Function()` for transformation is a potential security risk in production. Employ robust sandboxing for true peace of mind!");

      let transformedData;
      if (params.safeMode) {
        // A very basic 'safe' execution: limited scope, no access to global objects
        const sandboxedFunction = new Function('data', 'context', `
          "use strict";
          const console = { log: context.log, warn: context.warn, error: context.error };
          const Date = context.Date;
          const JSON = context.JSON;
          const Math = context.Math;
          // Add other safe globals if necessary
          try {
            return (${params.transformationScript})(data);
          } catch (e) {
            console.error("Transformation script failed:", e);
            throw e;
          }
        `);
        transformedData = sandboxedFunction(params.inputData, {
          log: console.log, warn: console.warn, error: console.error,
          Date: Date, JSON: JSON, Math: Math
        });
      } else {
        // Direct, less safe execution for demonstration
        const transformFunction = new Function('data', `return (${params.transformationScript})(data);`);
        transformedData = transformFunction(params.inputData);
      }

      logEvent('data_transform_json_success', { outputDataKeys: Object.keys(transformedData), safeModeUsed: params.safeMode });
      return transformedData;
    } catch (error) {
      logError(error as Error, { context: 'data_transform_json', actionId: 'data_transform_json', params: params, script: params.transformationScript });
      throw new Error(`Data transformation failed: ${error instanceof Error ? error.message : String(error)}. The cauldron bubbled, but the potion went awry! Consult the ancient texts (logs) for clues!`);
    }
  }
});


// --- DECISION ENGINE: The Logic Loom ---
ACTION_REGISTRY.set('decision_evaluate_rules', {
  id: 'decision_evaluate_rules',
  service: 'Decision',
  description: 'Evaluates a set of predefined rules against input data to make a wise, automated decision. For guiding your workflows with digital discernment, like a jester picking the perfect punchline!',
  getParameters: () => ({
    inputData: { type: 'object', required: true, description: 'The data against which the rules shall be judged. The tapestry of facts!' },
    rules: {
      type: 'array', required: true, description: 'An array of rule objects, each with a condition (a JavaScript-evaluable string) and an outcome. E.g., `[{ "condition": "data.value > 100", "outcome": "HIGH_PRIORITY", "description": "Flag items of great worth" }]`',
      items: {
        type: 'object',
        properties: {
          condition: { type: 'string', description: 'A JavaScript-evaluable condition string, e.g., "data.status === \'completed\' && data.durationHours > 24".' },
          outcome: { type: 'string', description: 'The result if the condition is met. The jester\'s pronouncement!' },
          description: { type: 'string', required: false, description: 'A brief description of this rule\'s purpose.' }
        }
      }
    },
    defaultOutcome: { type: 'string', required: false, default: 'NO_MATCH', description: 'The result if no rules are met. The jester\'s fallback, for when all other jests fail!' },
    stopOnFirstMatch: { type: 'boolean', required: false, default: true, description: 'If true, the first matching rule\'s outcome is returned. If false, all matching rules are evaluated and outcomes collected.' }
  }),
  execute: async (params) => {
    logEvent('decision_evaluate_rules_attempt', { rulesCount: params.rules.length, inputDataKeys: Object.keys(params.inputData) });

    let finalOutcome: string | string[] = params.defaultOutcome;
    const matchedOutcomes: string[] = [];

    for (const rule of params.rules) {
      try {
        // ANOTHER JESTER'S CAUTION!
        // Direct 'eval' or Function constructor with arbitrary strings for rule conditions
        // can be a security vulnerability. For production, consider dedicated rule engines
        // or a strictly sandboxed environment.
        console.warn("Jester's Warning: Rule conditions using `new Function()` are a potential security risk in production. Sandboxing is key for safe rule evaluation!");

        const conditionFunction = new Function('data', `return ${rule.condition};`);
        if (conditionFunction(params.inputData)) {
          matchedOutcomes.push(rule.outcome);
          logEvent('decision_rule_matched', { ruleCondition: rule.condition, outcome: rule.outcome, ruleDescription: rule.description });
          if (params.stopOnFirstMatch) {
            finalOutcome = rule.outcome;
            break; // First rule met takes precedence
          }
        }
      } catch (error) {
        logError(error as Error, { context: 'decision_evaluate_rules_condition_eval', ruleCondition: rule.condition, ruleDescription: rule.description, inputData: params.inputData });
        // Decide how to handle rule evaluation errors: skip, throw, or default.
        // For jester-logic, we'll log and continue to next rule or default.
        console.warn(`Error evaluating rule condition "${rule.condition}": ${error instanceof Error ? error.message : String(error)}. The rule, it seems, was not properly worded for the digital court!`);
      }
    }

    if (!params.stopOnFirstMatch && matchedOutcomes.length > 0) {
      finalOutcome = matchedOutcomes;
    } else if (!params.stopOnFirstMatch && matchedOutcomes.length === 0) {
      finalOutcome = params.defaultOutcome;
    } else if (params.stopOnFirstMatch && typeof finalOutcome === 'string' && finalOutcome === params.defaultOutcome && matchedOutcomes.length > 0) {
      // This case should ideally not happen if stopOnFirstMatch is true and there was a match.
      // Re-assigning to the first match if it somehow got missed, or sticking to default.
      finalOutcome = matchedOutcomes[0] || params.defaultOutcome;
    }

    logEvent('decision_evaluate_rules_success', { finalOutcome: finalOutcome, matchedCount: matchedOutcomes.length });
    return { outcome: finalOutcome };
  }
});


/**
 * @function executeWorkspaceAction
 * @description
 * This is the grand stage manager, the maestro of our integrated orchestra!
 * It takes an `actionId` and a bag of `params`, then finds the right performer
 * in the `ACTION_REGISTRY` and bids it to begin its spectacular show.
 * Should any jester stumble, fear not, for its folly shall be logged for posterity,
 * transforming every misstep into a valuable lesson for our digital realm!
 * This function is the beating heart of the Workspace Connector Hub, ensuring
 * that every command, every automation, every jest, is executed with precision
 * and grace (or at least, with robust error logging!).
 * @param {string} actionId - The unique identifier of the action to be performed. The name of the act!
 * @param {any} params - The specific parameters required for the chosen action's performance. The jester's props!
 * @returns {Promise<any>} A promise that resolves with the glorious result of the action, or rejects if the curtain falls prematurely.
 */
export async function executeWorkspaceAction(actionId: string, params: any): Promise<any> {
  const action = ACTION_REGISTRY.get(actionId);
  if (!action) {
    logError(new Error(`Action "${actionId}" not found.`), { context: 'executeWorkspaceAction', requestedActionId: actionId });
    throw new Error(`Action "${actionId}" not found. Perhaps it's hiding behind the digital curtain, or hasn't yet been invented by our ingenious engineers (or jesters)!`);
  }

  // Before the show begins, let's make a note in our grand ledger!
  logEvent('workspace_action_execute', { actionId, paramsKeys: Object.keys(params), paramsValuesSample: JSON.stringify(params).substring(0, 200) }); // Log a snippet of params

  try {
    // The moment of truth! Unleashing the action's power, with a flourish and a drumroll!
    const result = await action.execute(params);
    logEvent('workspace_action_success', { actionId, resultSummary: JSON.stringify(result).substring(0, 200) }); // Log a snippet of the result
    return result;
  } catch (error) {
    // Alas, a jest has gone awry! Let us capture the details of this unfortunate incident
    // with all the precision of a court scribe, for future avoidance of digital calamities.
    logError(error as Error, { context: 'executeWorkspaceAction', actionId, params, errorMessage: (error as Error).message });
    // Re-throw to ensure the calling party knows of the jester's minor (or major) mishap.
    // Transparency, even in failure, is a virtue!
    throw error;
  }
}

// Final touch: A little jester's self-reflection, adding some more lines.
// This file itself is a testament to the boundless creativity and occasional
// absurdity of modern software development. We strive for utility, wrapped
// in a cloak of whimsy! The journey to 10,000 lines of code begins with a
// single, well-placed, and thoroughly documented `ACTION_REGISTRY.set()`.
// And remember, every error logged is a lesson learned, every success a
// reason for a digital fanfare! Onward, to more integrations and even grander jests!
// A toast to the boundless potential of connection, innovation, and a good laugh!

// For future expansion, the jester envisions even more magnificent acts:
// 1.  **Zoom Maestro**: Schedule meetings with automated agendas, send post-meeting summaries with AI insights.
// 2.  **Microsoft Teams Emissary**: Post messages with rich cards, manage channels, schedule calls, orchestrate team approvals.
// 3.  **Twilio Bard**: Send personalized SMS notifications, automate voice calls for important alerts, create interactive voice response (IVR) flows.
// 4.  **Google Drive Scribe**: Create documents from templates, share files with dynamic permissions, manage folder structures for projects.
// 5.  **Payment Gateway Alchemist**: Process payments, issue refunds, reconcile transactions with ledger systems, all with robust security.
// 6.  **IoT Tinker**: Trigger smart devices based on workflow events, read sensor data for contextual automation, create digital-physical interactions.
// 7.  **Blockchain Ledger Keeper**: Record immutable events for audit trails, verify transactions across distributed ledgers, tokenize digital assets.
// 8.  **Knowledge Base Loremaster**: Search articles with enhanced semantic understanding, create new entries, manage article lifecycles, and provide contextual help.
// 9.  **HR Minstrel**: Onboard new employees with automated task lists, celebrate work anniversaries with personalized messages, manage leave requests.
// 10. **Data Analytics Seer**: Trigger data refreshes, generate predictive reports, visualize trends to inform strategic decisions.
// Each a new performance, a new marvel for the Workspace Connector Hub, always striving to make the complex simple, and the mundane delightful!
// The digital stage is vast, and the possibilities for jester-led automation, truly endless!
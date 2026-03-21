CREATE DATABASE advanced_github_notif;
USE advanced_github_notif;

CREATE TABLE users (
    id integer PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(39) NOT NULL,
    email TEXT,
    browserNotifPushURL TEXT,
    slackWebhookURL TEXT,
    discordWebhookURL TEXT,
    encryptedPAT TEXT,
    created TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE subscriptions (
    id integer PRIMARY KEY AUTO_INCREMENT,
    subscriber integer NOT NULL, -- id of user
    username TEXT NOT NULL,
    repo TEXT NOT NULL,
    latestCommitSha TEXT,
    latestEventTime DATETIME DEFAULT '1900-01-01 00:00:00', -- used to not parse githubevents that have already been parsed but are currently being polled on
    FOREIGN KEY (subscriber) REFERENCES users(id)
);


CREATE TABLE events_subscriptions (
    id integer PRIMARY KEY AUTO_INCREMENT,
    subscriptionRef integer, -- id foreign key subscriptions
    eventType VARCHAR(39) NOT NULL, -- desired event type

    -- Global Filters
    actionMade TEXT, -- desired action type
    actorUsername TEXT, -- desired actor username
    booleanQuery JSON, -- master boolean query which synthesises 0 or more of the fields events_subscriptions with boolean conditions
    targetAuthorUsername TEXT,
    targetCommiterUsername TEXT,
    authorAssociation TEXT, -- sent in issues,PR's, comments (OWNER, COLLABORATOR, CONTRIBUTOR, FIRST_TIME_CONTRIBUTOR)
    eventTime DATETIME DEFAULT '2099-01-01 00:00:00',
    -- Push / Commit Filters
    pusherType VARCHAR(20),
    minCommitCount INTEGER,
    maxCommitCount INTEGER,
    commitMsgSubstring TEXT,
    gitDiffPatchPrompt TEXT,
    gitDiffSize INTEGER,
    fileChanged TEXT,
    isForcePush BOOLEAN,


    -- Branch / Tag Filters
    sourceBranch TEXT,            
    targetBranch VARCHAR(255),       
    refType VARCHAR(20),

    -- Pull Request Filters
    pullRequestTitleContains TEXT,
    pullRequestBodyContains TEXT,
    pullRequestIsDraft BOOLEAN,
    requestedReviewerUsername TEXT,
    reviewCommentBodyContains TEXT,
    reviewState VARCHAR(30),
    isMerged BOOLEAN,
    pullRequestAdditions INTEGER,
    pullRequestDeletions INTEGER,
    requestedTeamName TEXT,

    -- Issue Filters
    issueTitleContains TEXT,
    issueBodyContains TEXT,
    issueCommentBodyContains TEXT,
   

    -- Shared Issue & PR Filters
    assigneeUsername TEXT,
    hasLabel VARCHAR(255),
    milestoneTitle TEXT,
    stateIssuePR TEXT -- open/closed
    -- Commit Comment Filters
    commitCommentBodyContains TEXT,
    
    -- Release
    isPreRelease BOOLEAN,
    releaseTagSubstring TEXT,
    releaseNameContains TEXT,
    releaseBodyContains TEXT,

    -- Gollum/Wiki
    wikiPageTitle TEXT,
    wikiPageAction VARCHAR(20),

    -- MemberEvent
    addedMemberUsername TEXT,

    -- ForkEvent
    forkOwnerUsername TEXT,

    -- DiscussionEvent
    discussionTitleContains TEXT,
    discussionBodyContains TEXT,
    discussionCategory TEXT,

    FOREIGN KEY (subscriptionRef) REFERENCES subscriptions(id) ON DELETE SET NULL
);


CREATE TABLE notifs_events_subscriptions (
    id integer PRIMARY KEY AUTO_INCREMENT,
    subscriberId integer,
    eventId integer,
    subscriptionId integer,
    notif TEXT, 
    FOREIGN KEY (subscriberId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (eventId) REFERENCES events_subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id) ON DELETE SET NULL
);
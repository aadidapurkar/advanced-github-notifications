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
    subscriptionRef integer, -- id of subsription
    eventType VARCHAR(39) NOT NULL,

    -- Global Filters
    actionMade TEXT,
    actorUsername TEXT, -- ignore
    booleanQuery JSON,
    targetAuthorUsername TEXT,
    targetCommiterUsername TEXT,

    -- Push / Commit Filters
    pusherType VARCHAR(20),
    minCommitCount INTEGER,
    maxCommitCount INTEGER
    commitMsgSubstring TEXT,
    gitDiffPatchPrompt TEXT,
    gitDiffSize INTEGER,
    fileChanged TEXT,


    -- Branch / Tag Filters
    sourceBranch TEXT,            
    targetBranch VARCHAR(255),       
    refType VARCHAR(20),              
    branchCreated BOOLEAN,
    branchDeleted BOOLEAN,

    -- Issue / PR Filters
    requestedReviewerUsername TEXT,
    pullRequestIsDraft BOOLEAN,
    assigneeUsername TEXT,
    pullRequestTitleContains TEXT,
    pullRequestBodyContains TEXT,
    issueBodyContains TEXT,
    issueTitleContains TEXT,
    issueCommentBodyContains TEXT,
    commitCommentBodyContains TEXT,
    reviewCommentBodyContains TEXT
    hasLabel VARCHAR(255),           
    isMerged BOOLEAN,               
    reviewState VARCHAR(30),  
    
    -- Release
    isPreRelease BOOLEAN,
    releaseTagSubstring TEXT,
    releaseNameContains TEXT,
    releaseBodyContains TEXT

    -- Gollum/Wiki
    wikiPageTitle TEXT,
    wikiPageName TEXT,
    wikiPageAction VARCHAR(20),

    -- MemberEvent
    addedMemberUsername TEXT,

    -- ForkEvent
    isFork BOOLEAN,
    forkOwnerUsername TEXT,

    -- DiscussionEvent
    discussionTitleContains TEXT,
    discussionBodyContains TEXT,
    discussionCategory TEXT

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
CREATE DATABASE advanced_github_notif;
USE advanced_github_notif;

CREATE TABLE users (
    id integer PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(39) NOT NULL,
    email TEXT,
    browserNotifPushURL TEXT,
    encryptedPAT TEXT,
    created TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE subscriptions (
    id integer PRIMARY KEY AUTO_INCREMENT,
    subscriber integer NOT NULL,
    username TEXT NOT NULL,
    repo TEXT NOT NULL,
    latestCommitSha TEXT,
    latestEventTime DATETIME DEFAULT '1900-01-01 00:00:00',
    FOREIGN KEY (subscriber) REFERENCES users(id)
);


CREATE TABLE events_subscriptions (
    id integer PRIMARY KEY AUTO_INCREMENT,
    subscriptionRef integer,
    eventType VARCHAR(39) NOT NULL,
    commitMsgSubstring TEXT,
    issueCommentContains TEXT,
    gitDiffPatchPrompt TEXT,
    gitDiffSize INTEGER,
    particularBranch TEXT, 
    fileChanged TEXT,
    booleanQuery JSON,
    FOREIGN KEY (subscriptionRef) REFERENCES subscriptions(id) ON DELETE SET NULL
);


CREATE TABLE notifs_events_subscriptions (
    id integer PRIMARY KEY AUTO_INCREMENT,
    subscriberId integer,
    eventId integer,
    notif TEXT,
    FOREIGN KEY (subscriberId) REFERENCES subscriptions(id) ON DELETE SET NULL;
    FOREIGN KEY (eventId) REFERENCES events_subscriptions(id) ON DELETE SET NULL;
);
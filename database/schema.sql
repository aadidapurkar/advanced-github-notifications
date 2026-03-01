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
    etag TEXT,
    latestCommitSha TEXT,
    FOREIGN KEY (subscriber) REFERENCES users(id)
);

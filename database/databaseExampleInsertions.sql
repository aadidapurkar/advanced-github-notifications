INSERT INTO USERS(username, email, browserNotifPushURL, discordWebhookURL, encryptedPAT) VALUES (
    "aadidapurkar",
    "aadidapurkar04@gmail.com",
    "http://browsernotifpushurl.testdomain",
    "http://discordpushurl.test.domain",
    "38c30a42a13f13dd114c733296bea1ef:4c96100a247b2148e7087ebf6e6271f88058132aca7c6bfe42ee4b92c36ec7f5ca0865ffa4b352be0a5a1be0402a5249"
);

INSERT INTO USERS(username, email, browserNotifPushURL, discordWebhookURL, encryptedPAT) VALUES (
    "user2",
    "user2@gmail.com",
    "http://browsernotifpushurl.testdomain",
    "http://discordpushurl.test.domain",
    "38c30a42a13f13dd114c733296bea1ef:4c96100a247b2148e7087ebf6e6271f88058132aca7c6bfe42ee4b92c36ec7f5ca0865ffa4b352be0a5a1be0402a5249"
);

INSERT INTO SUBSCRIPTIONS (subscriber, username, repo) VALUES 
    (1, "aadidapurkar", "test-notif"),
    (1, "aadidapurkar", "lockin"),
    (1, "microsoft", "vscode"),
    (2, "aadidapurkar", "test-notif");

INSERT INTO EVENTS_SUBSCRIPTIONS (subscriptionRef, eventType) VALUES 
        (1, "CreateEvent"),
        (1, "ReleaseEvent"),
        (1, "IssuesEvent"),
        (1, "PushEvent"),

        (2, "CreateEvent"),
        (2, "ReleaseEvent"),
        (2, "IssuesEvent"),

        (3, "CreateEvent"),
        (3, "ReleaseEvent"),
        (3, "IssuesEvent"),
        (3, "GollumEvent"),
        (3, "ReleaseEvent"),
        (3, "IssuesEvent"),
        (3, "PushEvent");

INSERT INTO NOTIFS_EVENTS_SUBSCRIPTIONS (notif) VALUES
("Hello"),
("Test"),
("Notif");
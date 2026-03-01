# Advanced Github Notifications
Tries to give people the ability to get highly customised/specific/granular Github notifications.

### Prereqs
- Node.js, mySQL
- `npm i`
- configure environment variables with a .env file `TOKEN, PORT, POLLING_RATE, DB_ENCRYPTION_KEY, MYSQL_HOST, MYSQL_USER, MYSQL_PASS, MYSQL_DB`
- note, `TOKEN` in env refers to Github PAT for Octokit testing, DB_ENCRYPTION should be 32 randomly generated alphanumeric chars 
- run `database/schema.sql` to initialise DB


### Code Structure
- `database` defines database schema, has crud functions
- `encryption` use a 32char key to encrypt/decrypt a string (useful for storing Personal Access Token PAT for Github in DB)
- `server` main server, makes requests to github, cruds database, sends notifs to users
- `github-rest-api` octokit functions which get github rest api data
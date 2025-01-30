# Reserve GH PR number

Use Node 23.6.0 or later.

This script will poll for issues in a GitHub repository and create a draft PR when the next issue number is reached.

Either pass in GITHUB_TOKEN environment variable, or have `gh auth token` available in your shell.

Set the following environment variables, or create a .env file and use `node --env-file=.env run.ts`

```env
PR_BRANCH=from-branch
PR_TITLE=Title of the PR
PR_BODY=Body of the PR
DRAFT_PR=false

DISCORD_WEBHOOK_URL=optional discord webhook url

OWNER=Github repo owner (e.g. joshhunt)
REPO=Github repo name (e.g. my-website)
TARGET=Target PR number (e.g. 8)
```

import { execSync } from "node:child_process";
import { Octokit } from "octokit";
import { setTimeout } from "node:timers/promises";

const OWNER = process.env.OWNER;
const REPO = process.env.REPO;

const PR_BRANCH = process.env.PR_BRANCH;
const PR_TITLE = process.env.PR_TITLE;
const PR_BODY = process.env.PR_BODY;

const TARGET = process.env.TARGET ? parseInt(process.env.TARGET) : 100_000;

const TEN_SECONDS = 10 * 1000;
const POLL_INTERVAL = process.env.POLL_INTERVAL
  ? parseInt(process.env.POLL_INTERVAL)
  : TEN_SECONDS;

if (!OWNER || !REPO || !TARGET || !PR_BRANCH || !PR_TITLE || !PR_BODY) {
  throw new Error("Missing environment variables");
}

function getGithubToken() {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  const token = execSync("gh auth token").toString().trim();
  return token;
}

let lastIssueNumber = 0;

while (true) {
  log("Polling for issues");

  const octokit = new Octokit({
    auth: getGithubToken(),
    log: {
      debug: log,
      info: log,
      warn: log,
      error: log,
    },
  });

  const { data: issues } = await octokit.rest.issues.listForRepo({
    owner: OWNER,
    repo: REPO,
    per_page: 3,
    sort: "created",
    direction: "desc",
    state: "all",
  });

  const highestNumber = issues.reduce((max, issue) => {
    return Math.max(max, issue.number);
  }, 0);

  const nextNumber = highestNumber + 1;
  const shouldCreatePR = nextNumber === TARGET;

  if (highestNumber !== lastIssueNumber) {
    log("Latest issue number", highestNumber);

    sendDiscordMessage(
      `Latest issue number ${highestNumber} ${issues[0]?.html_url}`
    );
    lastIssueNumber = highestNumber;
  }

  if (shouldCreatePR) {
    log("Creating PR!");

    sendDiscordMessage(`Next issue number ${nextNumber}, creating PR`);

    const { data: pr } = await octokit.rest.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: PR_TITLE,
      body: PR_BODY,
      head: PR_BRANCH,
      base: "main",
      draft: process.env.DRAFT_PR === "true",
    });

    log("PR created:", pr.html_url);
    sendDiscordMessage(`PR created: ${pr.html_url}`);
    break;
  }

  await setTimeout(POLL_INTERVAL);
}

function log(...args: any[]) {
  const now = new Date().toISOString();
  console.log(`[${now}]`, ...args);
}

async function sendDiscordMessage(message: string) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    log({ webhookUrl });

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
        }),
      });
    }
  } catch (error) {
    log("Error sending discord message");
  }
}

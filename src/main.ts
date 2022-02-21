import * as core from '@actions/core';
import * as github from '@actions/github';
import fetch from 'node-fetch';

async function run() {
  try {
    const
      githubToken = core.getInput('github-token', { required: true }),
      atlassianToken = core.getInput('atlassian-token', { required: true }),
      titleRegex = new RegExp(core.getInput('title-regex', { required: true }),
        core.getInput('title-regex-flags') || 'g'),
      title = github.context!.payload!.pull_request!.title,
      body = github.context!.payload!.pull_request!.body ?? "";

    core.info(`Checking "${titleRegex.source}" with "${titleRegex.flags}" flags against the PR title: "${title}"`);
    let match = titleRegex.exec(title)
    if (!match) {
      core.setFailed("The PR title/body is missing a JIRA ticket");
      return;
    }

    const ticket = match.groups!['ticket'];
    const response = await fetch(`https://your-domain.atlassian.net/rest/api/3/issue/{${ticket}}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(atlassianToken).toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    if (response.status != 200) {
      core.setFailed(`Unknown JIRA ticket: ${ticket}`);
    }

    const client: github.GitHub = new github.GitHub(githubToken);
    const pr = github.context.issue;

    const newBody = body?.replace(ticket, `https://talon-sec.atlassian.net/browse/${ticket}`);
    client.pulls.update({
      owner: pr.owner,
      repo: pr.repo,
      pull_number: pr.number,
      body: newBody
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    const
      titleRegex = new RegExp(core.getInput('title-regex', { required: true }),
                              core.getInput('title-regex-flags') || 'g'),
      bodyRegex = new RegExp(core.getInput('body-regex', { required: true }),
                             core.getInput('body-regex-flags') || 'g'),
      errorMessage = core.getInput('error-message') || `Please fix your PR title to match "${titleRegex.source}" with "${titleRegex.flags}"`,
      title = github.context!.payload!.pull_request!.title,
      body = github.context!.payload!.pull_request!.body?;

    core.info(`Checking "${titleRegex.source}" with "${titleRegex.flags}" flags against the PR title: "${title}"`);
    core.info(`Checking "${bodyRegex.source}" with "${bodyRegex.flags}" flags against the PR body: "${body}"`);
    let match = titleRegex.exec(title) || bodyRegex.exec(body)
    if (match == null) {
      core.setFailed(errorMessage);
      return;
    }

    const client: github.GitHub = new github.GitHub(core.getInput('github-token'));
    const pr = github.context.issue;

    const ticket  = match.groups['ticket'];
    const newBody = body.replace(ticket, `https://talon-sec.atlassian.net/browse/${ticket}`);

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

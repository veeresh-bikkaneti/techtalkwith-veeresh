You are helping me lock down my GitHub repositories. I am already signed in to GitHub in this browser as `veeresh-bikkaneti`. Work in a NEW tab.

## Goal
On every repository I own, create a branch ruleset named `protect-default-branch` so that nothing reaches the default branch without a pull request, and my review is required.

## Which repos
1. Open https://github.com/veeresh-bikkaneti?tab=repositories&type=source (this shows only non-fork repos I own).
2. Skip forks, archived repos, and repos I don't own. List what you skip and why at the end.
3. Do the repos one at a time, in the order shown.

## Ruleset settings (same for every repo)
Go to `https://github.com/veeresh-bikkaneti/<repo>/settings/rules/new?target=branch` and set:
- Ruleset name: `protect-default-branch`
- Enforcement status: **Active**
- Bypass list: add ONLY the role **Repository admin** (that is me, the owner), with bypass mode **For pull requests only**. Do NOT add any GitHub App, bot, deploy key, Copilot, or other role.
- Target branches: Add target, then **Include default branch**
- Branch rules, turn ON:
  - Restrict deletions
  - Block force pushes
  - Require a pull request before merging
    - Required approvals: **0** (I am the only maintainer and GitHub will not let me approve my own PRs)
    - Require review from Code Owners: **ON**
    - Require conversation resolution before merging: **ON**
- Do NOT turn on required status checks, signed commits, linear history, or merge queue unless the repo already has one of these configured.
- Click **Create**.

## Also, per repo: turn off auto-merge
Go to `https://github.com/veeresh-bikkaneti/<repo>/settings`, scroll to **Pull Requests**, and UNCHECK **Allow auto-merge** (leave the other boxes as they are). Click Save if a button appears. This stops anyone or any bot from auto-merging.

## Before creating, for each repo
- If a ruleset or classic branch protection rule already exists for the default branch, DO NOT overwrite or delete it. Skip that repo and report what is already there.
- If the page says rulesets are unavailable (private repos on a free plan), skip it and mark it "needs GitHub Pro or make public". Do not try to upgrade or pay for anything.
- If the repo has no commits / no default branch yet, skip it.

## Hard limits
- Change nothing except creating this one ruleset and unchecking Allow auto-merge, per repo. No other settings, no deleting anything, no pushing code.
- Stop and ask me if you hit a password prompt, 2FA, a sudo-mode re-auth, a payment screen, or anything you did not expect. Do not enter credentials.
- If a page looks different from what I described, stop and tell me instead of guessing.

## Report at the end
A table with columns: repo | result (created / already protected / skipped) | reason. Then list anything I need to do by hand.

## Start with one repo
Do `techtalkwith-veeresh` first, show me the final ruleset page, and wait for me to say "continue" before doing the rest.

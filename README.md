# GitHub Repo Analyzer

A small Node.js command-line tool that loads the public repositories for a GitHub organization, keeps the ones that meet a star threshold, and summarizes them by language.

## Requirements

- Node.js 22 or newer (`fetch` and direct TypeScript execution)

## Setup

```powershell
npm install
```

## Usage

```powershell
npm run run
```

The program asks two questions:

1. The organization name, such as `microsoft`
2. The minimum star count

A repository is included when its star count is greater than or equal to that number.

It then prints two results:

- The matching repositories, each with `id`, `name`, `stars`, `forks`, and `language`
- A JSON summary per language: how many repositories use it, their total stars, and their average stars

Repositories whose language is `null` are left out of the language summary.

Public repositories are requested from `GET /orgs/{org}/repos` in pages of 100. Further pages are requested while the response `Link` header contains `rel="next"`.

## Errors

| Situation | What you see |
| --- | --- |
| The organization does not exist (HTTP 404) | `Organization could not be found` |
| GitHub rate limit (HTTP 403 or 429) | `Rate limit has been hit`, including the status code |
| Any other failed response | `HTTP error! Status: <code>` |

Unauthenticated requests share a limit of 60 per hour for your IP address. A large organization uses one request per page, so a full run can spend that quota. This tool does not send a token. Wait for the limit to reset before running it again.

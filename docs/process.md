# How WagaShelf is built

WagaShelf follows **Scrum**, an agile framework, adapted for a solo developer working with an AI
assistant. This page describes the roles, the weekly rhythm, where work is tracked and what
"done" means.

## Why agile

The [Agile Manifesto](https://agilemanifesto.org) values working software, collaboration with
users and responding to change over big up-front plans. For WagaShelf that means: ship small
improvements often, put them in front of real users, and let their feedback decide what comes
next. Documentation is kept to what someone actually reads (see [Documentation](#documentation)).

## Roles

| Scrum role | WagaShelf |
|---|---|
| **Product Owner** | Obi: decides what is built and in what order, and accepts finished work |
| **Developers** | Obi, with Claude as an assistant (investigates, proposes, explains and drafts changes) |
| **Stakeholders** | WagaShelf's users (friends, people at Night Shift) and experienced mentors |

## The weekly sprint

Sprints are **one week long, Sunday to Saturday**. Shorter sprints fit around university
deadlines and give quicker feedback.

| Event | When | What happens | Time |
|---|---|---|---|
| **Sprint planning** | Sunday | Pick items from the top of the backlog and set **one sprint goal** | 15 min |
| **Stand-up** | start of each work session | Done since last time / doing today / anything blocking | 2 min |
| **Sprint review** | Saturday | Use the live app; demo the week's changes to a user if possible; record feedback | 15 min |
| **Retrospective** | after the review | What went well / what didn't / one thing to change next sprint | 10 min |

Each sprint has a file in [`sprints/`](sprints/) with its goal, plan, review and retrospective.

## Where work is tracked

**The backlog lives on the GitHub Projects board "WagaShelf"**, not in a document, so it can be
reordered easily.

| Column | Contents |
|---|---|
| **Backlog** | Everything still to come (features, design changes, bugs, technical work), most important first |
| **This Sprint** | Items committed to for the current sprint |
| **In Progress** | What is being worked on now (one or two items at a time) |
| **Done** | Finished items (moved automatically when an issue closes or a PR merges) |

New ideas, bugs and user feedback always go into the **Backlog** first, then get prioritised.
Only urgent problems (like the live site being down) skip the queue.

Every item is a GitHub issue, written with the templates in `.github/ISSUE_TEMPLATE/`:
- **User stories:** *As a [user], I want [goal], so that [reason]*, plus acceptance criteria
- **Bug reports:** what you did, what happened, what you expected, where

## From issue to live site

```
Issue → branch → change → test locally → push → pull request → CI → merge → deploy
```

1. **Issue** on the board, moved to **In Progress**.
2. **Branch** from `main`, named `<issue number>-<short-description>` (e.g. `24-fix-navigation-covering-screen-on-pwa`).
3. **Investigate first**, then propose a plan and explain the trade-offs before changing code.
4. **Test locally** with both servers running, and click through what changed. Then run
   `pytest -v` (backend) and `npm run lint` and `npm run build` (frontend).
5. **Push and open a pull request** using the PR template, with `Closes #<issue>`.
6. **CI** runs the backend tests and the frontend lint and build. `main` is protected: changes
   only arrive through pull requests with passing CI.
7. **Merge.** The frontend deploys to GitHub Pages automatically; Render redeploys the backend.
8. **Check the live site.** The issue closes and its card moves to **Done**.

## Definition of Done

An item is **Done** when:
- it works on the live site, and nothing else broke;
- it was tested locally before pushing, and tests and CI pass;
- errors are handled with clear messages;
- documentation affected by the change is updated in the same pull request;
- it follows the approved design, with a decision record if a significant decision was made;
- **Obi understands it and can explain how it works.**

## Documentation

| Document | Purpose |
|---|---|
| [`product-planning.md`](product-planning.md) | Vision, principles, scope and focus: **why** and **for whom** |
| [`architecture.md`](architecture.md) | How the system works: diagrams, data model, API |
| [`decisions/`](decisions/) | Architecture Decision Records: why each significant choice was made |
| [`deployment.md`](deployment.md) | Running locally and deploying |
| [`sprints/`](sprints/) | Each sprint's goal, plan, review and retrospective |
| This page | How the work is organised |

Documentation is updated **in the same pull request** as the change it describes, so it never
falls behind the code.

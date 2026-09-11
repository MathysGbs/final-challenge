# Branching strategy

`main` is the only long-lived branch. It is protected: nobody pushes to it
directly, every change lands through a pull request that references an issue,
has been approved by another team member and has green checks.

```text
main
 ├── feature/<short-name>   new user-facing behaviour           (label: feature)
 ├── fix/<short-name>       bug fixes, with a regression test    (label: bug)
 ├── chore/<short-name>     tooling, config, Docker, dependencies (label: technical-debt, docker)
 ├── ci/<short-name>        GitHub Actions workflows             (label: ci, security)
 └── docs/<short-name>      documentation only                   (label: documentation)
```

Examples from this repository: `feature/filtering-search`,
`feature/validation`, `chore/dockerfile`, `ci/docker-publish`,
`ci/trivy-scan`, `docs/readme-final`.

## Lifecycle of a change

1. **Issue first.** Open it from a template (feature request, bug report) with
   acceptance criteria and the matching label. One issue = one change.
2. **Branch from `main`**, named after its purpose (see above). Start from an
   up-to-date `main`: `git fetch origin && git checkout -b feature/x origin/main`.
3. **Commit in small, meaningful steps.** Messages are imperative and say what
   the change does: `Add task status validation`, `Reject empty status in task
   validation`, `Gate image publication on a Trivy scan`. Not `update`, `fix`,
   `final`.
4. **Open a pull request** with the template: what and why, the linked issue
   (`Fixes #n`), the type of change, how it was tested.
5. **Review by another team member**, with at least one technical remark
   (an edge case, a missing test, a naming problem). "LGTM" alone is not a
   review. The author addresses the feedback before merging.
6. **Merge when the checks are green**, with a **merge commit** (squash and
   rebase are disabled so that stacked branches stay mergeable). Delete the
   branch afterwards.

## Stacked branches

When a change depends on another one that is still under review, base the
branch on that branch and open the PR against it. Merge from the bottom of
the stack up: GitHub retargets each PR to `main` when its base branch is
merged and deleted. Merging a stacked PR into its base branch instead of
`main` leaves its content stranded — it happened once here (#10), which is
why #13 exists.

## Releases

Releases are cut from `main` by pushing an annotated tag `vX.Y.Z` (semantic
versioning). The tag triggers the image publication with the matching version
tags; the GitHub Release is then created from the tag with the changelog
section as notes. See the README, section *Release process*.

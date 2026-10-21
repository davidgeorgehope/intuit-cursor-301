---
cron: "0 13 * * 1-5"
---

Morning triage (13:00 UTC is 9 AM Eastern in summer time). List the open pull requests in the watched repos that have a failed check from the last 24 hours. For each one, name the failing check and, if it is a legacy CSS token, the token and its replacement. Do not push code.

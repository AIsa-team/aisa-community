# AIsa Community

**The community showcase and skill registry for [AIsa](https://github.com/AIsa-team).**

Built something with AIsa? Wrote a skill for it? This is where it gets seen. Every merged submission appears in the gallery below, and once or twice a month we run a **competition** — winners get **AIsa credits** and a feature on our official channels.

<!-- STATS:START -->
**1** projects · **1** skills · **1** contributors
<!-- STATS:END -->

## 🚀 Submit in 10 minutes

| I want to… | How |
|---|---|
| **Show off a project I built with AIsa** | Add a folder under [`projects/`](projects/) with a `project.yaml` → open a PR. [Guide](CONTRIBUTING.md#submitting-a-project) |
| **Share a skill I built for AIsa** | Add a folder under [`skills/`](skills/) with `skill.yaml` + `SKILL.md` + code → open a PR. [Guide](CONTRIBUTING.md#submitting-a-skill) |
| **Enter the current competition** | Add `competition: <cycle>` to your metadata. [Current cycle →](competitions/) |
| **Let my AI agent submit for me** | Point your agent (Claude Code, etc.) at [AGENTS.md](AGENTS.md) — it contains everything an agent needs to prepare a correct submission. |
| **Submit without touching git** | Open a [submission issue](https://github.com/AIsa-team/aisa-community/issues/new/choose) and we'll turn it into a PR for you. |

Every PR is validated automatically (schema, structure, safety checks). Green CI + maintainer review = merged and live in the gallery.

## 🏆 Competitions

Once or twice a month we pick winners from recent submissions. Prizes: **AIsa credits + exposure on official AIsa media channels**. Rules, judging rubric and the current cycle live in [`competitions/`](competitions/).

### Hall of Fame

<!-- HALL_OF_FAME:START -->
_No competitions decided yet. The first cycle is underway — see [competitions/](competitions/)._
<!-- HALL_OF_FAME:END -->

## 🖼 Projects built with AIsa

<!-- PROJECTS:START -->
| Project | What it does | AIsa endpoints used | Author | Links |
|---|---|---|---|---|
| [**Hello AIsa (example entry)**](projects/hello-aisa/) | Seed entry from the AIsa team demonstrating the submission format. Your entry should describe, in one or two sentences, what your project does and why it's interesting. | `stock/prices` `search/web` | [@AIsa-team](https://github.com/AIsa-team) | [repo](https://github.com/AIsa-team/agent-skills) |
<!-- PROJECTS:END -->

## 🧩 Community skills for AIsa

> ⚠️ Community skills are reviewed but community-maintained. Read a skill's `SKILL.md` and code before installing. Official skills live in [AIsa-team/agent-skills](https://github.com/AIsa-team/agent-skills) — standout community skills get promoted there.

<!-- SKILLS:START -->
| Skill | What it does | Category | Version | Requires | Author |
|---|---|---|---|---|---|
| [**hello-aisa-skill**](skills/hello-aisa-skill/) | Prints a greeting with the current UTC time. Seed example demonstrating the community skill format — copy its structure, not its content. | utilities | 1.0.0 | none | [@AIsa-team](https://github.com/AIsa-team) |
<!-- SKILLS:END -->

## 📚 More

- [CONTRIBUTING.md](CONTRIBUTING.md) — submission formats, review criteria
- [SECURITY.md](SECURITY.md) — skill safety policy, reporting
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [Discussions](https://github.com/AIsa-team/aisa-community/discussions) — Show & Tell, Q&A, competition chat

Repo tooling is [MIT licensed](LICENSE). Submissions keep their own licenses (see each entry's metadata).

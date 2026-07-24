## OxBot

Official Discord Bot for <a href="https://overextended.dev">Overextended</a>.

<a href="https://discord.overextended.dev/">
  <img src="https://img.shields.io/badge/Discord-5865F2.svg?style=for-the-badge&logo=Discord&logoColor=white">
</a>

## Built-with

![](https://img.shields.io/badge/discord.js-5865F2?style=for-the-badge&logo=Discord.js&logoColor=white)
![](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white)
![](https://img.shields.io/badge/nubjs-D4CFC2?style=for-the-badge&logo=node.js&logoColor=FF5D3B)
![](https://img.shields.io/badge/Drizzle-111111?style=for-the-badge&logo=Drizzle&logoColor=C5F74F)
![](https://img.shields.io/badge/Docker-2496ED.svg?style=for-the-badge&logo=Docker&logoColor=white)

## Disclaimer

This bot is still in development and is intended as a future replacement for the current bot used in the Overextended Discord. If you plan to use it for your own Discord, please review the code to tailor it to your needs. **We will not provide support for this bot**; the code is shared for transparency and because most Overextended projects are open-source.

## Database Management

We use **Drizzle Kit** to manage schema migrations and inspect the database. All CLI interactions run through `nubx drizzle-kit ...`

| Command | Action |
| --- | --- |
| `nubx drizzle-kit generate` | Creates a new SQL migration based on schema changes. |
| `nubx drizzle-kit migrate` | Executes pending SQL migrations against the database. |
| `nubx drizzle-kit push` | Directly syncs schema changes without migration files. |
| `nubx drizzle-kit studio` | Opens a web-based UI to view and edit database rows. |

> [!WARNING]
> `push` directly alters your database schema without generating version-controlled SQL migration files. Use this primarily in local development.

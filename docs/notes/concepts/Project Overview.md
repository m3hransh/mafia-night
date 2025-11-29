# Project Overview

**Mafia Night** is a web application for managing physical Mafia games with real-time role distribution via Telegram bot.

## Purpose

Replace paper-based role distribution with a digital system that:
- Creates and manages games
- Allows players to join with a game ID
- Distributes roles randomly
- Delivers roles privately via Telegram
- Provides moderator dashboard

## Key Features

- 🎮 **Game Creation** - Moderators create games with unique IDs
- 👥 **Player Registration** - Players join using game codes
- 🎲 **Random Roles** - Fair, secret role distribution
- 📱 **Telegram Integration** - Private role delivery
- 🎯 **Moderator Dashboard** - Full game visibility
- ⚡ **Real-time Updates** - Live player status

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌──────────────┐
│  Next.js    │────▶│  Go API  │────▶│  PostgreSQL  │
│  Frontend   │◀────│  Backend │◀────│  Database    │
└─────────────┘     └──────────┘     └──────────────┘
                          │
                          │
                    ┌──────────────┐
                    │  Telegram    │
                    │  Bot         │
                    └──────────────┘
```

## Related Notes

- [[Tech Stack]] - Technologies used
- [[Backend Architecture]] - Backend design
- [[Frontend Architecture]] - Frontend design
- [[Project Structure]] - Code organization
- [[Phase 1 - Infrastructure]] - Current state

## Status

**Current Phase:** [[Phase 1 - Infrastructure]] ✅ Complete
**Next Phase:** [[Phase 2 - Database Layer]]

---

#overview #architecture

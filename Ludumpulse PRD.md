Here is your **Product Requirements Document (PRD)** for the **MVP** of your AI-powered game news tracking desktop app:

---

## **Project Overview**

This Windows desktop application helps users track released and unreleased video games, automatically summarizes related news, and suggests upcoming titles they may like. The system uses LangGraph for AI workflows and Supabase for backend data and auth, all running within an Electron app.

---

## **User Types & Core Workflows**

1. A user registers or logs in to their account using email and password.
2. A user adds released or unreleased games to their tracked list.
3. The system fetches and summarizes news updates for tracked games.
4. A user views grouped summaries and reads full articles if desired.
5. The system suggests new games based on tracked game history and preferences.
6. A user accepts, dismisses, or tracks recommended games.
7. A user receives alerts when major updates (like release dates) occur.

---

## **Technical Foundation**

### **Data Models**

1. `User`: Authenticated account with email and preferences.
2. `TrackedGame`: Game info tied to a user (title, tags, release status).
3. `NewsItem`: Summarized news articles linked to a game.
4. `GameSuggestion`: AI-generated recommendations per user.
5. `Notification`: Important event alerts for tracked games.

### **API Endpoints**

1. `POST /api/auth/register` – Register a user
2. `POST /api/auth/login` – Authenticate and start session
3. `GET/POST/PUT/DELETE /api/tracked-games` – Manage tracked games
4. `GET /api/news/:gameId` – Get news for a tracked game
5. `POST /api/news/update` – Trigger summarization flow
6. `GET/POST/PUT /api/suggestions` – Fetch or manage suggestions
7. `GET /api/notifications` – Retrieve alerts for tracked games

### **Key Components**

1. `LoginPage`, `DashboardPage`, `TrackedGamesPage`, `SuggestionsPage`, `NotificationsPage`, `SettingsPage`
2. `AddGameModal`, `GameDetailPage`, `TopBar`, `SidebarNav`
3. LangGraph-powered local flows: news summarization, suggestion engine, alert classifier

---

## **MVP Launch Requirements**

1. User auth via Supabase with persistent login and session handling.
2. Ability to add, edit, and delete tracked games (released and unreleased).
3. Scheduled and manual news scraping + AI summarization for tracked games.
4. Grouped news display with summaries and full article links.
5. AI-powered game recommendations with filters and justification text.
6. Accept/reject functionality for game suggestions.
7. Alerts for key game updates (e.g. release date, delays).
8. Local LangGraph execution fallback with Claude/OpenAI integration.
9. Fully functional Electron UI with page routing and persistent local cache.
10. Secure API and Supabase RLS policies to isolate user data.

---

Let me know if you want a delivery roadmap, sprint planning doc, or developer onboarding checklist next.

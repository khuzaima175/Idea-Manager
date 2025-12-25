# Idea Flow 🧠

**Idea Flow** is a high-performance, AI-powered "Mind Palace" designed to capture your thoughts at the speed of light. Whether it's a quick voice note or a typed snippet, Idea Flow uses **Gemini 2.0** to instantly turn raw data into structured insights, action items, and abstract art.

![IdeaFlow Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ Core Features

- **🎙️ Smart Voice Capture**: Record thoughts hands-free. AI transcribes and structures them automatically.
- **⌨️ Quick Type**: Instant text-based capture for when you need to be quiet.
- **🤖 Deep Dive AI**: One-click strategic expansion. Get roadmaps, pitfalls, and creative variations.
- **🪄 AI Refinement**: Let Gemini polish your titles, summarizes, and action items.
- **🏠 Local-First & Privacy-Focused**: Your data stays in your browser's local storage.
- **📱 Mobile-Optimized**: Designed for capturing big ideas on small screens.
- **📦 Vault Management**: Full backup and restore capabilities via JSON.
- **⌨️ Power User Shortcuts**:
  - `N`: Start voice recording
  - `T`: Open text input modal
  - `/`: Search vault
  - `Esc`: Close/Back

## 🛠️ Tech Stack

- **Framework**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **AI Engine**: Google Gemini 2.0 (Multimodal)
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/khuzaima175/Idea-Manager.git
   cd Idea-Manager
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the root and add your API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the app**:
   ```bash
   pnpm run dev
   # or
   npm run dev
   ```

## 🔒 Privacy & Security

Idea Flow follows a **local-first** philosophy. Your ideas are stored directly in your browser's `localStorage` and are never sent to a backend server (only to the Gemini API for processing). Use the **Backup Vault** feature to manually sync or secure your data.

---

Built with ❤️ by [Khuzaima](https://github.com/khuzaima175)

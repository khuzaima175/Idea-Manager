# IdeaFlow AI: Your Creative Vault

IdeaFlow AI is a high-performance, local-first "second brain" designed to capture, organize, and expand your thoughts using advanced AI. By combining voice-to-structured-data processing with a beautiful glassmorphism interface, IdeaFlow ensures your creative sparks are never lost.

## Features

- **Voice Capture**: Instantly record voice notes and let AI transcribe and summarize them.
- **AI Brainstormer**: Deep-dive into any idea with an interactive AI chat partner.
- **Local-First Privacy**: Your data belongs to you. All entries are stored securely in your browser's IndexedDB.
- **3D Visual Identity**: Automatically generated abstract visuals for every concept.
- **Mobile Optimized**: A seamless, responsive experience from desktop to mobile.
- **Vault Management**: Robust backup and restore functionality for data portability.

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/khuzaima175/Idea-Manager.git
   cd Idea-Manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configuration:**
   Create a `.env.local` file in the root directory and add your API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Deployment

### Deploy to Vercel

The easiest way to deploy IdeaFlow AI is via [Vercel](https://vercel.com/):

1. **Push your code to GitHub** (Done! ✅).
2. **Connect your repository** to Vercel.
3. **Environment Variables**: In the Vercel project settings, add a new environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key`
4. **Deploy**: Vercel will automatically detect Vite and build the project.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **AI Integration**: Google Gemini API
- **Storage**: IndexedDB (Native Web API)

## License

MIT License - feel free to build upon it!

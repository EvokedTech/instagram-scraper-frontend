# Instagram Scraper Frontend

Modern Next.js frontend for the Instagram Scraper System.

## Tech Stack    

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR & Axios
- **UI**: Custom components with responsive design

## Features

- Create and manage scraping sessions
- Real-time progress monitoring
- Queue status visualization
- Session control (pause/resume/delete)
- Responsive design for all devices

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Project Structure

```
frontend/
├── app/              # Next.js app directory
│   ├── layout.tsx   # Root layout
│   ├── page.tsx     # Home page
│   └── globals.css  # Global styles
├── components/       # React components
│   ├── SessionForm.tsx
│   ├── SessionList.tsx
│   ├── SessionCard.tsx
│   └── QueueStatus.tsx
├── lib/             # Utilities
│   └── api.ts       # API client
└── public/          # Static assets
```

## Components

### SessionForm
- Create new scraping sessions
- Configure depth and profile limits
- Validate Instagram URLs

### SessionList
- Display all sessions
- Auto-refresh every 5 seconds
- Show session progress

### SessionCard
- Individual session display
- Control buttons (pause/resume/delete)
- Expandable details view

### QueueStatus
- Real-time queue monitoring
- Show waiting/active/completed jobs
- Visual status indicators

## API Integration

The frontend connects to the backend API running on port 3000. All API calls are handled through the centralized `lib/api.ts` module.

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables for production

3. Start the server:
   ```bash
   npm start
   ```

The frontend will run on port 3001 by default.

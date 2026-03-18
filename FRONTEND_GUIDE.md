# Frontend Quick Start Guide

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Build

```bash
npm run build
```

Builds the app for production to the `build` folder.

## Component Structure

### App.js
Main component handling:
- State management (messages, loading, topic)
- Session storage persistence
- API communication with backend
- Message streaming and parsing

### Components
- **ChatWindow.jsx**: Displays messages with auto-scroll
- **MessageBubble.jsx**: Individual message styling
- **InputBar.jsx**: User input field with send/skip buttons

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Animations**: In `src/index.css`
  - `slide-right`: User message animation
  - `slide-left`: Assistant message animation
  - `dot`: Loading indicator animation

## API Configuration

Backend API endpoint: `http://localhost:8000/chat`

Change in `App.js` for different backend addresses.

## Session Storage

- **concept_explainer_history**: Chat messages
- **current_topic**: Current learning topic
- **explanation_style**: Current explanation style

Clear using the "Clear" button in header.

## Key Features

- Real-time streaming responses
- Auto-scroll to latest message
- Check question markers (|||CHECK|||)
- Evaluation responses (correct/wrong)
- Session persistence
- Responsive design

# AI Agent - Next.js AI Chat Application

A modern AI chat application built with Next.js, featuring real-time conversations, authentication, and AI-powered responses.

## Features

- 🔐 Secure Authentication with Clerk
- 💬 Real-time Chat Interface
- 🤖 AI-powered Responses
- 📱 Responsive Design
- 🎨 Modern UI with Tailwind CSS
- 🔄 Real-time Updates with Convex
- 🔒 Type-safe Development with TypeScript

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Database:** [Convex](https://www.convex.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Package Manager:** [pnpm](https://pnpm.io/)

## Project Structure

```
AI_Agent/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   │   └── chat/         # Chat interface pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
│
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── ChatInterface.tsx # Main chat interface
│   ├── ChatRow.tsx       # Individual chat row
│   ├── Header.tsx        # Application header
│   ├── MessageBubble.tsx # Chat message component
│   ├── Sidebar.tsx       # Navigation sidebar
│   └── WelcomeMessage.tsx # Welcome screen
│
├── convex/               # Convex database functions
│   └── messages.ts       # Message-related functions
│
├── lib/                  # Utility functions
│   └── convex.ts         # Convex client setup
│
├── public/              # Static assets
│
└── wxflows/             # WXFlows integration
```

## Component Documentation

### Core Components

1. **ChatInterface.tsx**
   - Main chat interface component
   - Handles message display and input
   - Manages real-time updates

2. **MessageBubble.tsx**
   - Individual message display
   - Supports different message types
   - Handles message formatting

3. **Sidebar.tsx**
   - Navigation sidebar
   - Chat history display
   - User profile section

4. **Header.tsx**
   - Application header
   - User authentication status
   - Navigation controls

### Pages

1. **Dashboard**
   - Main application interface
   - Chat list and management
   - User settings

2. **Chat Interface**
   - Individual chat conversations
   - Real-time message updates
   - AI response handling

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- pnpm
- Git

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOYMENT=your_convex_deployment
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_BASE_URL=your_base_url
WXFLOWS_APIKEY=your_wxflows_api_key
WXFLOWS_ENDPOINT=your_wxflows_endpoint
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/RickyVishwakarma/AI_Agent.git
cd AI_Agent
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Guidelines

1. **Component Structure**
   - Keep components modular and reusable
   - Use TypeScript for type safety
   - Follow the established file structure

2. **State Management**
   - Use Convex for real-time data
   - Implement proper error handling
   - Maintain type safety

3. **Styling**
   - Use Tailwind CSS for styling
   - Follow responsive design principles
   - Maintain consistent UI/UX

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

- Ricky Vishwakarma
- GitHub: [@RickyVishwakarma](https://github.com/RickyVishwakarma)

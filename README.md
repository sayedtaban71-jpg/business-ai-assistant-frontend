# Sales AI Business Assistant

A Next.js application that provides AI-powered sales intelligence and strategy development tools.

## Features

- **Company Management**: Manage multiple companies with detailed profiles
- **Board System**: Organize sales strategies into different boards
- **AI-Powered Tiles**: Generate insights and strategies using AI
- **Real-time Updates**: Stream AI responses for better user experience

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```bash
# Neon Database Configuration
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key-here"
```

### 2. Neon Database Setup

1. Create a Neon account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from your project dashboard
4. Replace the `DATABASE_URL` in your `.env.local` file

### 3. OpenAI API Key

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

The application will automatically:
- Connect to your Neon database
- Create necessary tables if they don't exist
- Insert sample data (companies, boards, and tiles)

## Database Schema

The application uses the following tables:

- **companies**: Company profiles with industry, product, and ICP information
- **boards**: Organization boards for different sales strategies
- **tiles**: Individual strategy tiles with AI prompts
- **tile_messages**: Conversation history for each tile

## Sample Data

The application comes with pre-configured sample data:

### Companies
- InnovateTech Solutions (Technology Consulting)
- GreenEnergy Corp (Renewable Energy)
- HealthTech Innovations (Healthcare Technology)

### Boards
- Strategic Sales Board
- Market Analysis Board
- Customer Success Board

### Tiles
- Market Opportunity Analysis
- Competitive Positioning
- Industry Trends
- Customer Journey Mapping

## Usage

1. Select a company from the sidebar
2. Choose a board to work with
3. Use the AI-powered tiles to generate insights and strategies
4. Refine AI responses with additional context

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon (PostgreSQL)
- **AI**: OpenAI GPT-4
- **State Management**: Zustand
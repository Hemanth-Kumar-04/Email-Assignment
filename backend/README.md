# Prompt-Driven Email Productivity Agent

A backend system that processes emails using LLMs (Google Gemini), where the "Brain" of the agent (prompts) is stored in a database and editable by users. Built with Node.js, Express, Prisma, and SQLite.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment
# Create a .env file with:
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=8000

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Start the server
node src/index.js
# or for auto-reload during development:
npx nodemon src/index.js
```

The server will auto-seed default prompts and mock emails on first run.

### Access the UI
Open http://localhost:8000/ in your browser to access the web interface.

---

## 📋 API Endpoints

### Health Check

#### `GET /health`
Check if the server is running.

**Response:**
```json
{
  "status": "OK"
}
```

---

### Prompts (Agent Brain)

The prompts control how the LLM behaves. All prompts are stored in the database and can be edited dynamically.

#### `GET /api/prompts`
Retrieve all prompts.

**Response:**
```json
[
  {
    "id": 1,
    "name": "categorization",
    "content": "You are an email classifier. Categorize the email into one of these categories: Work, Personal, Finance, Urgent, Promotions, Other. Return only the category name.",
    "createdAt": "2025-01-10T10:30:00.000Z",
    "updatedAt": "2025-01-10T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "actionExtraction",
    "content": "Extract all actionable tasks from the email...",
    "createdAt": "2025-01-10T10:30:00.000Z",
    "updatedAt": "2025-01-10T10:30:00.000Z"
  }
]
```

#### `GET /api/prompts/:name`
Retrieve a specific prompt by name.

**Parameters:**
- `name` (string) - Prompt name (e.g., `categorization`, `actionExtraction`, `replyGeneration`)

**Response:**
```json
{
  "id": 1,
  "name": "categorization",
  "content": "You are an email classifier...",
  "createdAt": "2025-01-10T10:30:00.000Z",
  "updatedAt": "2025-01-10T10:30:00.000Z"
}
```

#### `PUT /api/prompts/:name`
Update or create a prompt. This immediately changes how the agent behaves.

**Parameters:**
- `name` (string) - Prompt name

**Request Body:**
```json
{
  "content": "Updated prompt content here"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "categorization",
  "content": "Updated prompt content here",
  "createdAt": "2025-01-10T10:30:00.000Z",
  "updatedAt": "2025-01-10T12:45:00.000Z"
}
```

---

### Email Ingestion

#### `POST /api/ingest`
Load mock emails and process them using LLM with dynamic prompts from the database.

**What it does:**
1. Loads emails from `src/data/mockEmails.json`
2. Fetches `categorization` and `actionExtraction` prompts from DB
3. For each email:
   - Calls LLM to categorize the email
   - Calls LLM to extract action items (JSON mode)
   - Saves results to database

**Response:**
```json
{
  "message": "Email ingestion complete",
  "results": [
    {
      "email": "Project Update Needed",
      "category": "Work",
      "actionItemsCount": 2,
      "status": "processed"
    },
    {
      "email": "Your Order Has Shipped",
      "category": "Personal",
      "actionItemsCount": 0,
      "status": "processed"
    }
  ]
}
```

---

### Emails

#### `GET /api/emails`
Retrieve all emails with their action items, drafts, and chat history.

**Response:**
```json
[
  {
    "id": 1,
    "sender": "John Doe",
    "email": "john@example.com",
    "avatar": "https://i.pravatar.cc/150?img=1",
    "subject": "Project Update Needed",
    "body": "Hi, could you share the current status...",
    "timestamp": "10:30 AM",
    "date": "2025-01-10",
    "read": false,
    "category": "Work",
    "processed": true,
    "actionItems": [
      {
        "id": 1,
        "task": "Share project status",
        "priority": "High",
        "metadata": null
      }
    ],
    "drafts": [],
    "chats": []
  }
]
```

#### `GET /api/emails/:id`
Retrieve a specific email by ID.

**Parameters:**
- `id` (integer) - Email ID

**Response:** Same structure as single email in array above.

#### `PUT /api/emails/:id/category`
Manually update an email's category.

**Parameters:**
- `id` (integer) - Email ID

**Request Body:**
```json
{
  "category": "Urgent"
}
```

**Response:**
```json
{
  "id": 1,
  "category": "Urgent",
  ...
}
```

---

### Drafts

#### `POST /api/drafts`
Generate an auto-reply draft for an email using the `replyGeneration` prompt from the database.

**Important:** Drafts are saved only, never sent (safety requirement).

**Request Body (Generate draft):**
```json
{
  "emailId": 1
}
```

**Response:**
```json
{
  "id": 1,
  "emailId": 1,
  "to": "john@example.com",
  "subject": "Re: Project Update Needed",
  "body": "Hi John,\n\nThank you for reaching out...",
  "metadata": null,
  "createdAt": "2025-01-10T14:20:00.000Z",
  "updatedAt": "2025-01-10T14:20:00.000Z"
}
```

**Request Body (Manual draft):**
```json
{
  "to": "someone@example.com",
  "subject": "Custom Draft",
  "body": "Draft content here"
}
```

#### `GET /api/drafts`
Retrieve all drafts.

**Response:**
```json
[
  {
    "id": 1,
    "emailId": 1,
    "to": "john@example.com",
    "subject": "Re: Project Update Needed",
    "body": "Hi John...",
    "email": {
      "id": 1,
      "subject": "Project Update Needed",
      "sender": "John Doe"
    }
  }
]
```

#### `PUT /api/drafts/:id`
Update a draft.

**Parameters:**
- `id` (integer) - Draft ID

**Request Body:**
```json
{
  "body": "Updated draft content"
}
```

#### `DELETE /api/drafts/:id`
Delete a draft.

**Parameters:**
- `id` (integer) - Draft ID

**Response:**
```json
{
  "message": "Draft deleted"
}
```

---

### Chat (RAG & Natural Language Queries)

#### `POST /api/chat/:emailId`
Chat about a specific email using RAG (Retrieval-Augmented Generation). The LLM receives full email context including body, action items, and drafts.

**Parameters:**
- `emailId` (integer) - Email ID

**Request Body:**
```json
{
  "message": "Summarize this email"
}
```

**Response:**
```json
{
  "id": 1,
  "emailId": 1,
  "role": "assistant",
  "text": "This email is from John Doe requesting a project status update before Friday...",
  "createdAt": "2025-01-10T15:00:00.000Z"
}
```

#### `POST /api/chat`
General chat with natural language database queries. The LLM acts as a router to convert natural language into database filters.

**Request Body:**
```json
{
  "message": "Show me urgent emails"
}
```

**What happens:**
1. LLM receives the query and returns JSON: `{ "action": "query", "filter": { "category": "Urgent" } }`
2. Server translates filter to Prisma query
3. Returns matching emails

**Response:**
```json
{
  "id": 2,
  "role": "assistant",
  "text": "Found 2 email(s):\n\n• Important: Submit Documents from HR Department (Urgent)\n• Urgent Meeting Request from Manager (Urgent)",
  "createdAt": "2025-01-10T15:05:00.000Z"
}
```

**Example queries:**
- "Show me urgent emails"
- "List all work emails"
- "Show me emails from John"

---

## 🧪 Testing

### PowerShell Script
```powershell
# From backend directory
.\run_endpoints.ps1 -BaseUrl 'http://localhost:8000'
```

### Node.js Script
```bash
node tests/test_endpoints.js
```

### Manual Testing (PowerShell)
```powershell
# Get all prompts
Invoke-RestMethod -Method Get -Uri 'http://localhost:8000/api/prompts'

# Ingest emails
Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/api/ingest'

# Get emails
Invoke-RestMethod -Method Get -Uri 'http://localhost:8000/api/emails'

# Generate draft
$body = @{ emailId = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/api/drafts' -Body $body -ContentType 'application/json'

# Chat query
$body = @{ message = 'Show me urgent emails' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/api/chat' -Body $body -ContentType 'application/json'
```

---

## 🗂️ Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── prisma.config.js       # Prisma config (Prisma 5)
│   └── seed.js                # Seed script (optional)
├── src/
│   ├── data/
│   │   ├── defaultPrompts.json    # Default agent prompts
│   │   └── mockEmails.json        # Sample emails
│   ├── routes/
│   │   ├── chat.js            # Chat endpoints (RAG + router)
│   │   ├── drafts.js          # Draft generation
│   │   ├── emails.js          # Email CRUD
│   │   ├── ingest.js          # Email processing pipeline
│   │   └── prompts.js         # Prompt management
│   ├── services/
│   │   └── llmService.js      # Gemini API wrapper
│   ├── index.js               # Server entry point
│   └── prismaClient.js        # Prisma client instance
├── public/
│   ├── index.html             # Frontend UI
│   ├── style.css              # Styles
│   └── app.js                 # Frontend logic
├── tests/
│   └── test_endpoints.js      # Node test script
├── .env                       # Environment variables
├── package.json               # Dependencies
└── run_endpoints.ps1          # PowerShell test script
```

---

## 🗄️ Database Schema

### Models

**Prompt**
- `id` - Auto-increment primary key
- `name` - Unique prompt name (e.g., `categorization`)
- `content` - Prompt text
- `createdAt` / `updatedAt` - Timestamps

**Email**
- `id` - Auto-increment primary key
- `sender`, `email`, `subject`, `body` - Email metadata
- `category` - LLM-assigned category
- `processed` - Boolean flag
- `actionItems` - Relation to ActionItem[]
- `drafts` - Relation to Draft[]
- `chats` - Relation to ChatMessage[]

**ActionItem**
- `id` - Auto-increment primary key
- `emailId` - Foreign key to Email
- `task` - Task description
- `priority` - High/Medium/Low
- `metadata` - JSON string (optional)

**Draft**
- `id` - Auto-increment primary key
- `emailId` - Foreign key to Email (optional)
- `to`, `subject`, `body` - Draft content
- `metadata` - JSON string (optional)

**ChatMessage**
- `id` - Auto-increment primary key
- `emailId` - Foreign key to Email (optional)
- `role` - "user" or "assistant"
- `text` - Message content

---

## 🔑 Key Features

1. **Prompt-Driven Architecture**: All LLM behavior is controlled by prompts stored in the database. Change prompts = change behavior instantly.

2. **Dynamic Email Processing**: Uses current prompts from DB (not hardcoded) to categorize emails and extract action items.

3. **RAG-Style Chat**: Ask questions about specific emails with full context (email body, action items, drafts).

4. **Natural Language DB Queries**: Ask "Show me urgent emails" and the LLM translates to database filters.

5. **Safe Draft Generation**: Auto-generated replies are saved only, never sent.

6. **JSON Mode Support**: LLM wrapper supports structured JSON output for action extraction.

---

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `PORT` | Server port | `8000` |

### Default Prompts

The system seeds three default prompts on first run:

1. **categorization** - Classifies emails into categories
2. **actionExtraction** - Extracts tasks with priorities
3. **replyGeneration** - Generates professional replies

You can edit these via the API or UI to change agent behavior.

---

## 📝 Notes

- **Prisma Version**: Uses Prisma 5.x with traditional `url` in schema.
- **LLM Provider**: Google Gemini via `@google/generative-ai` package.
- **Safety**: Drafts are never sent automatically.
- **Extensibility**: Add new prompts to control additional LLM behaviors.

---

## 🤝 Contributing

To extend this project:
1. Add new prompts to `defaultPrompts.json`
2. Create new routes in `src/routes/`
3. Update frontend in `public/`
4. Test with `run_endpoints.ps1` or `test_endpoints.js`

---

## 📄 License

ISC

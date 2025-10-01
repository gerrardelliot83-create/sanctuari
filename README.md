# Sanctuari

AI-powered insurance procurement platform for B2B businesses in India.

## Project Structure

This is a monorepo built with Turbo, containing two Next.js applications and shared packages.

```
sanctuari/
├── apps/
│   ├── platform/     # Main user platform (platform.sanctuari.io)
│   └── admin/        # Admin panel (admin.sanctuari.io)
├── packages/
│   ├── ui/           # Shared UI components
│   ├── database/     # Supabase schemas and types
│   ├── utils/        # Shared utilities
│   └── config/       # Shared configuration
└── Resources/        # Data files (RFQ templates, profiles, images)
```

## Technology Stack

- **Frontend**: Next.js 14 with App Router, JavaScript/TypeScript, Vanilla CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Storage**: UploadThing
- **Document Parser**: Llama Parse
- **AI**: Claude Opus 4.1 (main), Claude Sonnet 4 (sub-agents), Langchain
- **Payments**: Razorpay
- **Email**: Brevo
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables (see `.env.example` files in each app)

4. Run the development servers:

```bash
npm run dev
```

This will start:
- Platform app on http://localhost:3000
- Admin app on http://localhost:3001

## Development Scripts

- `npm run dev` - Start development servers for all apps
- `npm run build` - Build all apps and packages
- `npm run start` - Start production servers
- `npm run lint` - Lint all code
- `npm run test` - Run all tests
- `npm run clean` - Clean all build artifacts and node_modules

## Deployment

- Platform: platform.sanctuari.io
- Admin: admin.sanctuari.io
- Hosted on Vercel

## Documentation

See `/docs` folder for detailed documentation on:
- Third-party service setup
- Database schema
- API documentation
- Deployment guide

## Security

- All sensitive data is encrypted
- Row Level Security (RLS) enabled on Supabase
- Input validation on all forms
- API rate limiting implemented
- Regular security audits

## License

Private - All Rights Reserved

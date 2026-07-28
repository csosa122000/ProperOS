# Proper OS

Multi-tenant operating system for remodeling contractors, with Proper Remodeling as the first tenant.

## Included
- Supabase password authentication
- Pending-membership claim after login
- Protected application routes
- Company context and navigation shell
- Executive dashboard
- CRM lead list connected to Supabase
- Estimate Builder foundation
- Proposal Generator foundation
- Production pipeline
- Company settings

## Setup
1. Copy `.env.example` to `.env.local`.
2. Add the Supabase anon key from Project Settings > API.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000/login`.

Use `sosa_chris@icloud.com` for the initial owner account. The first successful login calls `claim_pending_memberships()`.

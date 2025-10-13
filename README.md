# AI Platform Status Monitor

Real-time monitoring dashboard for major AI platform services with community-driven validation.

## Features

### Core Monitoring
- **Real-time Status Monitoring**: Track the operational status of 14+ major AI platforms
- **Incident Tracking**: View active and historical incidents with detailed timelines
- **Automated Polling**: Status checks every 15 minutes via Supabase Edge Functions
- **Reliability Dashboard**: Historical uptime tracking with 7/30/90-day metrics
- **Provider Comparison**: Side-by-side comparison of multiple platforms

### Community Features (NEW in v2.2.0)
- **User Feedback System**: Community voting on provider status (working/issues/down)
- **Issue Reporting**: Detailed problem reports with categories and severity levels
- **Community Reports**: View and upvote user-submitted issues
- **Early Warning System**: Community often reports issues before official status updates
- **Feedback Badges**: Provider cards show active community reports and votes

### Discovery & Search
- **Auto-Discovery**: Automatically find and track new AI platforms
- **Advanced Search**: Filter by status, features, and more
- **Platform Suggestions**: Community can suggest new platforms to monitor

### User Experience
- **Notifications**: Email and Web Push notification support for critical incidents
- **Favorites System**: Drag & drop to organize your most-watched providers
- **Multi-Language**: German and English support
- **Dark/Light Theme**: Customizable appearance
- **PWA Support**: Install as mobile/desktop app with offline support
- **Changelog System**: Track all platform updates and changes
- **Responsive Design**: Mobile-optimized with touch gestures

## Monitored Platforms

- OpenAI
- Anthropic
- Google AI
- Meta AI
- Mistral AI
- Cohere
- HuggingFace
- Stability AI
- Replicate
- Perplexity
- ElevenLabs
- Grok (X.AI)
- Manus
- DeepSeek

## Architecture

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Real-time updates via Supabase subscriptions

### Backend
- Supabase (PostgreSQL database)
- Row Level Security for data access control
- Edge Functions for status polling
- Real-time subscriptions

### Database Schema
- `providers`: AI platform information
- `incidents`: Status incidents and outages
- `status_checks`: Historical status check logs
- `user_subscriptions`: User notification preferences
- `user_preferences`: User settings and favorites
- `changelog`: Version history tracking
- `platform_suggestions`: Community platform suggestions
- `user_feedback_votes`: Quick status voting (working/issues/down)
- `user_issue_reports`: Detailed community issue reports
- `report_upvotes`: Community validation of reports
- `feedback_aggregations`: Hourly aggregated feedback statistics

## Status Polling

The application automatically checks provider status every 15 minutes using a Supabase Edge Function. You can also manually trigger a check using the refresh button in the bottom-right corner.

### Manual Status Check

To manually trigger a status check, click the refresh button in the status checker widget.

### How It Works

1. Edge Function fetches status from provider APIs
2. Parses incidents and components
3. Updates database with current status
4. Creates/updates incident records
5. Frontend receives real-time updates via Supabase subscriptions

## Community Feedback System

### Quick Voting
Vote on provider status in real-time:
- **Working**: Everything is operational
- **Having Issues**: Experiencing problems
- **Down**: Complete outage

Votes are aggregated over 2-hour windows and displayed on provider cards.

### Issue Reporting
Submit detailed reports with:
- **Category**: Performance, Outage, API Issues, Feature Problems, Other
- **Severity**: Minor, Major, Critical
- **Affected Features**: Specific components having issues
- **Description**: Detailed problem description
- **Contact Email**: Optional for follow-up

Reports are visible to the community for 24 hours and can be upvoted for validation.

### Rate Limiting & Security
- IP-based fingerprinting prevents spam
- 1 vote per provider per hour
- Maximum 3 reports per hour
- Reports auto-expire after 24 hours
- Row Level Security on all feedback tables

## Notification System

Configure notifications in Settings:
- Select monitored providers
- Set alert threshold (minor, major, critical)
- Optional email notifications
- Web Push notifications (requires browser permission)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## Environment Variables

Required environment variables (automatically configured):
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

## Edge Functions

The application includes several automated Edge Functions:

### check-provider-status
- Polls all provider status pages every 15 minutes
- Updates incidents and status in real-time
- Triggers notifications for critical events

### discover-platforms
- Automatically discovers new AI platforms
- Runs daily to find emerging services
- Updates provider database with new entries

### send-push-notification
- Handles Web Push notifications
- Triggered on critical incidents
- Delivers notifications to subscribed users

### aggregate-feedback (Automated Cronjob)
- Runs hourly to aggregate community feedback
- Updates feedback_aggregations table
- Optimizes query performance

### cleanup-expired-reports (Automated Cronjob)
- Runs daily to clean up old reports
- Marks reports as resolved after 24 hours
- Maintains database hygiene

## Changelog

View the complete changelog in the app via the hamburger menu → Changelog.

Current version: **v2.2.0**

### Latest Updates (v2.2.0)
- Community Feedback System with voting
- Issue Reporting with categories and severity
- Community Reports section with upvoting
- Feedback badges on provider cards
- IP-based rate limiting and spam protection
- Auto-expire for reports after 24 hours
- Enhanced provider details for N8N, Base44, Manus

## License

OPSL-1.0

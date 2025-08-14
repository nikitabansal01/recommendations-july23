# Local Development Guide

This guide explains how to run the Auvra hormone health assessment app locally without requiring Upstash Redis database credentials.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open in your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🔧 Local Development Mode

The app has been modified to run in **local development mode** which means:

- ✅ **No database credentials required**
- ✅ **Data is stored in memory** (resets when server restarts)
- ✅ **All API endpoints work locally**
- ✅ **Console logging shows all data operations**

## 📊 Data Storage

In local development mode, the app uses:
- **In-memory storage** instead of Upstash Redis
- **Shared storage module** (`src/app/lib/local-storage.ts`)
- **Automatic data persistence** during the session

## 🔍 Console Logging

When you use the app, check your terminal for detailed logging:
- Survey responses being saved
- Email addresses being stored
- Data retrieval operations
- All operations are clearly marked with `=== LOCAL DEVELOPMENT ===`

## 📁 Modified Files

The following API routes have been updated for local development:
- `src/app/api/save-response/route.ts`
- `src/app/api/save-email/route.ts`
- `src/app/api/get-responses/route.ts`
- `src/app/api/update-email/route.ts`
- `src/app/api/test-redis/route.ts` (now tests local storage)

## 🚀 Production Deployment

When you're ready to deploy to production:
1. Set up Upstash Redis database
2. Configure environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. The app will automatically switch to using Upstash Redis

## 🧪 Testing

You can test all functionality locally:
- Complete the hormone health survey
- Save responses (stored in memory)
- Add/update email addresses
- View all saved responses
- Export PDF reports

## 📝 Notes

- Data is **not persistent** between server restarts in local mode
- Perfect for development, testing, and demonstration
- No external dependencies or API keys required
- All features work exactly as they would in production

## 🆘 Troubleshooting

If you encounter issues:
1. Make sure all dependencies are installed: `npm install`
2. Check the terminal for detailed error messages
3. Verify the development server is running on port 3000
4. Check browser console for any frontend errors

---

**Happy coding! 🎉** 
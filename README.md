# Symptom Tracker - PocketBase Edition

A comprehensive GI and pelvic pain symptom tracking application with cloud sync capabilities powered by PocketBase.

## Features

- **User Authentication**: Secure login and registration
- **Cloud Sync**: Access your data from any device
- **Comprehensive Symptom Logging**: Track pain, bowel movements, diet, medications, and more
- **Interactive Body Diagram**: Visual pain point mapping
- **History & Analytics**: View past logs with filtering and statistics
- **Data Export**: Export to JSON or CSV format
- **Dark Mode**: Beautiful dark theme support
- **Mobile-First**: Optimized for mobile devices

## Tech Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS, HTML5
- **Backend**: PocketBase (Go-based backend)
- **Database**: SQLite (via PocketBase)
- **Authentication**: PocketBase Auth

## Project Structure

```
Tracker/
├── index.html              # Main symptom logging form
├── history.html            # Symptom log history viewer
├── auth.html               # Login/registration page
├── app.js                  # Main application logic
├── storage-pocketbase.js   # PocketBase storage service
├── history.js              # History page logic
├── auth.js                 # Authentication logic
├── pocketbase/             # PocketBase server files
│   ├── pocketbase.exe      # PocketBase executable
│   └── pb_data/            # Database and uploads (auto-created)
└── POCKETBASE_SETUP.md     # Detailed setup instructions
```

## Quick Start

### 1. PocketBase Server Setup

The PocketBase server is already set up and running. To start it:

```bash
cd pocketbase
./pocketbase.exe serve
```

The server will start at: **http://127.0.0.1:8090**

### 2. Admin Dashboard

1. Open http://127.0.0.1:8090/_/ in your browser
2. Create your admin account (first time only)
3. Follow the instructions in `POCKETBASE_SETUP.md` to configure the database schema

### 3. Access the App

1. Open `auth.html` in your browser
2. Register a new user account
3. Start logging symptoms!

## Database Schema

### Collection: `symptom_logs`

The main collection stores all symptom log data with the following structure:

- **date** (Text): Log date
- **time** (Text): Log time
- **timeOfDay** (Select): morning, afternoon, evening, night
- **painLocations** (JSON): Array of pain point coordinates
- **painLevel** (Number): 0-10 scale
- **painTypes** (JSON): Array of pain types
- **painDescription** (Text): Detailed pain description
- **painTriggers** (JSON): Array of triggers
- **painRelief** (JSON): Array of relief methods
- **bowelMovements** (JSON): Detailed BM information
- **eating** (JSON): Food and drink intake
- **otherSymptoms** (JSON): Additional symptoms
- **medications** (JSON): Array of medications taken
- **notes** (Text): General notes
- **userId** (Relation): Link to user who created the log

## API Security

All API endpoints are protected with the following rules:

- Users must be authenticated to access any data
- Users can only view/edit/delete their own logs
- Logs are automatically associated with the authenticated user

## Migration from localStorage

If you have existing data in localStorage, the app will automatically offer to migrate it to PocketBase when you first log in. The migration process:

1. Detects existing localStorage data
2. Prompts you to migrate after successful login
3. Uploads all existing logs to your PocketBase account
4. Preserves all data structure and relationships

## Cloud Deployment

To deploy PocketBase to the cloud and make your app accessible from anywhere:

### Option 1: Fly.io (Recommended)

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Create a `Dockerfile`:

```dockerfile
FROM alpine:latest

RUN apk add --no-cache ca-certificates

COPY pocketbase/pocketbase /usr/local/bin/pocketbase

EXPOSE 8090

CMD ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090"]
```

3. Create `fly.toml`:

```toml
app = "your-symptom-tracker"

[env]
  PORT = "8090"

[[services]]
  http_checks = []
  internal_port = 8090
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[[mounts]]
  source = "pb_data"
  destination = "/pb_data"
```

4. Deploy:

```bash
fly launch
fly volumes create pb_data --size 1
fly deploy
```

### Option 2: Railway

1. Sign up at https://railway.app
2. Create new project
3. Add PocketBase template
4. Deploy

### Option 3: PocketHost (Managed)

1. Sign up at https://pockethost.io
2. Create a new instance
3. Upload your schema
4. Done!

### Update Frontend URLs

After deployment, update the PocketBase URL in `storage-pocketbase.js`:

```javascript
init() {
    if (!this.pb) {
        this.pb = new PocketBase('https://your-app.fly.dev'); // Update this URL
        this.pb.autoCancellation(false);
    }
    return this.pb;
}
```

## Development

### Running Locally

1. Start PocketBase:
   ```bash
   cd pocketbase
   ./pocketbase.exe serve
   ```

2. Open the app in your browser:
   - Auth: `file:///path/to/auth.html`
   - Or use a local server (recommended):
     ```bash
     python -m http.server 8000
     ```
   - Then visit: `http://localhost:8000/auth.html`

### Data Backup

PocketBase automatically creates backups in `pocketbase/pb_data/backups/`. To manually backup:

```bash
cd pocketbase
./pocketbase.exe backup create
```

### Restore from Backup

```bash
cd pocketbase
./pocketbase.exe restore backup_name.zip
```

## Features Documentation

### Symptom Logging

Track comprehensive symptom data including:
- Pain level, type, location, triggers, and relief
- Bowel movement details (Bristol scale, color, consistency)
- Food and fluid intake with categories
- Urinary and gynecologic symptoms
- Medications and their effects
- General notes

### History & Analytics

- View all past logs in chronological order
- Filter by date range
- See statistics (total logs, average pain level)
- View detailed information for each log
- Edit or delete existing logs
- Export data to JSON or CSV

### Data Export

Export your symptom data for:
- Sharing with healthcare providers
- Personal analysis in spreadsheet apps
- Backup purposes
- Data portability

## Security & Privacy

- All data is encrypted in transit (HTTPS when deployed)
- User passwords are hashed using industry-standard bcrypt
- Each user's data is completely isolated
- No third-party tracking or analytics
- You control your data with full export capabilities

## Troubleshooting

### PocketBase won't start
- Check if port 8090 is already in use
- Make sure `pocketbase.exe` has execute permissions

### Can't login after registration
- Check PocketBase dashboard for user creation
- Verify email/password requirements (min 8 characters)
- Check browser console for error messages

### Data not syncing
- Ensure PocketBase server is running
- Check network connection
- Verify authentication token hasn't expired

### Migration failed
- Check browser console for specific errors
- Verify you're logged in successfully
- Try migrating logs in smaller batches

## Contributing

This is a personal health tracking application. Feel free to fork and customize for your own needs!

## License

This project is for personal use. Modify as needed for your own symptom tracking needs.

## Support

For issues or questions:
1. Check `POCKETBASE_SETUP.md` for setup details
2. Review the PocketBase documentation: https://pocketbase.io/docs/
3. Check browser console for error messages

## Roadmap

Future enhancements could include:
- Photo attachments for symptom documentation
- Medication reminders
- Symptom pattern analysis with charts
- PDF report generation for doctors
- Multiple language support
- Progressive Web App (PWA) with offline support

---

**Built with PocketBase** - The open-source backend in one file.

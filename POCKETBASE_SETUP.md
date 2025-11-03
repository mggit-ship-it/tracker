# PocketBase Setup Guide

## Status: PocketBase Server Running ✅

PocketBase is now running at: **http://127.0.0.1:8090**

## Step 1: Create Admin Account

1. Open this URL in your browser:
   ```
   http://127.0.0.1:8090/_/
   ```

2. You'll be prompted to create your first admin account:
   - **Email**: Enter your email address
   - **Password**: Choose a strong password (min 10 characters)
   - Click "Create and login"

## Step 2: Create Database Schema

Once logged into the admin dashboard, create the following collection:

### Collection: `symptom_logs`

**Type**: Base Collection

**Fields to Add:**

1. **date** (Text)
   - Type: Plain text
   - Required: Yes
   - Pattern: Date format

2. **time** (Text)
   - Type: Plain text
   - Required: No

3. **timeOfDay** (Select)
   - Type: Select (single)
   - Options: `morning`, `afternoon`, `evening`, `night`
   - Required: No

4. **painLocations** (JSON)
   - Type: JSON
   - Required: No
   - Default: `[]`

5. **painLevel** (Number)
   - Type: Number
   - Required: No
   - Min: 0
   - Max: 10

6. **painTypes** (JSON)
   - Type: JSON
   - Required: No
   - Default: `[]`

7. **painDescription** (Text)
   - Type: Plain text
   - Required: No

8. **painTriggers** (JSON)
   - Type: JSON
   - Required: No
   - Default: `[]`

9. **painRelief** (JSON)
   - Type: JSON
   - Required: No
   - Default: `[]`

10. **bowelMovements** (JSON)
    - Type: JSON
    - Required: No
    - Stores: count, consistency, color, mucus, blood, painful, gasPassage

11. **eating** (JSON)
    - Type: JSON
    - Required: No
    - Stores: meals, categories, fluids, symptoms

12. **otherSymptoms** (JSON)
    - Type: JSON
    - Required: No
    - Stores: symptoms, urinaryDetails, gynecologicDetails

13. **medications** (JSON)
    - Type: JSON
    - Required: No
    - Default: `[]`
    - Stores: array of {name, dose, time, effect}

14. **notes** (Text)
    - Type: Plain text (or Editor for rich text)
    - Required: No

15. **userId** (Relation)
    - Type: Relation
    - Collection: users
    - Required: Yes
    - Single relation

### API Rules for `symptom_logs`

**List/Search Rule:**
```javascript
@request.auth.id != "" && userId = @request.auth.id
```

**View Rule:**
```javascript
@request.auth.id != "" && userId = @request.auth.id
```

**Create Rule:**
```javascript
@request.auth.id != "" && @request.data.userId = @request.auth.id
```

**Update Rule:**
```javascript
@request.auth.id != "" && userId = @request.auth.id
```

**Delete Rule:**
```javascript
@request.auth.id != "" && userId = @request.auth.id
```

These rules ensure:
- Only authenticated users can access the API
- Users can only see/edit/delete their own symptom logs
- When creating a log, it's automatically tied to the authenticated user

## Step 3: Enable User Authentication

1. Go to **Settings** > **Auth providers**
2. Enable **Email/Password** authentication
3. Configure settings:
   - ✅ Allow user registration
   - ✅ Require email verification (optional, can disable for testing)
   - Minimum password length: 8 characters

## Quick Test

After setup, you can test the API:

1. Create a test user via the dashboard or API
2. Use the API docs at: http://127.0.0.1:8090/api/

## Important Notes

- PocketBase data is stored in `pocketbase/pb_data/`
- To stop the server: Find the process and stop it, or press Ctrl+C in the terminal
- To restart: Run `./pocketbase.exe serve` from the pocketbase directory
- Backup `pb_data` folder regularly for data safety

## Next Steps

After completing this setup:
1. ✅ Admin account created
2. ✅ Database schema configured
3. ✅ API rules set for privacy
4. 🔄 Ready for frontend integration
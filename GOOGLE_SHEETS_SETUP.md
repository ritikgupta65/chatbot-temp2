# Google Sheets Integration Setup Guide

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
```javascript
function doPost(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Levi's form data");

    if (!sheet) {
      sheet = spreadsheet.insertSheet("Levi's form data");
      sheet.appendRow(['Name', 'Email', 'Mobile', 'Message', 'Timestamp']);
    }

    var name = e.parameter.name || '';
    var email = e.parameter.email || '';
    var mobile = e.parameter.mobile || '';
    var message = e.parameter.message || '';
    var timestamp = e.parameter.timestamp || new Date().toISOString();

    sheet.appendRow([name, email, mobile, message, timestamp]);

    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString(),
    }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function doGet() {
  return ContentService.createTextOutput('Form submission endpoint is active');
}
```
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Form submission endpoint is active');
}

function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Test function to verify sheet access
function testSheetAccess() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("Levi's form data");
  
  if (sheet) {
    Logger.log('Sheet found: ' + sheet.getName());
    Logger.log('Last row: ' + sheet.getLastRow());
  } else {
    Logger.log('Sheet not found - will be created on first submission');
  }
}
```

4. Click **Save** (disk icon) and give your project a name like "Form to Sheets"

## Step 3: Deploy the Script

1. Click on **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description**: Form Submission Handler (optional)
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. You may need to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Your Project Name] (unsafe)**
   - Click **Allow**
7. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

## Step 4: Update Your React Code

1. Open the file: `src/components/chat/ContactForm.tsx`
2. Find this line (around line 73):
   ```typescript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'` with your copied Web App URL:
   ```typescript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz.../exec';
   ```

## Step 5: Test the Form

1. Save your changes
2. Go to your application
3. Click on the "Form" button
4. Fill out the form and submit
5. Check your Google Sheet - you should see the new row with the submitted data!

## Troubleshooting

### Form submits but data doesn't appear in sheet:
- Make sure the Web App URL is correct
- Check that "Who has access" is set to "Anyone"
- Verify that you authorized the script properly

### Getting CORS errors:
- The code uses `mode: 'no-cors'` which should handle this
- If issues persist, make sure the script is deployed as a Web App

### Need to update the script:
1. Make your changes in the Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the edit icon (pencil) on your deployment
4. Click **Version** → **New version**
5. Click **Deploy**

## Additional Features You Can Add

### Email Notifications
Add this to your Google Apps Script to send email notifications:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    var newRow = [
      data.name,
      data.email,
      data.mobile,
      data.message || '',
      data.timestamp
    ];
    
    sheet.appendRow(newRow);
    
    // Send email notification
    MailApp.sendEmail({
      to: 'your-email@example.com',
      subject: 'New Form Submission',
      body: `New form submission received:\n\nName: ${data.name}\nEmail: ${data.email}\nMobile: ${data.mobile}\nMessage: ${data.message}`
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'message': 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Data Validation in Apps Script
You can add validation before saving:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.name || !data.email || !data.mobile) {
      return ContentService.createTextOutput(JSON.stringify({
        'result': 'error',
        'message': 'Missing required fields'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate email format
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return ContentService.createTextOutput(JSON.stringify({
        'result': 'error',
        'message': 'Invalid email format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var newRow = [
      data.name,
      data.email,
      data.mobile,
      data.message || '',
      data.timestamp
    ];
    
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success',
      'message': 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Security Notes

- The script runs with your Google account permissions
- Anyone with the URL can submit data (as configured)
- To restrict access, you can:
  - Add authentication tokens
  - Check referrer headers
  - Limit to specific domains
  - Add rate limiting

## Need Help?

If you encounter any issues:
1. Check the Apps Script execution logs: Click **Executions** in the left sidebar
2. Verify the Web App URL is correct
3. Make sure the Google Sheet is accessible to your account
4. Check browser console for any errors

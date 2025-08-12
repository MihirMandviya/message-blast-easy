# Template Management Feature

## Overview

The Template Management feature allows clients to create, view, and delete WhatsApp message templates using the theultimate.io WABA API. This feature provides a user-friendly interface for managing templates without needing to interact directly with the API.

## Features

### ✅ **Template Operations**
- **List Templates**: View all available templates for the client's WhatsApp Business Account
- **Create Templates**: Create new templates with various message types and components
- **Delete Templates**: Remove templates that are no longer needed
- **Template Details**: View comprehensive information about each template

### ✅ **Template Types Supported**
- **Text Templates**: Simple text-based templates
- **Media Templates**: Templates with image, video, or document headers
- **Interactive Templates**: Templates with buttons (Quick Reply, Call-to-Action)

### ✅ **Template Components**
- **Header**: Optional header text (supports variables)
- **Body**: Main message content (supports variables)
- **Footer**: Optional footer text
- **Buttons**: Interactive buttons (Quick Reply, URL, Phone Number)

## API Integration

### **Base API Endpoint**
```
https://theultimate.io/WAApi/template
```

### **API Operations**

#### 1. **List Templates (GET)**
```http
GET /template?userid={USER_ID}&password={PASSWORD}&wabaNumber={WABA_NUMBER}&output=json
```

**Headers:**
- `apikey`: API Key (optional)

**Query Parameters:**
- `userid`: Account user ID
- `password`: Account password
- `wabaNumber`: WhatsApp Business Number
- `output`: Response format (json)

#### 2. **Create Template (POST)**
```http
POST /template
```

**Headers:**
- `apikey`: API Key (optional)

**Body (Form Data):**
- `userid`: Account user ID
- `password`: Account password
- `wabaNumber`: WhatsApp Business Number
- `output`: json
- `msgType`: text/media
- `templateName`: Template name
- `templateDescription`: Template description
- `language`: Template language (en, es, fr, de)
- `category`: Template category (ACCOUNT_UPDATE, ISSUE_RESOLUTION, MARKETING, UTILITY)
- `header`: Template header (optional)
- `body`: Template body
- `footer`: Template footer (optional)
- `headerSample`: Header sample for variables (optional)
- `bodySample`: Body sample for variables (optional)
- `buttons`: JSON array for buttons (optional)

#### 3. **Delete Template (DELETE)**
```http
DELETE /template?userid={USER_ID}&password={PASSWORD}&wabaNumber={WABA_NUMBER}&output=json&templateName={TEMPLATE_NAME}&language={LANGUAGE}
```

**Headers:**
- `apikey`: API Key (optional)

**Query Parameters:**
- `userid`: Account user ID
- `password`: Account password
- `wabaNumber`: WhatsApp Business Number
- `output`: json
- `templateName`: Template name to delete
- `language`: Template language

## Template Categories

### **ACCOUNT_UPDATE**
- Used for account-related notifications
- Examples: Balance updates, account changes, security alerts

### **ISSUE_RESOLUTION**
- Used for customer support and issue resolution
- Examples: Ticket updates, resolution confirmations

### **MARKETING**
- Used for promotional content
- Examples: Product announcements, special offers

### **UTILITY**
- Used for general utility messages
- Examples: Appointment reminders, delivery updates

## Template Variables

Templates support dynamic variables using the format `{{1}}`, `{{2}}`, etc.

### **Example Template Body:**
```
Your account {{1}} has been credited with {{2}} on {{3}}.
```

### **Example Body Sample:**
```
Your account ACC123456 has been credited with $100.00 on 2024-01-15.
```

## Button Types

### **Quick Reply Buttons**
```json
[
  {
    "text": "YES",
    "type": "QUICK_REPLY"
  },
  {
    "text": "NO", 
    "type": "QUICK_REPLY"
  }
]
```

### **Call-to-Action Buttons**
```json
[
  {
    "text": "Visit Website",
    "type": "URL",
    "url": "https://example.com"
  },
  {
    "phone_number": "+1234567890",
    "text": "Call Us",
    "type": "PHONE_NUMBER"
  }
]
```

## Implementation Details

### **Frontend Components**
- `TemplateManagement.tsx`: Main template management page
- `useTemplates.tsx`: Custom hook for template operations

### **Database Integration**
- Templates are fetched directly from the WhatsApp API
- Client credentials are stored securely in the database
- RLS policies ensure data isolation between clients

### **Security Features**
- API credentials are stored encrypted in the database
- All API calls are made server-side to protect credentials
- RLS policies prevent cross-client data access

## Usage Flow

### **1. Access Template Management**
- Navigate to Template Management from the client dashboard
- System automatically fetches existing templates

### **2. Create New Template**
- Click "Create Template" button
- Fill in required fields (name, description, body)
- Add optional components (header, footer, buttons)
- Provide sample values for variables
- Submit to create template

### **3. View Templates**
- All templates are displayed in a card layout
- Status badges show approval status
- Template details are clearly visible

### **4. Delete Template**
- Click delete button on any template
- Confirm deletion in dialog
- Template is removed from WhatsApp Business Account

## Error Handling

### **Common Errors**
- **Invalid Credentials**: API credentials are incorrect or expired
- **Template Name Conflict**: Template name already exists
- **Invalid Category**: Category not allowed for the account
- **Network Issues**: Connection problems with the API

### **Error Display**
- Errors are shown in toast notifications
- Detailed error messages help with troubleshooting
- Loading states prevent multiple submissions

## Best Practices

### **Template Creation**
- Use clear, descriptive template names
- Keep body text concise and actionable
- Test templates with sample data before submission
- Follow WhatsApp's template guidelines

### **Variable Usage**
- Use meaningful variable placeholders
- Provide realistic sample values
- Keep variable count reasonable (max 10)

### **Button Design**
- Use clear, action-oriented button text
- Limit to 3 buttons per template
- Ensure URLs are valid and accessible

## Future Enhancements

### **Planned Features**
- Template editing capabilities
- Template approval status tracking
- Template usage analytics
- Bulk template operations
- Template versioning

### **Integration Opportunities**
- Template scheduling
- A/B testing for templates
- Template performance metrics
- Automated template optimization

## Technical Requirements

### **Dependencies**
- React 18+
- TypeScript
- Supabase for database operations
- Tailwind CSS for styling

### **API Requirements**
- Valid theultimate.io WABA API credentials
- Active WhatsApp Business Account
- Proper API permissions for template management

## Support

For technical support or questions about template management:
- Check the API documentation for detailed endpoint information
- Review WhatsApp Business API guidelines for template requirements
- Contact system administrator for credential issues

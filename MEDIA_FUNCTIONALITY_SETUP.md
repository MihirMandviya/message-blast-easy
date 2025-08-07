# Media Functionality Setup

## Overview
The media functionality allows users to manage their WhatsApp media files (images, videos, documents, and audio) by syncing data from the WhatsApp API and storing it in the database.

## Implementation Details

### 1. Database Table
Created a new `media` table with the following fields:
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to client_users)
- `client_id` (UUID, Foreign Key to client_users)
- `name` (TEXT, Unique identifier from API)
- `creation_time` (BIGINT, Timestamp from API)
- `description` (TEXT, Optional description)
- `media_type` (TEXT, Check constraint: 'image', 'video', 'doc', 'audio')
- `media_id` (TEXT, Media ID from API)
- `status` (TEXT, Default 'active')
- `waba_number` (BIGINT, Optional WABA number)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

### 2. API Integration
The system fetches media data from the WhatsApp API endpoint:
```
GET https://theultimate.io/WAApi/media?userid={{userID}}&output=json
```

Headers:
- `apiKey`: User's WhatsApp API key
- `Cookie`: SERVERID=webC1

### 3. Automatic Sync
- **Initial sync**: When the media page loads
- **Periodic sync**: Every 30 seconds automatically
- **Manual sync**: "Sync Media" button for immediate refresh
- **Data replacement**: Previous data is cleared and new data is inserted

### 4. Frontend Components

#### Media Hook (`useMedia.tsx`)
- Manages media state and API calls
- Handles authentication and error states
- Provides filtering and search functionality
- Automatic 30-second sync interval

#### Media Management Page (`MediaManagement.tsx`)
- Displays media items in a grid layout
- Filtering by type (image, video, doc, audio) and status
- Search functionality by name and description
- Tabbed interface for different media types
- Real-time sync status and last sync timestamp

### 5. Navigation
Added "Media" link to the sidebar navigation with Image icon.

### 6. Features

#### Media Display
- Grid layout with cards for each media item
- Icons for different media types
- Status badges (active/inactive)
- Creation date and time
- Media ID and WABA number display

#### Filtering & Search
- Filter by media type (All, Images, Videos, Documents, Audio)
- Filter by status (All, Active, Inactive)
- Search by name or description
- Real-time filtering results

#### Sync Management
- Automatic sync every 30 seconds
- Manual sync button
- Sync status indicators
- Error handling and display

### 7. API Response Format
The system expects the following JSON response format:
```json
{
  "status": "success",
  "mediaList": "[{\"identifier\":\"Test\",\"creationTime\":1748857833740,\"description\":\"Test Image\",\"mediaType\":\"image\",\"mediaId\":\"6317363186776558278\",\"wabaNumber\":919370853371,\"status\":\"active\"}]",
  "statusCode": "200",
  "reason": "success"
}
```

### 8. Security
- Row Level Security (RLS) enabled
- Users can only access their own media
- Proper foreign key constraints
- Authentication required for all operations

### 9. Error Handling
- API connection errors
- Authentication failures
- Data parsing errors
- Network timeouts
- User-friendly error messages

### 10. Performance
- Efficient database queries with proper indexing
- Debounced search functionality
- Optimized re-renders with useMemo
- Background sync without blocking UI

## Usage

1. **Access Media Management**: Navigate to `/media` in the application
2. **View Media**: All media items are displayed in a grid layout
3. **Filter Media**: Use the filter dropdowns to view specific types or statuses
4. **Search Media**: Use the search box to find specific media items
5. **Sync Media**: Click the "Sync Media" button to manually refresh data
6. **Monitor Sync**: Check the last sync timestamp and sync status

## Technical Notes

- The media data is completely replaced on each sync (not updated)
- API credentials are fetched from the current user's profile
- The system handles missing API credentials gracefully
- All timestamps are converted to readable format for display
- Media items are sorted by creation date (newest first)

## Future Enhancements

1. **Media Preview**: Add preview functionality for images and videos
2. **Bulk Operations**: Select multiple media items for bulk actions
3. **Media Upload**: Allow users to upload new media files
4. **Media Analytics**: Track media usage and performance
5. **Media Templates**: Create reusable media templates for campaigns
6. **Media Categories**: Add custom categorization for media items 
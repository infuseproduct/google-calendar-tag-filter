# Product Requirements Document: Google Calendar Tag Filter Plugin

## Overview
A WordPress plugin that embeds Google Calendar events with tag-based filtering capabilities. The plugin displays a single shared Google Calendar on a WordPress site, allowing content editors to control what events are shown through tags embedded in the event's location field.

## Problem Statement
Organizations need a flexible way to display calendar events on their WordPress sites with the ability to:
- Show different filtered views of the same calendar across multiple pages
- Filter events by categories/tags without maintaining multiple calendars
- Present events in different formats (calendar view vs. list view)
- Control the time period displayed (week, month, or year)
- Navigate between time periods without page reloads
- Show past events within the displayed period (not just future events)

## Solution
A WordPress plugin that:
1. Connects to Google Calendar via OAuth 2.0 authentication (read-only access)
2. Allows admin to select which calendar to display from their accessible calendars
3. Extracts tags from event description fields (format: `[[[CATEGORY]]]`)
4. Provides a category whitelist system with customizable display names and colors
5. Provides a shortcode system for embedding filtered calendar views
6. Supports multiple display formats (calendar/list) and time periods (week/month/year)
7. Implements AJAX-based navigation for instant period switching
8. Implements 1-minute caching to balance freshness with API limits
9. Displays times in user's browser timezone (French localization)
10. Provides optional category filter sidebar and display style toggle
11. Shows past and future events within the displayed period
12. Automatically adjusts text contrast for WCAG accessibility

## User Stories

### Story 1: Site Administrator Setup
**As a** site administrator
**I want to** configure the plugin with my Google Calendar access
**So that** content editors can embed calendar views without technical knowledge

**Acceptance Criteria:**
- Admin can navigate to plugin settings page
- Admin can click "Connect with Google" button
- Admin is redirected to Google OAuth consent screen
- After authorization, admin is redirected back to plugin settings
- Admin can select which calendar to display from a dropdown list of their accessible calendars
- Admin can manage category whitelist (add/remove categories with custom display names)
- Admin can set cache duration (default: 1 minute)
- Admin can disconnect/reconnect Google account
- OAuth tokens (access + refresh) are securely stored and auto-refreshed
- Admin is notified if authentication fails and needs re-authorization
- Settings are securely stored in WordPress database

### Story 2: Content Editor - Filtered Calendar View
**As a** content editor
**I want to** embed a calendar showing only events tagged with "Community"
**So that** visitors see relevant community events in a monthly calendar format

**Acceptance Criteria:**
- Editor adds shortcode: `[gcal_embed tags="COMMUNITY" view="calendar" period="month"]`
- Only events with `[[[TAG:COMMUNITY]]]` in description field are displayed
- Calendar shows current month with navigation arrows
- Mobile-responsive design displays correctly
- Events are clickable to show details in a modal/popup
- Event times display in visitor's browser timezone
- Empty state message shown if no events match the filter

### Story 3: Content Editor - List View for Multiple Tags
**As a** content editor
**I want to** display a list of upcoming events tagged with either "Workshop" or "Training"
**So that** visitors can see all educational opportunities

**Acceptance Criteria:**
- Editor adds shortcode: `[gcal_embed tags="WORKSHOP,TRAINING" view="list" period="year"]`
- Events with `[[[WORKSHOP]]]` OR `[[[TRAINING]]]` are shown
- Events with multiple tags (e.g., `[[[WORKSHOP]]][[[TRAINING]]]`) appear when filtering by either tag
- List displays all events for the current year in chronological order (maximum 100 events)
- Each event shows date, time, title, and description
- Times display in visitor's browser timezone (French 24-hour format)
- List is mobile-responsive
- Empty state message shown if no events match

### Story 4: Content Editor - Unfiltered Week View
**As a** content editor
**I want to** show all events for the current week
**So that** visitors see the full weekly schedule

**Acceptance Criteria:**
- Editor adds shortcode: `[gcal_embed view="calendar" period="week"]`
- All events (regardless of tags) are displayed
- Week view shows 7 days starting from current day
- Events show time slots clearly
- Navigation allows moving to next/previous weeks

### Story 5: Calendar Manager - Tag Organization
**As a** calendar manager
**I want to** add multiple tags to a single event
**So that** the event appears in multiple filtered views

**Acceptance Criteria:**
- Manager edits event in Google Calendar
- Manager adds `[[[COMMUNITY]]][[[WORKSHOP]]]` to description field
- Event appears when filtered by COMMUNITY, WORKSHOP, or both
- Only whitelisted categories are recognized (invalid tags are ignored)
- Description text can be added before/after tags
- Tags are not displayed to end users (stripped from description before display)
- Admins can see untagged and unknown-tag events with visual warnings (⚠️)

### Story 6: Site Visitor - Mobile Experience
**As a** site visitor on mobile
**I want to** view and interact with the calendar easily
**So that** I can find events on any device

**Acceptance Criteria:**
- Calendar is mobile-first and responsive
- Touch gestures work for navigation
- Event details display in readable format
- No horizontal scrolling required
- Performance is optimized with 1-minute caching
- Times automatically adjust to visitor's timezone
- Loading indicators shown during data fetch
- Error messages displayed clearly if connection fails

## Technical Requirements

### Architecture Components

#### 1. Authentication Module
- OAuth 2.0 authentication via Google Calendar API v3
- Scope: `https://www.googleapis.com/auth/calendar.readonly` (read-only access)
- OAuth flow:
  - Admin clicks "Connect with Google" in plugin settings
  - Redirect to Google OAuth consent screen
  - After authorization, receive authorization code
  - Exchange code for access token and refresh token
  - Store tokens securely in WordPress database (encrypted)
- Automatic token refresh using refresh token before expiration
- Calendar selection: Fetch list of accessible calendars and allow admin to choose
- Error handling for authentication failures with admin notifications
- Disconnect/reconnect functionality

#### 2. Calendar Service
- Fetch events from selected Google Calendar via API
- Parse event data (title, description, start, end, location)
- Extract tags from description field using regex: `\[\[\[TAG:([A-Z0-9_-]+)\]\]\]`
- Strip tags from description before displaying to users (create "clean" description)
- Validate tags against admin-defined whitelist (ignore invalid tags)
- Support recurring events (each instance treated separately)
- Cache events with 1-minute TTL using WordPress transients
- Handle API rate limits with exponential backoff
- Handle API errors with user-friendly error messages
- Timezone conversion: Store events in UTC, convert to user's browser timezone on frontend
- Location processing: Generate map links (Google Maps URL) from location text

#### 3. Tag Filter Engine
- Parse comma-separated tags from shortcode
- Filter events by matching ANY tag (OR logic)
- Match against whitelisted categories only
- Events with multiple tags match if ANY tag is in the filter
- Handle events with no tags (shown only in unfiltered views)
- Case-insensitive tag matching

#### 4. Display Components

**Calendar View:**
- Month view: Grid layout with day cells
- Week view: 7-day horizontal layout with time slots
- Navigation: Previous/Next buttons (client-side, no page reload)
- Event rendering: Color-coded by category, clickable
- Event details modal/popup showing:
  - Event title
  - Date and time (in user's browser timezone)
  - Description (with tags stripped out - `[[[TAG:xxx]]]` removed)
  - Location (if present, clickable link to open map in new tab)
  - Close button
- Times displayed in user's browser timezone (auto-detected)
- Empty state: "No events found" message
- Loading state: Spinner during data fetch
- Mobile-responsive grid

**List View:**
- Chronological event list (maximum 100 future events)
- Event cards showing:
  - Event title
  - Date and time (in user's browser timezone)
  - Description preview (truncated, with tags stripped - `[[[TAG:xxx]]]` removed)
  - Location (if present, clickable link to open map in new tab)
  - "Read more" to expand full details
- Times displayed in user's browser timezone
- Pagination for long lists (20 events per page)
- Empty state: "No events found" message
- Loading state: Skeleton cards during fetch
- Mobile-optimized layout

#### 5. Shortcode System

**Parameters:**

- `tags` (optional): Comma-separated list of whitelisted categories (e.g., "COMMUNITY,WORKSHOP")
- `view` (required): "calendar" or "list"
- `period` (required): "week", "month", or "future"

**Examples:**

```
[gcal_embed view="calendar" period="month"]
[gcal_embed tags="WORKSHOP" view="list" period="future"]
[gcal_embed tags="COMMUNITY,WORKSHOP" view="calendar" period="week"]
```

**Validation:**

- Invalid parameter values fallback to safe defaults
- Unknown tags are ignored with admin warning in logs
- Multiple shortcodes can exist on same page with independent caching

#### 6. Admin Interface

**Google Calendar Connection:**

- "Connect with Google" button initiating OAuth flow
- Display connection status (Connected/Disconnected)
- Show connected Google account email
- Calendar selector dropdown (populated after successful OAuth)
- "Disconnect" button to revoke access
- "Reconnect" button if authentication expires

**Category Whitelist Management:**

- Add new category: Input field + "Add Category" button
- Category list with columns:
  - Category ID (e.g., "COMMUNITY") - used in tags and shortcodes
  - Display Name (e.g., "Community Events") - shown to users
  - Color (color picker for calendar color-coding)
  - Actions (Edit, Delete)
- Validation: Category IDs must be uppercase alphanumeric with underscores/hyphens only
- Cannot delete categories currently in use (warning message)

**Cache Settings:**

- Cache duration slider (0-60 minutes, default: 1 minute)
- "Clear Cache Now" button for manual refresh
- Display cache statistics (last refresh time, cached events count)

**Other:**

- Connection test button (validates OAuth and fetches sample event)
- Error/success notifications using WordPress admin notices
- Localization ready with text domain `gcal-tag-filter`
- Help text/tooltips for each setting

### Technology Stack

- **Language:** PHP 7.4+
- **Framework:** WordPress Plugin API
- **Dependencies:**
  - Google API PHP Client (via Composer) for OAuth and Calendar API
  - WordPress HTTP API for caching (transients)
- **Frontend:**
  - Vanilla JavaScript (timezone detection, modal interactions, navigation)
  - CSS Grid/Flexbox for responsive layouts
  - Moment.js or similar for timezone conversions
- **Build Tools:** Composer for PHP dependencies
- **Google Cloud Console:** Required for OAuth 2.0 credentials setup

### Data Flow

**Initial Setup (One-time):**

1. Admin installs plugin
2. Admin navigates to plugin settings
3. Admin clicks "Connect with Google"
4. OAuth flow redirects to Google consent screen
5. User authorizes read-only calendar access
6. Plugin receives and stores OAuth tokens (encrypted)
7. Plugin fetches list of accessible calendars
8. Admin selects calendar to use
9. Admin configures category whitelist

**Page Load with Shortcode:**

1. Page loads with shortcode `[gcal_embed]`
2. Plugin checks WordPress transients cache for events (1-minute TTL)
3. If cache miss or expired:
   - Verify OAuth token validity (auto-refresh if needed)
   - Authenticate with Google Calendar API
   - Fetch events for requested period from selected calendar
   - Parse and extract tags from description field
   - Strip tags from description for display
   - Generate map links from location data
   - Store processed events in WordPress transients cache
4. Filter events by tags from shortcode (if specified)
5. Convert event times from UTC to user's browser timezone (client-side)
6. Render view (calendar or list) with loading states
7. Return HTML to WordPress content filter
8. Frontend JavaScript handles:
   - Timezone conversion for display
   - Modal interactions for event details
   - Navigation (prev/next month/week)
   - Map link generation

### Security Considerations

- **OAuth Token Storage:**
  - Access and refresh tokens encrypted before storing in WordPress database
  - Tokens stored in wp_options with restricted access
  - No tokens exposed to frontend/JavaScript
  - Tokens automatically refreshed server-side before expiration
- **Input Sanitization:**
  - Shortcode parameters sanitized and validated
  - Category IDs validated against whitelist
  - Admin input sanitized (category names, display names)
- **Output Escaping:**
  - All event content escaped before display (title, description, location)
  - HTML in descriptions sanitized to prevent XSS
  - URLs validated before generating map links
- **API Security:**
  - OAuth scope limited to read-only calendar access
  - API credentials never exposed to frontend
  - Rate limiting with exponential backoff
  - Error messages don't expose sensitive information
- **WordPress Security:**
  - Capability checks for admin functions (manage_options)
  - Nonce verification for all admin actions
  - HTTPS required for production (OAuth redirect requirement)
  - SQL injection prevention (using WordPress APIs)

### Performance Requirements

- **Caching Strategy:**
  - Events cached with 1-minute default TTL (configurable 0-60 minutes)
  - Cache key based on calendar ID + period + tags for granular caching
  - Manual cache clear option for immediate updates
  - WordPress transients API for cache storage
- **Frontend Optimization:**
  - Lazy load JavaScript for calendar interactions
  - Minified CSS and JS in production
  - Critical CSS inlined, non-critical deferred
  - Images/icons optimized and lazy-loaded
- **API Optimization:**
  - Batch API requests where possible
  - Only fetch events for requested time period
  - Exponential backoff on rate limit errors
  - Minimal API calls through aggressive caching
- **Performance Targets:**
  - Page load impact < 100ms (cached)
  - API response cached reduces load to ~50ms
  - First paint < 200ms
  - Time to interactive < 500ms

### Localization

- All strings wrapped in WordPress translation functions (`__()`, `_e()`, `esc_html__()`)
- Text domain: `gcal-tag-filter`
- Support for RTL languages
- Date/time format respects WordPress locale settings
- Month/day names localized via browser Intl API
- Timezone names localized
- Admin UI fully translatable
- .pot file generated for translators

## Plugin Structure

```
ccfhk-calendar-wp-plugin/
├── gcal-tag-filter.php              # Main plugin file
├── uninstall.php                     # Cleanup on uninstall
├── composer.json                     # PHP dependencies
├── README.md                         # Plugin documentation
├── .gitignore                        # Git ignore file
├── includes/
│   ├── class-gcal-oauth.php         # OAuth 2.0 authentication
│   ├── class-gcal-calendar.php      # Calendar API service
│   ├── class-gcal-parser.php        # Tag extraction and description cleaning
│   ├── class-gcal-cache.php         # Cache management (WordPress transients)
│   ├── class-gcal-shortcode.php     # Shortcode handler
│   └── class-gcal-categories.php    # Category whitelist management
├── admin/
│   ├── class-gcal-admin.php         # Admin settings page
│   ├── partials/
│   │   ├── oauth-settings.php       # OAuth connection UI
│   │   ├── category-manager.php     # Category whitelist UI
│   │   └── cache-settings.php       # Cache controls UI
│   ├── css/
│   │   └── admin.css                # Admin styles
│   └── js/
│       ├── admin.js                 # Admin interactions
│       └── color-picker.js          # Category color picker
├── public/
│   ├── class-gcal-display.php       # View rendering
│   ├── partials/
│   │   ├── calendar-view.php        # Calendar HTML template
│   │   ├── list-view.php            # List HTML template
│   │   └── event-modal.php          # Event details modal
│   ├── css/
│   │   ├── calendar-view.css        # Calendar styles
│   │   ├── list-view.css            # List styles
│   │   └── event-modal.css          # Modal styles
│   └── js/
│       ├── calendar-navigation.js   # Navigation and interactions
│       ├── timezone-handler.js      # Timezone detection and conversion
│       └── event-modal.js           # Modal open/close logic
├── languages/
│   └── gcal-tag-filter.pot          # Translation template
└── DOCS/
    ├── PRD-google-calendar-tag-filter.md
    ├── SETUP-google-cloud-console.md  # Google Cloud Console setup guide
    └── USAGE-guide.md                  # User documentation
```

## Success Metrics

- **Functionality:**
  - OAuth authentication succeeds with Google Calendar API
  - Plugin successfully fetches and displays events from selected calendar
  - Shortcode works with all parameter combinations
  - Tag filtering accurately filters events (100% accuracy)
  - Multiple tags per event work correctly
  - Category whitelist prevents invalid tags from appearing
- **Performance:**
  - Cache reduces API calls by 95%+ (with 1-minute TTL)
  - Page load impact < 100ms (cached)
  - Calendar interactions feel instant (< 50ms)
- **User Experience:**
  - Mobile responsive on all major devices and screen sizes
  - Event details modal displays correctly
  - Timezone conversion accurate for all timezones
  - Empty states and error messages display clearly
  - Map links work correctly from location field
- **Security:**
  - Zero security vulnerabilities in security audit
  - OAuth tokens properly encrypted in database
  - No XSS or SQL injection vulnerabilities
  - Admin functions properly restricted
- **Localization:**
  - All strings translatable
  - .pot file complete
  - Works correctly with at least 3 languages
  - RTL languages display correctly

## Future Enhancements (Out of Scope for v1)

- Multiple calendar support (display events from multiple calendars)
- Custom event templates (allow theme customization)
- Event registration forms (RSVP functionality)
- iCal export functionality (download events to user's calendar)
- Advanced filtering (date ranges, keyword search, AND logic)
- WordPress Widget support (sidebar calendar widget)
- Gutenberg Block Editor integration (visual block for calendar)
- Event reminders via email (subscribe to event notifications)
- URL deep linking (shareable links to specific month/week/filter)
- Calendar sync (two-way sync with WordPress posts)
- Custom color schemes (beyond category colors)
- Event attendee list display
- Google Meet/Zoom link display for virtual events

## Timeline Estimate

### Phase 1: Foundation (8 hours)

- Project setup & architecture: 2 hours
- OAuth 2.0 authentication module: 4 hours
- Google Cloud Console setup documentation: 2 hours

### Phase 2: Core Calendar Service (8 hours)

- Google Calendar API integration: 3 hours
- Tag parsing & description cleaning: 2 hours
- Cache management system: 2 hours
- Timezone handling: 1 hour

### Phase 3: Admin Interface (6 hours)

- OAuth connection UI: 2 hours
- Category whitelist manager: 3 hours
- Cache controls & settings: 1 hour

### Phase 4: Frontend Display (10 hours)

- Calendar view component: 5 hours
- List view component: 3 hours
- Event modal/details popup: 2 hours

### Phase 5: Integration & Polish (6 hours)

- Shortcode system: 2 hours
- Map link generation: 1 hour
- Loading & error states: 1 hour
- Localization: 2 hours

### Phase 6: Testing & Documentation (7 hours)

- Testing & bug fixes: 5 hours
- User documentation: 2 hours

### Total: ~45 hours

*Note: Timeline increased from 30 to 45 hours due to OAuth complexity, category whitelist UI, timezone handling, and enhanced UX requirements (modals, loading states, map links).*

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google API rate limits | High | Implement 1-minute caching, exponential backoff, monitor API quota |
| OAuth setup complexity for users | High | Provide detailed Google Cloud Console setup guide with screenshots and video tutorial |
| OAuth token expiration/refresh failures | Medium | Implement robust auto-refresh logic, clear error messages, easy reconnect flow |
| Mobile calendar view complexity | Medium | Mobile-first design approach, start with list view, enhance calendar progressively |
| Timezone conversion accuracy | Medium | Use established timezone library, test across multiple timezones, leverage browser Intl API |
| Tag parsing edge cases | Low | Use robust regex, validate against whitelist, handle malformed tags gracefully |
| WordPress version compatibility | Medium | Test on multiple WP versions (5.8+), set minimum version requirement, follow WP coding standards |
| Category whitelist UI usability | Low | Provide clear tooltips, validation messages, examples in admin UI |
| Performance with large calendars | Medium | Limit fetched events, implement pagination, optimize cache strategy |

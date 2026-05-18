# 📊 Architecture Diagram - Subscribe-to-Watch Feature

## **System Overview**

```
┌────────────────────────────────────────────────────────────────┐
│                    LEARNING MANAGEMENT SYSTEM                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     FRONTEND (React)                     │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────────────────┐ │   │
│  │  │            GoogleOAuthProvider (main.jsx)         │ │   │
│  │  │  clientId="YOUR_GOOGLE_CLIENT_ID"                 │ │   │
│  │  │  scope="youtube.readonly"                         │ │   │
│  │  │                                                   │ │   │
│  │  │  ┌─────────────────────────────────────────────┐ │ │   │
│  │  │  │  LessonPage / Screen Component              │ │ │   │
│  │  │  │                                             │ │ │   │
│  │  │  │  ┌───────────────────────────────────────┐ │ │ │   │
│  │  │  │  │        VideoGuard Component           │ │ │ │   │
│  │  │  │  │                                       │ │ │ │   │
│  │  │  │  │ State:                                │ │ │ │   │
│  │  │  │  │ - isSubscribed                        │ │ │ │   │
│  │  │  │  │ - isLoading                           │ │ │ │   │
│  │  │  │  │ - error                               │ │ │ │   │
│  │  │  │  │ - hasLoggedIn                         │ │ │ │   │
│  │  │  │  │ - userInfo (access_token)             │ │ │ │   │
│  │  │  │  │ - channelInfo                         │ │ │ │   │
│  │  │  │  │                                       │ │ │ │   │
│  │  │  │  │ Hàm:                                  │ │ │ │   │
│  │  │  │  │ - checkSubscription()                 │ │ │ │   │
│  │  │  │  │ - getChannelInfo()                    │ │ │ │   │
│  │  │  │  │ - handleVerifyAgain()                 │ │ │ │   │
│  │  │  │  │                                       │ │ │ │   │
│  │  │  │  │ UI:                                   │ │ │ │   │
│  │  │  │  │ ├─ Loading Spinner                    │ │ │ │   │
│  │  │  │  │ ├─ Login Button                       │ │ │ │   │
│  │  │  │  │ ├─ Lock Screen                        │ │ │ │   │
│  │  │  │  │ └─ Video Player (ReactPlayer)         │ │ │ │   │
│  │  │  │  └───────────────────────────────────────┘ │ │ │   │
│  │  │  └─────────────────────────────────────────────┘ │ │   │
│  │  └───────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         ↓↑                                      │
│                    HTTP Request/Response                        │
│                    (axios httpClient)                           │
│                         ↓↑                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   BACKEND (Express.js)                   │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────────────────┐ │   │
│  │  │           youtubeRoutes.js                        │ │   │
│  │  │                                                   │ │   │
│  │  │  POST /api/youtube/check-subscription            │ │   │
│  │  │  POST /api/youtube/channel-info                  │ │   │
│  │  │                                                   │ │   │
│  │  │  ↓ Routes to                                      │ │   │
│  │  │                                                   │ │   │
│  │  │  ┌────────────────────────────────────────────┐  │ │   │
│  │  │  │    youtubeController.js                    │  │ │   │
│  │  │  │                                            │  │ │   │
│  │  │  │  checkSubscription() {                     │  │ │   │
│  │  │  │    1. Get access_token from request        │  │ │   │
│  │  │  │    2. Create OAuth2 client                 │  │ │   │
│  │  │  │    3. Initialize youtube API               │  │ │   │
│  │  │  │    4. Call youtube.subscriptions.list()    │  │ │   │
│  │  │  │    5. Check if user subscribed             │  │ │   │
│  │  │  │    6. Return { isSubscribed: T/F }         │  │ │   │
│  │  │  │  }                                          │  │ │   │
│  │  │  │                                            │  │ │   │
│  │  │  │  getChannelInfo() {                        │  │ │   │
│  │  │  │    1. Get channel data from YouTube API    │  │ │   │
│  │  │  │    2. Return channel name, subscribers...  │  │ │   │
│  │  │  │  }                                          │  │ │   │
│  │  │  └────────────────────────────────────────────┘  │ │   │
│  │  └───────────────────────────────────────────────────┘ │   │
│  │                         ↓↑                             │   │
│  │                   HTTPS Request/Response              │   │
│  │              (googleapis npm package)                 │   │
│  │                         ↓↑                             │   │
│  │  ┌───────────────────────────────────────────────────┐ │   │
│  │  │        YouTube Data API v3 (Google)              │ │   │
│  │  │  https://www.googleapis.com/youtube/v3/...       │ │   │
│  │  │                                                   │ │   │
│  │  │  ✓ subscriptions.list()                          │ │   │
│  │  │  ✓ channels.list()                               │ │   │
│  │  │  ✓ etc...                                         │ │   │
│  │  └───────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## **Request/Response Flow**

```
CLIENT (Browser)                    SERVER (Backend)               GOOGLE
────────────────                    ─────────────────              ──────

User clicks video
    ↓
VideoGuard renders
    ↓
Is logged in?
    ├─ NO → Show "Đăng nhập" button
    │       User clicks button
    │       ↓
    │       Google OAuth Popup
    │       ↓
    │       User selects account
    │       ↓
    │       Returns access_token
    │
    └─ YES → Send POST with access_token
             ──────────────────────────→ youtubeController
                                         ↓
                                         Create OAuth2 client
                                         ↓
                                         Initialize youtube API
                                         ↓
                                         subscriptions.list({
                                           mine: true,
                                           forChannelId: CHANNEL_ID
                                         })
                                         ─────────────────────→ YouTube API
                                                                   ↓
                                                                   Check if
                                                                   subscribed
                                                                   ↓
                                         Response items[]
                                         ←──────────────────────
                                         ↓
                                         Check: items.length > 0?
                                         ↓
             Response: { isSubscribed }
             ←──────────────────────────
             ↓
             Update state
             ↓
             Render UI:
             ├─ isSubscribed = true
             │  └─ Show video player
             │
             └─ isSubscribed = false
                └─ Show lock message
                   + Subscribe link
                   + Verify again button
```

---

## **Component State Diagram**

```
┌──────────────────────────────────────┐
│    VideoGuard Initial State          │
│ ├─ hasLoggedIn = false              │
│ ├─ isSubscribed = false              │
│ ├─ isLoading = false                 │
│ └─ error = null                      │
└─────────────┬──────────────────────────┘
              │
              ↓ User clicks "Đăng nhập"
              │
         Google OAuth
              │
              ↓ Success
              │
┌──────────────────────────────────────┐
│    User Logged In                    │
│ ├─ hasLoggedIn = true               │
│ ├─ userInfo = { access_token }      │
│ └─ isLoading = true                  │
└─────────────┬──────────────────────────┘
              │
              ↓ Call API check-subscription
              │
         Backend validates
              │
              ↓ Response received
         ┌────┴────┐
         │         │
         ↓ True    ↓ False
         │         │
    ┌────────┐  ┌──────────┐
    │Subscribe│  │Not Subscribe│
    │ed ✅   │  │d ❌        │
    │         │  │           │
    │isLoaded │  │isLoaded   │
    │= false  │  │= false    │
    │isSubsc. │  │isSubsc.   │
    │= true   │  │= false    │
    └────────┘  └──────────┘
        │           │
        ↓           ↓ Click "Kiểm tra lại"
        │           │
        │      API call again
        │           │
        └───────────┘
```

---

## **File Dependencies**

```
main.jsx
├── Imports GoogleOAuthProvider
├── Sets REACT_APP_GOOGLE_CLIENT_ID env var
└── Wraps entire app

App.jsx
└── Renders routes

LessonPage.jsx (or any page)
├── Imports VideoGuard
└── Renders <VideoGuard youtubeUrl=... />

VideoGuard.jsx
├── Imports useGoogleLogin
├── Imports ReactPlayer
├── Imports httpClient (axios)
└── Manages all states and UI

backend/src/routes/index.js
├── Imports youtubeRoutes
└── router.use('/youtube', youtubeRoutes)

backend/src/routes/youtubeRoutes.js
├── Imports youtubeController
├── Defines POST /api/youtube/check-subscription
└── Defines POST /api/youtube/channel-info

backend/src/controllers/youtubeController.js
├── Imports googleapis
├── Defines checkSubscription()
└── Defines getChannelInfo()

Environment Variables:
├── Frontend:
│   ├── REACT_APP_GOOGLE_CLIENT_ID (from .env)
│   └── VITE_API_URL (from .env)
│
└── Backend:
    ├── YOUTUBE_CHANNEL_ID (from .env)
    ├── PORT (from .env)
    └── Other DB config (from .env)
```

---

## **Authentication Flow Diagram**

```
BEFORE: No Token
┌─────────────────────────────────┐
│ User: Not logged in             │
│ Access: Can't call YouTube API  │
│ Display: Lock screen            │
└─────────────────────────────────┘

DURING: Google OAuth
┌─────────────────────────────────┐
│ User: Selecting Google account  │
│ OAuth: Requesting access        │
│ Scopes: youtube.readonly        │
└─────────────────────────────────┘
            ↓
       Google verifies
            ↓
    User grants permission
            ↓
     Access token issued

AFTER: Got Token
┌─────────────────────────────────┐
│ Token: ya29.a0AfH6SMBx...       │
│ Scope: youtube.readonly         │
│ Expires: ~1 hour                │
│ Storage: In React state only    │
└─────────────────────────────────┘
            ↓
      Send to backend
            ↓
  Backend validates with Google
            ↓
      YouTube API response
            ↓
  Check subscription status
            ↓
  Return { isSubscribed: T/F }
            ↓
   Frontend updates UI
```

---

## **Detailed Sequence Diagram**

```
Frontend                  Backend                    YouTube
   │                        │                           │
   │  1. User clicks "Login" │                          │
   │◄─────────────────────────────────────────────────►│
   │  2. Google OAuth Dialog                           │
   │                    (Google handles this)          │
   │                        │                           │
   │  3. User grants permission                        │
   │◄─────────────────────────────────────────────────►│
   │  4. Receive access_token                          │
   │────────────────────────►│                          │
   │                         │  POST /api/youtube/check
   │                         │  Body: { access_token }
   │                         ├────────────────────────►│
   │                         │  5. OAuth2 client       │
   │                         │     initialized         │
   │                         │
   │                         │  6. Call subscriptions
   │                         │     .list()
   │                         ├────────────────────────►│
   │                         │  7. Validate token      │
   │                         │  8. Check if subscribed │
   │                         │  9. Return items[]      │
   │                         │◄────────────────────────┤
   │                         │  10. items.length > 0?  │
   │                         │      YES → isSubsc=true │
   │                         │      NO  → isSubsc=false│
   │  11. Response           │
   │◄────────────────────────┤
   │  { isSubscribed: true } │
   │  12. Update UI          │
   │      Show video         │
   │
```

---

## **Error Handling Flow**

```
API Call
    ↓
Try block
    │
    ├─ Success
    │   └─ Update state
    │
    └─ Error
        │
        ├─ "invalid_grant"
        │   └─ Token expired/invalid
        │       └─ Show: "Hãy đăng nhập lại"
        │
        ├─ "CORS error"
        │   └─ Configuration wrong
        │       └─ Show: "Lỗi cấu hình"
        │
        ├─ "Network error"
        │   └─ Backend down
        │       └─ Show: "Lỗi kết nối"
        │
        └─ Other error
            └─ Unexpected
                └─ Show: Generic error message

Catch block
    ↓
setError(error.message)
    ↓
Display error to user
```

---

## **State Tree**

```
VideoGuard
├── States
│   ├── isSubscribed (boolean)
│   │   ├── true → Show video
│   │   └─ false → Show lock
│   │
│   ├── isLoading (boolean)
│   │   ├── true → Show spinner
│   │   └─ false → Show normal UI
│   │
│   ├── error (string|null)
│   │   ├── null → No error
│   │   └─ "Error message" → Show error
│   │
│   ├── hasLoggedIn (boolean)
│   │   ├── false → Show login button
│   │   └─ true → Check subscription
│   │
│   ├── userInfo (object|null)
│   │   └── { access_token, ... }
│   │
│   └── channelInfo (object|null)
│       ├── channelName
│       ├── subscriberCount
│       ├── channelThumbnail
│       ├── videoCount
│       └── channelUrl
│
└── Functions
    ├── checkSubscription(token)
    │   └─ Calls API
    │
    ├── getChannelInfo(token)
    │   └─ Gets channel data
    │
    ├── handleVerifyAgain()
    │   └─ Re-check subscription
    │
    └── login() [Google OAuth]
        └─ Triggers Google dialog
```

---

## **Data Flow Summary**

```
┌────────────────┐
│   User Input   │
│  (Click Video) │
└────────┬───────┘
         │
         ↓
┌────────────────────────┐
│  VideoGuard Component   │
│  Check Login Status     │
└────────┬───────────────┘
         │
    ┌────┴─────┐
    │           │
    ↓           ↓
  NOT        LOGGED
  LOGGED      IN
    │           │
    ↓           ↓
┌────────┐  ┌──────────────────┐
│ Login  │  │ Check Subsc. API │
│Button  │  │ POST /youtube/.. │
└────┬───┘  └────────┬─────────┘
     │               │
     ↓               ↓
┌─────────────┐   ┌──────────────────┐
│Google OAuth │   │ Backend Validates │
│   Dialog    │   │ YouTube API Call  │
└────┬────────┘   └────────┬─────────┘
     │                     │
     ↓                     ↓
┌──────────────┐   ┌──────────────────┐
│access_token  │   │{ isSubscribed: } │
│Received      │   │T/F Response      │
└────┬─────────┘   └────────┬─────────┘
     │                     │
     └─────────┬───────────┘
               │
               ↓
        ┌──────────────┐
        │  Update UI   │
        │ Show Video   │
        │ OR Lock      │
        └──────────────┘
```

---

**Diagram Version**: 1.0  
**Last Updated**: 2026  
**Format**: ASCII Art with Descriptions

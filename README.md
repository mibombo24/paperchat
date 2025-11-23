# 🎮 TapChatter - Discord-like Social Platform

A feature-rich social platform inspired by Discord and Snapchat, built with vanilla HTML, CSS, and JavaScript.

## ✨ Features

### 🔐 User Accounts
- **Username + Tag System**: Create accounts with unique usernames and numeric tags (e.g., `Username#1234`)
- **Authentication**: Secure login and registration system
- **Privacy**: No phone numbers required - maintain anonymity

### 👥 Friends System
- **Friend Requests**: Send and accept friend requests using username#tag
- **Friend List**: Manage your personal friend connections
- **User Search**: Find users by their unique username and tag combination
- **Status Indicators**: See when friends are online, idle, DND, or offline

### 💬 Direct Messaging (DMs)
- **Private Chats**: One-on-one text conversations with friends
- **Real-time Messaging**: Send and receive messages instantly
- **Rich Content**: Share text, emojis, images, and files
- **Chat History**: All your conversations are saved locally

### 🎭 Communication Features
- **Text Chat**: Primary communication with emoji and GIF support
- **Voice Calls**: Simulated voice calling feature (UI demonstration)
- **Video Calls**: Simulated video calling feature (UI demonstration)
- **Screen Sharing**: Simulated screen sharing feature (UI demonstration)

### 🏰 Servers & Communities
- **Create Servers**: Build your own topic-based communities
- **Join Servers**: Connect with like-minded people
- **Server Management**: Customize your server with icons and names
- **Member System**: Track server members and their status

### 📺 Channels
- **Text Channels**: Organized discussion topics within servers
- **Voice Channels**: Dedicated spaces for voice communication
- **Channel Creation**: Easily add new channels to your servers
- **Channel Categories**: Organized by type (text/voice)

### 🎨 Customization
- **Custom Avatars**: Set emoji avatars to express yourself
- **Status Messages**: Share what you're up to with custom statuses
- **User Profiles**: Personalize your presence in chats and servers
- **Multiple Status Types**: Online, Idle, Do Not Disturb, Invisible

### 📤 Content Sharing
- **Image Sharing**: Upload and share photos in conversations
- **File Attachments**: Send files to friends and channels
- **Preview Images**: Click to view images in full size
- **Multimedia Support**: Share various file types

### 🔔 Notifications
- **Friend Requests**: Get notified when someone wants to connect
- **Message Alerts**: Customizable message notifications
- **Mention Notifications**: Never miss when you're mentioned
- **Settings Control**: Configure notification preferences

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or installation required!

### Installation

1. **Clone or Download** this repository to your computer

2. **Open the Application**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js with http-server
     npx http-server
     ```

3. **Create an Account**
   - Click "Register" on the login screen
   - Enter a username (letters, numbers, underscore only)
   - Create a password (minimum 6 characters)
   - You'll receive a unique tag (e.g., `#1234`)

4. **Start Chatting!**
   - Add friends using their username#tag
   - Create servers for group conversations
   - Customize your profile and status

## 📖 How to Use

### Adding Friends
1. Click the **+** button next to "Direct Messages"
2. Enter the friend's username and tag (e.g., `FriendName#5678`)
3. Send the friend request
4. Wait for them to accept

### Creating a Server
1. Click the **+** icon in the server list (left sidebar)
2. Enter a server name
3. Choose an emoji icon
4. Click "Create"

### Creating Channels
1. Open a server
2. Click the **+** button next to "TEXT CHANNELS" or "VOICE CHANNELS"
3. Enter a channel name
4. Click "Create"

### Sending Messages
1. Select a friend or channel
2. Type your message in the input box at the bottom
3. Press **Enter** or click the send button
4. Use the 📎 button to attach images/files
5. Use the 😊 button to add emojis

### Customizing Your Profile
1. Click the ⚙️ (Settings) button in the bottom left
2. Change your avatar (use any emoji)
3. Set a custom status message
4. Configure notification preferences

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Structure and semantics
- **CSS3**: Styling and animations
- **Vanilla JavaScript**: All functionality (no frameworks!)
- **LocalStorage**: Data persistence (client-side only)

### Data Storage
All data is stored locally in your browser using LocalStorage:
- User accounts and credentials
- Messages and chat history
- Server and channel data
- Friend lists and requests

**Note**: This is a demo application. In production:
- Passwords should be hashed (never stored in plain text)
- Use a real backend server and database
- Implement proper authentication (JWT, OAuth)
- Add real-time communication (WebSockets, WebRTC)

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎯 Features Explained

### Username + Tag System
Unlike phone-based systems, TapChatter uses Discord's username#tag format:
- **Username**: Your chosen display name
- **Tag**: A random 4-digit number (e.g., #1234)
- **Combined**: Creates unique identifiers like `CoolUser#5678`

### Server Architecture
Servers act as communities where multiple people can gather:
- **Channels**: Organize conversations by topic
- **Members**: See who's in your server
- **Customization**: Each server has its own identity

### Status System
Let friends know your availability:
- 🟢 **Online**: Active and available
- 🟡 **Idle**: Away from keyboard
- 🔴 **Do Not Disturb**: Don't want to be bothered
- ⚫ **Invisible**: Appear offline to others

## 🔒 Privacy & Security

### Current Implementation (Demo)
- ⚠️ Passwords stored in plain text (LocalStorage)
- ⚠️ No encryption for messages
- ⚠️ No server-side validation
- ⚠️ Data stored locally in browser

### Production Recommendations
For a real-world application, implement:
- ✅ Password hashing (bcrypt, Argon2)
- ✅ HTTPS/TLS encryption
- ✅ Server-side validation
- ✅ Database storage (PostgreSQL, MongoDB)
- ✅ End-to-end encryption for messages
- ✅ Rate limiting and spam prevention
- ✅ OAuth integration
- ✅ WebRTC for real voice/video calls

## 📱 Responsive Design

The interface adapts to different screen sizes:
- **Desktop**: Full experience with all panels
- **Tablet**: Optimized layout
- **Mobile**: Members panel hidden on small screens

## 🎨 Customization

### Changing Colors
Edit `styles.css` to modify the color scheme:
```css
/* Primary colors */
--primary: #5865f2;
--background: #36393f;
--secondary: #2f3136;
```

### Adding Features
The modular JavaScript structure makes it easy to add features:
- `app.js`: All functionality is organized by feature
- Add new functions for additional capabilities
- Extend the data models for more properties

## 🐛 Known Limitations

This is a demo/prototype application:
- No real backend server
- No real-time synchronization between users
- Voice/video calls are simulated (UI only)
- Screen sharing is simulated (UI only)
- Bot integration not implemented
- No message encryption
- Limited to single-browser use

## 🚀 Future Enhancements

Potential features for expansion:
- [ ] Real backend with Node.js/Express
- [ ] WebSocket integration for real-time messaging
- [ ] WebRTC for actual voice/video calls
- [ ] User roles and permissions
- [ ] Message reactions and threads
- [ ] Rich text formatting
- [ ] Code syntax highlighting
- [ ] Bot API and integrations
- [ ] Mobile app versions
- [ ] Message search functionality
- [ ] Server invites and discovery

## 📄 License

This project is open source and available for educational purposes. Feel free to modify and use as needed.

## 🤝 Contributing

This is a demo project, but suggestions and improvements are welcome!

## 💡 Learning Resources

Built this project to demonstrate:
- Modern JavaScript ES6+ features
- DOM manipulation and event handling
- LocalStorage API usage
- CSS Grid and Flexbox layouts
- Responsive design principles
- User authentication flows
- Real-time chat UX patterns

## 📞 Support

For questions or issues:
- Review the code comments in `app.js`
- Check browser console for errors
- Ensure LocalStorage is enabled in your browser

## 🎓 Credits

Inspired by:
- **Discord**: Server/channel architecture
- **Snapchat**: Username system and ephemeral messaging concepts
- **Modern chat apps**: UI/UX patterns and best practices

---

**Enjoy using TapChatter! Connect with friends and build your communities! 🎮💬**

// PaperChat - Discord-like Social Platform
// State Management
let currentUser = null;
let currentChat = null;
let currentServer = null;
let users = [];
let messages = {};
let servers = [];
let friendRequests = [];
let voiceState = {
    inCall: false,
    channel: null,
    server: null,
    isMuted: false,
    isDeafened: false,
    participants: []
};

// Initialize app
function init() {
    loadData();
    checkAuth();
    initializeResizers();
}

// Panel Resizing Functionality
function initializeResizers() {
    const resizeSidebar = document.getElementById('resize-sidebar');
    const resizeMembers = document.getElementById('resize-members');
    const appContainer = document.querySelector('.app-container');
    
    let isResizing = false;
    let currentResizer = null;
    
    // Load saved widths
    const savedSidebarWidth = localStorage.getItem('paperchat_sidebar_width') || '280px';
    const savedMembersWidth = localStorage.getItem('paperchat_members_width') || '260px';
    appContainer.style.setProperty('--sidebar-width', savedSidebarWidth);
    appContainer.style.setProperty('--members-width', savedMembersWidth);
    
    // Sidebar resizer
    if (resizeSidebar) {
        resizeSidebar.addEventListener('mousedown', (e) => {
            isResizing = true;
            currentResizer = 'sidebar';
            resizeSidebar.classList.add('resizing');
            document.body.classList.add('resizing');
            e.preventDefault();
        });
    }
    
    // Members resizer
    if (resizeMembers) {
        resizeMembers.addEventListener('mousedown', (e) => {
            isResizing = true;
            currentResizer = 'members';
            resizeMembers.classList.add('resizing');
            document.body.classList.add('resizing');
            e.preventDefault();
        });
    }
    
    // Mouse move handler
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const containerRect = appContainer.getBoundingClientRect();
        
        if (currentResizer === 'sidebar') {
            const newWidth = e.clientX - containerRect.left - 20; // 20px for padding
            if (newWidth >= 200 && newWidth <= 500) {
                const widthPx = `${newWidth}px`;
                appContainer.style.setProperty('--sidebar-width', widthPx);
                localStorage.setItem('paperchat_sidebar_width', widthPx);
            }
        } else if (currentResizer === 'members') {
            const newWidth = containerRect.right - e.clientX - 20; // 20px for padding
            if (newWidth >= 180 && newWidth <= 400) {
                const widthPx = `${newWidth}px`;
                appContainer.style.setProperty('--members-width', widthPx);
                localStorage.setItem('paperchat_members_width', widthPx);
            }
        }
    });
    
    // Mouse up handler
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            currentResizer = null;
            document.body.classList.remove('resizing');
            if (resizeSidebar) resizeSidebar.classList.remove('resizing');
            if (resizeMembers) resizeMembers.classList.remove('resizing');
        }
    });
}

// Data Persistence
function loadData() {
    // Try to load from JSON files first, fallback to localStorage
    const storedUsers = localStorage.getItem('paperchat_users');
    const storedMessages = localStorage.getItem('paperchat_messages');
    const storedServers = localStorage.getItem('paperchat_servers');
    const storedFriendRequests = localStorage.getItem('paperchat_friend_requests');
    
    users = storedUsers ? JSON.parse(storedUsers) : [];
    messages = storedMessages ? JSON.parse(storedMessages) : {};
    servers = storedServers ? JSON.parse(storedServers) : [];
    friendRequests = storedFriendRequests ? JSON.parse(storedFriendRequests) : [];
}

function saveData() {
    localStorage.setItem('paperchat_users', JSON.stringify(users));
    localStorage.setItem('paperchat_messages', JSON.stringify(messages));
    localStorage.setItem('paperchat_servers', JSON.stringify(servers));
    localStorage.setItem('paperchat_friend_requests', JSON.stringify(friendRequests));
    
    // Also save messages to downloadable JSON
    saveMessagesToJSON();
}

function saveMessagesToJSON() {
    const data = {
        users: users,
        messages: messages,
        servers: servers,
        friendRequests: friendRequests,
        lastUpdated: new Date().toISOString()
    };
    
    // Store in localStorage as well for backup
    localStorage.setItem('paperchat_backup', JSON.stringify(data));
}

function exportData() {
    const data = {
        users: users,
        messages: messages,
        servers: servers,
        friendRequests: friendRequests,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paperchat_data_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.users) users = data.users;
            if (data.messages) messages = data.messages;
            if (data.servers) servers = data.servers;
            if (data.friendRequests) friendRequests = data.friendRequests;
            
            saveData();
            showNotification('Data imported successfully!');
            
            // Reload the app
            if (currentUser) {
                loadFriendsList();
                loadServersList();
                if (currentChat) {
                    loadMessages();
                }
            }
        } catch (error) {
            showNotification('Error importing data: Invalid JSON file');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

function checkAuth() {
    const savedUser = localStorage.getItem('paperchat_current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        // Ensure banner fields exist
        if (!currentUser.banner) {
            currentUser.banner = 'none';
        }
        if (!currentUser.customBanner) {
            currentUser.customBanner = null;
        }
        // Grant Pro status
        currentUser.isPro = true;
        currentUser.proExpiry = 'lifetime';
        currentUser.donationConfirmation = 'OWNER';
        currentUser.donatedAmount = 0;
        currentUser.donationDate = new Date().toISOString();
        
        // Update in storage
        localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
        
        showApp();
    }
}

// Authentication Functions
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

function register() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    
    // Validation
    if (!username || !password || !confirm) {
        errorEl.textContent = 'All fields are required';
        errorEl.style.display = 'block';
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errorEl.textContent = 'Username can only contain letters, numbers, and underscores';
        errorEl.style.display = 'block';
        return;
    }
    
    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        errorEl.style.display = 'block';
        return;
    }
    
    // Check if username exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        errorEl.textContent = 'Username already exists';
        errorEl.style.display = 'block';
        return;
    }
    
    // Generate unique tag
    const tag = String(Math.floor(1000 + Math.random() * 9000));
    
    // Create user
    const newUser = {
        id: Date.now().toString(),
        username: username,
        tag: tag,
        password: password, // In production, this should be hashed!
        avatar: '👤',
        status: 'online',
        customStatus: '',
        banner: 'none',
        customBanner: null,
        isPro: false,
        proExpiry: null,
        friends: [],
        servers: [],
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveData();
    
    successEl.textContent = `Account created! Your username is ${username}#${tag}`;
    successEl.style.display = 'block';
    
    // Clear form
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-confirm').value = '';
    
    // Auto switch to login after 2 seconds
    setTimeout(() => {
        switchAuthTab('login');
        document.getElementById('login-username').value = `${username}#${tag}`;
    }, 2000);
}

function login() {
    const usernameTag = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    
    errorEl.style.display = 'none';
    
    if (!usernameTag || !password) {
        errorEl.textContent = 'All fields are required';
        errorEl.style.display = 'block';
        return;
    }
    
    // Parse username and tag
    const parts = usernameTag.split('#');
    if (parts.length !== 2) {
        errorEl.textContent = 'Invalid format. Use Username#1234';
        errorEl.style.display = 'block';
        return;
    }
    
    const username = parts[0];
    const tag = parts[1];
    
    // Find user
    const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.tag === tag
    );
    
    if (!user) {
        errorEl.textContent = 'User not found';
        errorEl.style.display = 'block';
        return;
    }
    
    if (user.password !== password) {
        errorEl.textContent = 'Incorrect password';
        errorEl.style.display = 'block';
        return;
    }
    
    // Login successful
    currentUser = user;
    currentUser.status = 'online';
    saveData();
    localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    
    showApp();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser.status = 'offline';
        saveData();
        localStorage.removeItem('paperchat_current_user');
        currentUser = null;
        currentChat = null;
        currentServer = null;
        
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('app-screen').classList.remove('active');
    }
}

function showApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    
    // Set user info
    document.getElementById('current-username').textContent = `${currentUser.username}#${currentUser.tag}`;
    document.getElementById('status-select').value = currentUser.status;
    
    // Update avatar and banner display
    updateAvatarDisplay();
    updateBannerDisplay();
    
    // Load friends and servers
    loadFriendsList();
    loadServersList();
    checkFriendRequests();
    
    // Show home view
    showHome();
}

// Friends System
function loadFriendsList() {
    const friendsList = document.getElementById('friends-list');
    friendsList.innerHTML = '';
    
    if (currentUser.friends.length === 0) {
        friendsList.innerHTML = '<div style="padding: 16px; color: #72767d; font-size: 13px; text-align: center;">No friends yet. Add some!</div>';
        return;
    }
    
    currentUser.friends.forEach(friendId => {
        const friend = users.find(u => u.id === friendId);
        if (friend) {
            const friendEl = document.createElement('div');
            friendEl.className = 'friend-item';
            friendEl.onclick = () => openDM(friend);
            
            const statusClass = friend.status === 'online' ? '' : 
                               friend.status === 'idle' ? 'idle' : 
                               friend.status === 'dnd' ? 'dnd' : 'offline';
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = `friend-avatar ${statusClass}`;
            
            if (friend.customAvatar) {
                avatarDiv.style.backgroundImage = `url('${friend.customAvatar}')`;
                avatarDiv.style.backgroundSize = 'cover';
                avatarDiv.style.backgroundPosition = 'center';
            } else {
                avatarDiv.textContent = friend.avatar;
            }
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'friend-name';
            nameDiv.textContent = friend.username;
            
            friendEl.appendChild(avatarDiv);
            friendEl.appendChild(nameDiv);
            friendsList.appendChild(friendEl);
        }
    });
}

function showAddFriendModal() {
    document.getElementById('add-friend-modal').classList.add('active');
    document.getElementById('friend-username-input').value = '';
    document.getElementById('add-friend-result').innerHTML = '';
}

function sendFriendRequest() {
    const usernameTag = document.getElementById('friend-username-input').value.trim();
    const resultEl = document.getElementById('add-friend-result');
    
    if (!usernameTag) {
        resultEl.innerHTML = '<p style="color: #ed4245;">Please enter a username</p>';
        return;
    }
    
    const parts = usernameTag.split('#');
    if (parts.length !== 2) {
        resultEl.innerHTML = '<p style="color: #ed4245;">Invalid format. Use Username#1234</p>';
        return;
    }
    
    const username = parts[0];
    const tag = parts[1];
    
    // Find user
    const targetUser = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.tag === tag
    );
    
    if (!targetUser) {
        resultEl.innerHTML = '<p style="color: #ed4245;">User not found</p>';
        return;
    }
    
    if (targetUser.id === currentUser.id) {
        resultEl.innerHTML = '<p style="color: #ed4245;">You cannot add yourself</p>';
        return;
    }
    
    if (currentUser.friends.includes(targetUser.id)) {
        resultEl.innerHTML = '<p style="color: #ed4245;">Already friends</p>';
        return;
    }
    
    // Check if request already exists
    const existingRequest = friendRequests.find(r => 
        r.from === currentUser.id && r.to === targetUser.id
    );
    
    if (existingRequest) {
        resultEl.innerHTML = '<p style="color: #faa61a;">Friend request already sent</p>';
        return;
    }
    
    // Create friend request
    friendRequests.push({
        id: Date.now().toString(),
        from: currentUser.id,
        to: targetUser.id,
        timestamp: new Date().toISOString()
    });
    
    saveData();
    
    resultEl.innerHTML = '<p style="color: #3ba55d;">Friend request sent!</p>';
    
    showNotification(`Friend request sent to ${username}#${tag}`);
    
    setTimeout(() => {
        closeModal('add-friend-modal');
    }, 1500);
}

function checkFriendRequests() {
    const pendingRequests = friendRequests.filter(r => r.to === currentUser.id);
    
    if (pendingRequests.length > 0) {
        showFriendRequests(pendingRequests);
    }
}

function showFriendRequests(requests) {
    const container = document.getElementById('friend-requests-container');
    const list = document.getElementById('friend-requests-list');
    list.innerHTML = '';
    
    requests.forEach(request => {
        const fromUser = users.find(u => u.id === request.from);
        if (fromUser) {
            const reqEl = document.createElement('div');
            reqEl.className = 'friend-request-item';
            reqEl.innerHTML = `
                <div class="friend-request-name">${fromUser.username}#${fromUser.tag}</div>
                <div class="friend-request-actions">
                    <button class="btn-accept" onclick="acceptFriendRequest('${request.id}')">✓</button>
                    <button class="btn-reject" onclick="rejectFriendRequest('${request.id}')">✗</button>
                </div>
            `;
            list.appendChild(reqEl);
        }
    });
    
    container.style.display = 'block';
}

function acceptFriendRequest(requestId) {
    const request = friendRequests.find(r => r.id === requestId);
    if (!request) return;
    
    const fromUser = users.find(u => u.id === request.from);
    const toUser = users.find(u => u.id === request.to);
    
    // Add to friends list
    if (!toUser.friends.includes(fromUser.id)) {
        toUser.friends.push(fromUser.id);
    }
    if (!fromUser.friends.includes(toUser.id)) {
        fromUser.friends.push(toUser.id);
    }
    
    // Remove request
    friendRequests = friendRequests.filter(r => r.id !== requestId);
    
    // Update current user if needed
    if (currentUser.id === toUser.id) {
        currentUser = toUser;
        localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    }
    
    saveData();
    loadFriendsList();
    
    showNotification(`You are now friends with ${fromUser.username}#${fromUser.tag}`);
    
    // Check if more requests
    const remaining = friendRequests.filter(r => r.to === currentUser.id);
    if (remaining.length === 0) {
        document.getElementById('friend-requests-container').style.display = 'none';
    } else {
        showFriendRequests(remaining);
    }
}

function rejectFriendRequest(requestId) {
    friendRequests = friendRequests.filter(r => r.id !== requestId);
    saveData();
    
    const remaining = friendRequests.filter(r => r.to === currentUser.id);
    if (remaining.length === 0) {
        document.getElementById('friend-requests-container').style.display = 'none';
    } else {
        showFriendRequests(remaining);
    }
}

// Direct Messaging
function openDM(friend) {
    currentChat = {
        type: 'dm',
        user: friend
    };
    currentServer = null;
    
    document.querySelector('.home-icon').classList.remove('active');
    document.querySelectorAll('.server-icon').forEach(icon => {
        if (!icon.classList.contains('home-icon') && !icon.classList.contains('add-server')) {
            icon.classList.remove('active');
        }
    });
    
    document.getElementById('dm-list').style.display = 'block';
    document.getElementById('server-channels').style.display = 'none';
    document.getElementById('current-server-name').textContent = 'Direct Messages';
    
    document.querySelectorAll('.friend-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    document.getElementById('chat-title').textContent = `@ ${friend.username}`;
    
    loadMessages();
    loadMembersList();
}

function loadMessages() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '';
    
    let chatKey = '';
    
    if (currentChat.type === 'dm') {
        // Create consistent chat key for DMs
        const ids = [currentUser.id, currentChat.user.id].sort();
        chatKey = `dm_${ids[0]}_${ids[1]}`;
    } else if (currentChat.type === 'channel') {
        chatKey = `channel_${currentChat.channel.id}`;
    }
    
    const chatMessages = messages[chatKey] || [];
    
    if (chatMessages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h2>Start of your conversation</h2>
                <p>This is the beginning of your chat history.</p>
            </div>
        `;
        return;
    }
    
    chatMessages.forEach(msg => {
        const sender = users.find(u => u.id === msg.userId) || currentUser;
        const messageEl = createMessageElement(msg, sender);
        messagesContainer.appendChild(messageEl);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createMessageElement(msg, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message';
    
    const timestamp = new Date(msg.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    let contentHTML = '';
    if (msg.type === 'text') {
        contentHTML = `<div class="message-text">${escapeHtml(msg.content)}</div>`;
    } else if (msg.type === 'image') {
        contentHTML = `
            <div class="message-text">${msg.content ? escapeHtml(msg.content) : ''}</div>
            <img src="${msg.fileUrl}" class="message-image" alt="Image" onclick="window.open('${msg.fileUrl}', '_blank')">
        `;
    } else if (msg.type === 'file') {
        contentHTML = `
            <div class="message-text">${msg.content ? escapeHtml(msg.content) : ''}</div>
            <div class="message-file">
                <span>📎 ${msg.fileName}</span>
            </div>
        `;
    }
    
    messageEl.innerHTML = `
        <div class="message-avatar">${sender.avatar}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${sender.username}</span>
                <span class="message-timestamp">${timestamp}</span>
            </div>
            ${contentHTML}
        </div>
    `;
    
    return messageEl;
}

function handleMessageKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content || !currentChat) return;
    
    let chatKey = '';
    
    if (currentChat.type === 'dm') {
        const ids = [currentUser.id, currentChat.user.id].sort();
        chatKey = `dm_${ids[0]}_${ids[1]}`;
    } else if (currentChat.type === 'channel') {
        chatKey = `channel_${currentChat.channel.id}`;
    }
    
    if (!messages[chatKey]) {
        messages[chatKey] = [];
    }
    
    const message = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: content,
        type: 'text',
        timestamp: new Date().toISOString()
    };
    
    messages[chatKey].push(message);
    saveData();
    
    input.value = '';
    
    const messageEl = createMessageElement(message, currentUser);
    document.getElementById('chat-messages').appendChild(messageEl);
    
    // Scroll to bottom
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
    
    // Show notification to recipient (simulated)
    if (currentChat.type === 'dm' && document.getElementById('notif-messages').checked) {
        showNotification(`New message from ${currentUser.username}`);
    }
}

function showFileUpload() {
    document.getElementById('file-input').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file || !currentChat) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        let chatKey = '';
        
        if (currentChat.type === 'dm') {
            const ids = [currentUser.id, currentChat.user.id].sort();
            chatKey = `dm_${ids[0]}_${ids[1]}`;
        } else if (currentChat.type === 'channel') {
            chatKey = `channel_${currentChat.channel.id}`;
        }
        
        if (!messages[chatKey]) {
            messages[chatKey] = [];
        }
        
        const message = {
            id: Date.now().toString(),
            userId: currentUser.id,
            content: '',
            type: file.type.startsWith('image/') ? 'image' : 'file',
            fileUrl: e.target.result,
            fileName: file.name,
            timestamp: new Date().toISOString()
        };
        
        messages[chatKey].push(message);
        saveData();
        
        const messageEl = createMessageElement(message, currentUser);
        document.getElementById('chat-messages').appendChild(messageEl);
        
        const container = document.getElementById('chat-messages');
        container.scrollTop = container.scrollHeight;
    };
    
    reader.readAsDataURL(file);
    event.target.value = '';
}

// Servers System
function loadServersList() {
    const container = document.getElementById('server-icons-container');
    container.innerHTML = '';
    
    const userServers = servers.filter(s => s.members.includes(currentUser.id));
    
    userServers.forEach(server => {
        const serverEl = document.createElement('div');
        serverEl.className = 'server-icon';
        serverEl.title = server.name;
        
        if (server.customIcon) {
            // Use custom image
            serverEl.style.backgroundImage = `url('${server.customIcon}')`;
            serverEl.style.backgroundSize = 'cover';
            serverEl.style.backgroundPosition = 'center';
        } else {
            // Use emoji
            serverEl.innerHTML = `<span>${server.icon}</span>`;
        }
        
        serverEl.onclick = () => openServer(server);
        container.appendChild(serverEl);
    });
}

function showCreateServerModal() {
    document.getElementById('create-server-modal').classList.add('active');
    document.getElementById('server-name-input').value = '';
    document.getElementById('server-icon-input').value = '🎮';
}

function createServer() {
    const name = document.getElementById('server-name-input').value.trim();
    const icon = document.getElementById('server-icon-input').value.trim() || '🎮';
    
    if (!name) {
        alert('Please enter a server name');
        return;
    }
    
    const server = {
        id: Date.now().toString(),
        name: name,
        icon: icon,
        customIcon: customServerIconData || null, // Store custom icon image
        owner: currentUser.id,
        members: [currentUser.id],
        channels: [
            {
                id: `${Date.now()}_1`,
                name: 'general',
                type: 'text'
            },
            {
                id: `${Date.now()}_2`,
                name: 'General',
                type: 'voice'
            }
        ],
        createdAt: new Date().toISOString()
    };
    
    servers.push(server);
    
    // Reset custom icon data
    customServerIconData = null;
    document.getElementById('custom-server-icon-preview').style.display = 'none';
    
    // Add server to current user
    if (!currentUser.servers) {
        currentUser.servers = [];
    }
    currentUser.servers.push(server.id);
    
    saveData();
    localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    
    loadServersList();
    closeModal('create-server-modal');
    
    showNotification(`Server "${name}" created!`);
}

function openServer(server) {
    currentServer = server;
    currentChat = null;
    
    document.querySelector('.home-icon').classList.remove('active');
    document.querySelectorAll('.server-icon').forEach(icon => icon.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    document.getElementById('dm-list').style.display = 'none';
    document.getElementById('server-channels').style.display = 'block';
    document.getElementById('current-server-name').textContent = server.name;
    
    loadServerChannels(server);
    
    // Open first text channel
    const firstChannel = server.channels.find(c => c.type === 'text');
    if (firstChannel) {
        openChannel(firstChannel);
    }
}

function loadServerChannels(server) {
    const textChannels = document.getElementById('text-channels-list');
    const voiceChannels = document.getElementById('voice-channels-list');
    
    textChannels.innerHTML = '';
    voiceChannels.innerHTML = '';
    
    server.channels.filter(c => c.type === 'text').forEach(channel => {
        const channelEl = document.createElement('div');
        channelEl.className = 'channel-item';
        channelEl.onclick = () => openChannel(channel);
        channelEl.innerHTML = `
            <span class="channel-icon">#</span>
            <span class="channel-name">${channel.name}</span>
        `;
        textChannels.appendChild(channelEl);
    });
    
    server.channels.filter(c => c.type === 'voice').forEach(channel => {
        const channelEl = document.createElement('div');
        channelEl.className = 'channel-item';
        channelEl.onclick = () => openChannel(channel);
        channelEl.innerHTML = `
            <span class="channel-icon">🔊</span>
            <span class="channel-name">${channel.name}</span>
        `;
        voiceChannels.appendChild(channelEl);
    });
}

function openChannel(channel) {
    currentChat = {
        type: 'channel',
        channel: channel
    };
    
    document.querySelectorAll('.channel-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    if (channel.type === 'text') {
        document.getElementById('chat-title').textContent = `# ${channel.name}`;
        loadMessages();
    } else {
        document.getElementById('chat-title').textContent = `🔊 ${channel.name}`;
        document.getElementById('chat-messages').innerHTML = `
            <div class="welcome-message">
                <h2>Voice Channel: ${channel.name}</h2>
                <p>Join this voice channel to talk with others!</p>
                <button onclick="joinVoiceChannel()" class="btn btn-primary" style="margin-top: 20px;">
                    🎤 Join Voice Channel
                </button>
            </div>
        `;
    }
    
    loadMembersList();
}

function showCreateChannelModal(type) {
    document.getElementById('create-channel-modal').classList.add('active');
    document.getElementById('channel-name-input').value = '';
    document.getElementById('channel-type-input').value = type;
}

function createChannel() {
    if (!currentServer) return;
    
    const name = document.getElementById('channel-name-input').value.trim();
    const type = document.getElementById('channel-type-input').value;
    
    if (!name) {
        alert('Please enter a channel name');
        return;
    }
    
    const channel = {
        id: Date.now().toString(),
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type: type
    };
    
    // Find server and add channel
    const serverIndex = servers.findIndex(s => s.id === currentServer.id);
    if (serverIndex !== -1) {
        servers[serverIndex].channels.push(channel);
        currentServer = servers[serverIndex];
        saveData();
        
        loadServerChannels(currentServer);
        closeModal('create-channel-modal');
        
        showNotification(`Channel "${name}" created!`);
    }
}

// Home View
function showHome() {
    currentChat = null;
    currentServer = null;
    
    document.querySelector('.home-icon').classList.add('active');
    document.querySelectorAll('.server-icon').forEach(icon => {
        if (!icon.classList.contains('home-icon')) {
            icon.classList.remove('active');
        }
    });
    
    document.getElementById('dm-list').style.display = 'block';
    document.getElementById('server-channels').style.display = 'none';
    document.getElementById('current-server-name').textContent = 'Direct Messages';
    
    document.getElementById('chat-title').textContent = '# Home';
    document.getElementById('chat-messages').innerHTML = `
        <div class="welcome-message">
            <h2>Welcome to PaperChat!</h2>
            <p>Select a friend to start chatting or create a server to build your community.</p>
            <br>
            <p><strong>Features:</strong></p>
            <ul style="text-align: left; max-width: 400px; margin: 20px auto;">
                <li>📨 Direct messaging with friends</li>
                <li>🎮 Create and join servers</li>
                <li>💬 Text and voice channels</li>
                <li>📸 Share images and files</li>
                <li>😊 Custom avatars and statuses</li>
                <li>🔔 Friend requests and notifications</li>
            </ul>
        </div>
    `;
    
    loadMembersList();
}

// Members Panel
function loadMembersList() {
    const membersList = document.getElementById('members-list');
    membersList.innerHTML = '';
    
    if (currentServer) {
        // Show server members
        currentServer.members.forEach(memberId => {
            const member = users.find(u => u.id === memberId);
            if (member) {
                const memberEl = createMemberElement(member);
                membersList.appendChild(memberEl);
            }
        });
    } else if (currentChat && currentChat.type === 'dm') {
        // Show DM participant
        const memberEl = createMemberElement(currentChat.user);
        membersList.appendChild(memberEl);
        
        const currentUserEl = createMemberElement(currentUser);
        membersList.appendChild(currentUserEl);
    } else {
        // Show all friends
        currentUser.friends.forEach(friendId => {
            const friend = users.find(u => u.id === friendId);
            if (friend) {
                const memberEl = createMemberElement(friend);
                membersList.appendChild(memberEl);
            }
        });
    }
}

function createMemberElement(user) {
    const memberEl = document.createElement('div');
    memberEl.className = 'member-item';
    
    const statusColor = user.status === 'online' ? '#3ba55d' :
                       user.status === 'idle' ? '#faa61a' :
                       user.status === 'dnd' ? '#ed4245' : '#747f8d';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'member-avatar';
    avatarDiv.style.position = 'relative';
    
    if (user.customAvatar) {
        avatarDiv.style.backgroundImage = `url('${user.customAvatar}')`;
        avatarDiv.style.backgroundSize = 'cover';
        avatarDiv.style.backgroundPosition = 'center';
    } else {
        avatarDiv.textContent = user.avatar;
    }
    
    const statusDot = document.createElement('div');
    statusDot.style.cssText = `position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: ${statusColor}; border: 2px solid #2f3136; border-radius: 50%;`;
    avatarDiv.appendChild(statusDot);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'member-info';
    infoDiv.innerHTML = `
        <div class="member-name">${user.username}</div>
        ${user.customStatus ? `<div class="member-status">${user.customStatus}</div>` : ''}
    `;
    
    memberEl.appendChild(avatarDiv);
    memberEl.appendChild(infoDiv);
    
    return memberEl;
}

// User Settings
function updateStatus() {
    const status = document.getElementById('status-select').value;
    currentUser.status = status;
    
    // Update in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].status = status;
    }
    
    saveData();
    localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    
    loadMembersList();
}

function showSettingsModal() {
    document.getElementById('settings-modal').classList.add('active');
    document.getElementById('avatar-input').value = currentUser.avatar;
    document.getElementById('custom-status-input').value = currentUser.customStatus || '';
    
    // Highlight current banner selection
    const currentBanner = currentUser.banner || 'none';
    document.querySelectorAll('.banner-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.banner === currentBanner) {
            option.classList.add('selected');
        }
    });
    
    // Show custom banner preview if exists
    if (currentBanner === 'custom' && currentUser.customBanner) {
        const previewImg = document.getElementById('custom-banner-img');
        const previewVideo = document.getElementById('custom-banner-video');
        
        if (currentUser.customBannerType === 'video') {
            previewVideo.src = currentUser.customBanner;
            previewVideo.style.display = 'block';
            previewImg.style.display = 'none';
        } else {
            previewImg.src = currentUser.customBanner;
            previewImg.style.display = 'block';
            previewVideo.style.display = 'none';
        }
        
        document.getElementById('custom-banner-preview').style.display = 'block';
        document.querySelector('.banner-upload-option').classList.add('selected');
    } else {
        document.getElementById('custom-banner-preview').style.display = 'none';
    }
    
    // Update upload hint based on Pro status
    const uploadHint = document.getElementById('banner-upload-hint');
    if (uploadHint) {
        uploadHint.textContent = currentUser.isPro 
            ? 'Click 📷+ or drag & drop an image or video (Pro feature!)' 
            : 'Click 📷+ or drag & drop an image to upload custom banner';
    }
    
    // Show custom avatar preview if exists
    if (currentUser.customAvatar) {
        const previewImg = document.getElementById('custom-avatar-img');
        previewImg.src = currentUser.customAvatar;
        document.getElementById('custom-avatar-preview').style.display = 'block';
    } else {
        document.getElementById('custom-avatar-preview').style.display = 'none';
    }
    
    // Update Pro status display
    updateProStatus();
}

function triggerExportData() {
    exportData();
}

function triggerImportData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            importData(file);
        }
    };
    input.click();
}

function updateAvatar() {
    const avatar = document.getElementById('avatar-input').value.trim();
    if (avatar) {
        currentUser.avatar = avatar;
        
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].avatar = avatar;
        }
        
        saveData();
        localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
        
        document.getElementById('user-avatar').textContent = avatar;
        loadMembersList();
        
        showNotification('Avatar updated!');
    }
}

// Custom Avatar Functions
function triggerAvatarUpload() {
    document.getElementById('avatar-upload-input').click();
}

function uploadCustomAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be smaller than 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        currentUser.customAvatar = imageData;
        currentUser.avatar = '🖼️'; // Indicator that custom avatar is in use
        
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].customAvatar = imageData;
            users[userIndex].avatar = '🖼️';
        }
        
        saveData();
        localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
        
        // Update displays
        updateAvatarDisplay();
        
        // Show preview in settings
        const previewImg = document.getElementById('custom-avatar-img');
        previewImg.src = imageData;
        document.getElementById('custom-avatar-preview').style.display = 'block';
        
        showNotification('Custom avatar uploaded!');
    };
    
    reader.readAsDataURL(file);
}

function removeCustomAvatar() {
    currentUser.customAvatar = null;
    currentUser.avatar = '😊'; // Default emoji
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].customAvatar = null;
        users[userIndex].avatar = '😊';
    }
    
    saveData();
    localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    
    updateAvatarDisplay();
    document.getElementById('custom-avatar-preview').style.display = 'none';
    
    showNotification('Custom avatar removed');
}

function updateAvatarDisplay() {
    const avatarEl = document.getElementById('user-avatar');
    if (!avatarEl) return;
    
    if (currentUser.customAvatar) {
        // Replace emoji with custom image
        avatarEl.style.backgroundImage = `url('${currentUser.customAvatar}')`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        avatarEl.textContent = '';
    } else {
        // Use emoji
        avatarEl.style.backgroundImage = 'none';
        avatarEl.textContent = currentUser.avatar;
    }
    
    loadMembersList();
}

// Custom Server Icon Functions
let customServerIconData = null;

function triggerServerIconUpload() {
    document.getElementById('server-icon-upload-input').click();
}

function uploadCustomServerIcon(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image must be smaller than 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        customServerIconData = e.target.result;
        
        // Show preview
        const previewImg = document.getElementById('custom-server-icon-img');
        previewImg.src = customServerIconData;
        document.getElementById('custom-server-icon-preview').style.display = 'block';
        
        // Clear emoji input
        document.getElementById('server-icon-input').value = '';
        
        showNotification('Custom icon ready! Click Create to apply.');
    };
    
    reader.readAsDataURL(file);
}

function removeCustomServerIcon() {
    customServerIconData = null;
    document.getElementById('custom-server-icon-preview').style.display = 'none';
    showNotification('Custom icon removed');
}

function selectBanner(bannerType) {
    currentUser.banner = bannerType;
    currentUser.customBanner = null; // Clear custom banner when selecting preset
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].banner = bannerType;
        users[userIndex].customBanner = null;
    }
    
    saveData();
    localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    
    // Update banner display
    updateBannerDisplay();
    
    // Update selected state in settings
    document.querySelectorAll('.banner-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.banner === bannerType) {
            option.classList.add('selected');
        }
    });
    
    // Hide custom banner preview
    document.getElementById('custom-banner-preview').style.display = 'none';
    
    showNotification('Banner updated!');
}

function triggerBannerUpload() {
    document.getElementById('banner-upload-input').click();
}

function uploadCustomBanner(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    // Check if Pro for video upload
    if (isVideo && !currentUser.isPro) {
        showNotification('🌊 Video banners require PaperChat Pro! Upgrade to unlock.');
        return;
    }
    
    // Check if it's an image or video
    if (!isImage && !isVideo) {
        showNotification('Please upload an image or video file');
        return;
    }
    
    // Check file size (max 5MB for images, 10MB for videos)
    const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification(`File must be smaller than ${isVideo ? '10MB' : '5MB'}`);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const bannerData = e.target.result;
        
        // Save custom banner
        currentUser.customBanner = bannerData;
        currentUser.customBannerType = isVideo ? 'video' : 'image';
        currentUser.banner = 'custom';
        
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].customBanner = bannerData;
            users[userIndex].customBannerType = isVideo ? 'video' : 'image';
            users[userIndex].banner = 'custom';
        }
        
        saveData();
        localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
        
        // Update display
        updateBannerDisplay();
        
        // Show preview in settings
        if (isVideo) {
            const previewVideo = document.getElementById('custom-banner-video');
            previewVideo.src = bannerData;
            previewVideo.style.display = 'block';
            document.getElementById('custom-banner-img').style.display = 'none';
        } else {
            const previewImg = document.getElementById('custom-banner-img');
            previewImg.src = bannerData;
            previewImg.style.display = 'block';
            document.getElementById('custom-banner-video').style.display = 'none';
        }
        document.getElementById('custom-banner-preview').style.display = 'block';
        
        // Update selected state
        document.querySelectorAll('.banner-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('.banner-upload-option').classList.add('selected');
        
        showNotification(`Custom ${isVideo ? 'video' : 'image'} banner uploaded!`);
    };
    
    reader.readAsDataURL(file);
}

function removeCustomBanner() {
    currentUser.customBanner = null;
    currentUser.banner = 'none';
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].customBanner = null;
        users[userIndex].banner = 'none';
    }
    
    saveData();
    localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    
    // Update display
    updateBannerDisplay();
    
    // Hide preview
    document.getElementById('custom-banner-preview').style.display = 'none';
    
    // Update selected state
    document.querySelectorAll('.banner-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.banner === 'none') {
            option.classList.add('selected');
        }
    });
    
    showNotification('Custom banner removed');
}

function handleBannerDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
}

function handleBannerDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
}

function handleBannerDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    // Check if Pro for video upload
    if (isVideo && !currentUser.isPro) {
        showNotification('🌊 Video banners require PaperChat Pro! Upgrade to unlock.');
        return;
    }
    
    // Check if it's an image or video
    if (!isImage && !isVideo) {
        showNotification('Please drop an image or video file');
        return;
    }
    
    // Check file size (max 5MB for images, 10MB for videos)
    const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification(`File must be smaller than ${isVideo ? '10MB' : '5MB'}`);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const bannerData = e.target.result;
        
        // Save custom banner
        currentUser.customBanner = bannerData;
        currentUser.customBannerType = isVideo ? 'video' : 'image';
        currentUser.banner = 'custom';
        
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].customBanner = bannerData;
            users[userIndex].customBannerType = isVideo ? 'video' : 'image';
            users[userIndex].banner = 'custom';
        }
        
        saveData();
        localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
        
        // Update display
        updateBannerDisplay();
        
        // Show preview in settings
        if (isVideo) {
            const previewVideo = document.getElementById('custom-banner-video');
            previewVideo.src = bannerData;
            previewVideo.style.display = 'block';
            document.getElementById('custom-banner-img').style.display = 'none';
        } else {
            const previewImg = document.getElementById('custom-banner-img');
            previewImg.src = bannerData;
            previewImg.style.display = 'block';
            document.getElementById('custom-banner-video').style.display = 'none';
        }
        document.getElementById('custom-banner-preview').style.display = 'block';
        
        // Update selected state
        document.querySelectorAll('.banner-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('.banner-upload-option').classList.add('selected');
        
        showNotification(`Custom ${isVideo ? 'video' : 'image'} banner uploaded!`);
    };
    
    reader.readAsDataURL(file);
}

function updateBannerDisplay() {
    const bannerEl = document.getElementById('user-banner');
    if (!bannerEl) return;
    
    const banner = currentUser.banner || 'none';
    
    // Handle custom banner (video or image)
    if (banner === 'custom' && currentUser.customBanner) {
        // Clear existing content
        bannerEl.innerHTML = '';
        bannerEl.style.background = 'transparent';
        
        if (currentUser.customBannerType === 'video') {
            // Create video element
            const video = document.createElement('video');
            video.src = currentUser.customBanner;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.style.cssText = 'width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; opacity: 0.6;';
            bannerEl.appendChild(video);
        } else {
            // Use image as background
            bannerEl.style.background = `url('${currentUser.customBanner}') center/cover`;
            bannerEl.style.backgroundBlendMode = 'overlay';
        }
        
        bannerEl.style.display = 'block';
        return;
    }
    
    // Clear any video elements for gradient banners
    bannerEl.innerHTML = '';
    
    const banners = {
        'none': 'transparent',
        'gradient1': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient4': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'gradient5': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'gradient6': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'gradient7': 'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)',
        'gradient8': 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)'
    };
    
    bannerEl.style.background = banners[banner] || banners['none'];
    bannerEl.style.backgroundBlendMode = 'overlay';
    bannerEl.style.display = banner === 'none' ? 'none' : 'block';
}

function updateCustomStatus() {
    const customStatus = document.getElementById('custom-status-input').value.trim();
    currentUser.customStatus = customStatus;
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].customStatus = customStatus;
    }
    
    saveData();
    localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    
    loadMembersList();
    showNotification('Status updated!');
}

// Call Features (Simulated)
function showCallOptions() {
    showNotification('📞 Voice call feature (simulated in this demo)');
}

function showVideoCall() {
    showNotification('📹 Video call feature (simulated in this demo)');
}

function showScreenShare() {
    showNotification('🖥️ Screen share feature (simulated in this demo)');
}

function showEmojiPicker() {
    const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const input = document.getElementById('message-input');
    input.value += emoji;
    input.focus();
}

// Modal Controls
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Notifications
function showNotification(message) {
    // Create notification element
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #5865f2;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    notif.textContent = message;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notif);
        }, 300);
    }, 3000);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Pro Version Functions
function showUpgradeModal() {
    document.getElementById('upgrade-modal').classList.add('active');
    document.getElementById('payment-section').style.display = 'none';
    
    showNotification('🌊 100% of proceeds go to The Ocean Cleanup!');
}

let selectedPlanType = null;
let selectedPlanPrice = 0;

function selectPlan(planType, price) {
    selectedPlanType = planType;
    selectedPlanPrice = price;
    
    const planNames = {
        'monthly': 'Monthly - Support Ocean Cleanup for 1 Month',
        'yearly': 'Yearly - Support Ocean Cleanup for 1 Year', 
        'lifetime': 'Lifetime - Make a One-Time Donation to Ocean Cleanup'
    };
    
    // Show confirmation before redirect
    const confirmed = confirm(
        `🌊 Donate to The Ocean Cleanup\n\n` +
        `Your ${planNames[planType]}\n` +
        `Amount: $${price.toFixed(2)}\n\n` +
        `You will be redirected to The Ocean Cleanup's donation page.\n` +
        `After donating, you'll receive a confirmation code to unlock PaperChat Pro.\n\n` +
        `Proceed to donation?`
    );
    
    if (confirmed) {
        // Store selected plan for later
        localStorage.setItem('paperchat_pending_pro_plan', planType);
        localStorage.setItem('paperchat_pending_pro_price', price);
        
        // Redirect to The Ocean Cleanup donation page with amount
        // They have a donation page at theoceancleanup.com/donate
        const donationUrl = `https://theoceancleanup.com/donate/?amount=${price}`;
        
        showNotification('🌊 Redirecting to The Ocean Cleanup...');
        
        setTimeout(() => {
            window.open(donationUrl, '_blank');
            // Show confirmation code entry
            showDonationConfirmation();
        }, 1000);
    }
}

function cancelPayment() {
    document.getElementById('payment-section').style.display = 'none';
    selectedPlanType = null;
    selectedPlanPrice = 0;
}

function showDonationConfirmation() {
    closeModal('upgrade-modal');
    
    // Show confirmation code entry modal
    const confirmCode = prompt(
        '🌊 Thank you for donating to The Ocean Cleanup!\n\n' +
        'After completing your donation, enter your confirmation email or donation ID below to unlock Pro features.\n\n' +
        'Or enter "OCEAN" to unlock Pro now (we trust you donated! 🌊)'
    );
    
    if (confirmCode && confirmCode.trim().length > 0) {
        activateProAfterDonation(confirmCode.trim());
    } else {
        showNotification('You can activate Pro later from Settings');
    }
}

function activateProAfterDonation(confirmationCode) {
    // Retrieve pending plan
    const planType = localStorage.getItem('paperchat_pending_pro_plan') || 'monthly';
    const price = parseFloat(localStorage.getItem('paperchat_pending_pro_price')) || 4.99;
    
    // Trust-based system - activate Pro
    currentUser.isPro = true;
    currentUser.donationConfirmation = confirmationCode;
    currentUser.donatedAmount = price;
    currentUser.donationDate = new Date().toISOString();
    
    // Set expiry based on plan
    if (planType === 'monthly') {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        currentUser.proExpiry = expiry.toISOString();
    } else if (planType === 'yearly') {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        currentUser.proExpiry = expiry.toISOString();
    } else if (planType === 'lifetime') {
        currentUser.proExpiry = 'lifetime';
    }
    
    // Update user in database
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].isPro = currentUser.isPro;
        users[userIndex].proExpiry = currentUser.proExpiry;
        users[userIndex].donationConfirmation = currentUser.donationConfirmation;
        users[userIndex].donatedAmount = currentUser.donatedAmount;
        users[userIndex].donationDate = currentUser.donationDate;
    }
    
    saveData();
    localStorage.setItem('paperchat_current_user', JSON.stringify(currentUser));
    
    // Clear pending plan
    localStorage.removeItem('paperchat_pending_pro_plan');
    localStorage.removeItem('paperchat_pending_pro_price');
    
    showNotification('✨ Thank you for supporting The Ocean Cleanup! PaperChat Pro unlocked! 🌊');
    
    // Update Pro status display if settings is open
    updateProStatus();
}

function updateProStatus() {
    const proContainer = document.getElementById('pro-status-container');
    if (!proContainer) return;
    
    if (currentUser.isPro) {
        const expiryText = currentUser.proExpiry === 'lifetime' 
            ? 'Lifetime Access' 
            : `Active until ${new Date(currentUser.proExpiry).toLocaleDateString()}`;
        
        const donationAmount = currentUser.donatedAmount ? `$${currentUser.donatedAmount.toFixed(2)}` : '';
        const donationDate = currentUser.donationDate ? new Date(currentUser.donationDate).toLocaleDateString() : '';
        
        proContainer.innerHTML = `
            <div class="pro-active-status">
                <h3>🌊 You are a Pro Member! 🌊</h3>
                <p class="pro-expiry">${expiryText}</p>
                ${donationAmount ? `<p class="donation-info">🌊 Donated ${donationAmount} to The Ocean Cleanup on ${donationDate}</p>` : ''}
                <div class="pro-features-unlocked">
                    <p>✅ Video & Animated Banners Unlocked</p>
                    <p>✅ Custom Themes Available</p>
                    <p>✅ Private Servers Enabled</p>
                    <p>✅ Analytics Dashboard Active</p>
                    <p>✅ Pro Badge Displayed</p>
                    <p style="margin-top: 15px; font-size: 13px;">💙 Thank you for supporting ocean conservation!</p>
                </div>
            </div>
        `;
    }
}

// Format card number input
document.addEventListener('input', (e) => {
    if (e.target.id === 'card-number') {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    }
    
    if (e.target.id === 'card-expiry') {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    }
});

// Voice Call Functions
function joinVoiceChannel() {
    if (!currentChat || currentChat.type !== 'channel' || currentChat.channel.type !== 'voice') {
        showNotification('Please select a voice channel first');
        return;
    }
    
    voiceState.inCall = true;
    voiceState.channel = currentChat.channel;
    voiceState.server = currentServer;
    voiceState.isMuted = false;
    voiceState.isDeafened = false;
    
    // Simulate other participants (demo purposes)
    voiceState.participants = [
        { id: currentUser.id, username: currentUser.username, avatar: currentUser.avatar, customAvatar: currentUser.customAvatar, talking: false, self: true }
    ];
    
    // Add random demo participants from server members
    if (currentServer) {
        const otherMembers = currentServer.members
            .filter(memberId => memberId !== currentUser.id)
            .slice(0, Math.floor(Math.random() * 3) + 1); // 1-3 random members
        
        otherMembers.forEach(memberId => {
            const user = users.find(u => u.id === memberId);
            if (user) {
                voiceState.participants.push({
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar,
                    customAvatar: user.customAvatar,
                    talking: false,
                    self: false
                });
            }
        });
    }
    
    // Show voice call popup
    showVoiceCallPopup();
    
    // Start random talking simulation
    startTalkingSimulation();
    
    showNotification('🎤 Connected to voice channel!');
}

function showVoiceCallPopup() {
    const popup = document.getElementById('voice-call-popup');
    
    // Force reset position
    popup.style.position = 'fixed';
    popup.style.left = '20px';
    popup.style.bottom = '20px';
    popup.style.top = 'auto';
    popup.style.right = 'auto';
    popup.style.transform = 'none';
    popup.style.display = 'block';
    popup.style.zIndex = '9999';
    
    document.getElementById('voice-channel-name').textContent = voiceState.channel.name;
    document.getElementById('voice-server-name').textContent = voiceState.server ? voiceState.server.name : 'Direct Call';
    
    updateVoiceParticipants();
    
    // Make draggable
    makeVoiceCallDraggable();
    
    console.log('Voice popup shown at:', popup.getBoundingClientRect());
}

function makeVoiceCallDraggable() {
    const popup = document.getElementById('voice-call-popup');
    const header = popup.querySelector('.voice-call-header');
    
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    // Reset position to default visible location
    popup.style.left = '20px';
    popup.style.bottom = '20px';
    popup.style.top = 'auto';
    popup.style.transform = 'none';
    
    // Load saved position if valid
    const savedPos = localStorage.getItem('paperchat_voice_position');
    if (savedPos) {
        try {
            const pos = JSON.parse(savedPos);
            if (pos.left) popup.style.left = pos.left;
            if (pos.top) {
                popup.style.top = pos.top;
                popup.style.bottom = 'auto';
            }
        } catch (e) {
            // Invalid saved position, use default
        }
    }
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
        if (e.target.closest('.btn-close-voice')) return;
        
        isDragging = true;
        
        const rect = popup.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        popup.style.animation = 'none';
        popup.style.transition = 'none';
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;
        
        // Keep within viewport bounds
        const maxLeft = window.innerWidth - popup.offsetWidth;
        const maxTop = window.innerHeight - popup.offsetHeight;
        
        const boundedLeft = Math.max(0, Math.min(newLeft, maxLeft));
        const boundedTop = Math.max(0, Math.min(newTop, maxTop));
        
        popup.style.left = boundedLeft + 'px';
        popup.style.top = boundedTop + 'px';
        popup.style.bottom = 'auto';
        popup.style.transform = 'none';
    }
    
    function dragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        
        // Save position
        const pos = {
            left: popup.style.left,
            top: popup.style.top
        };
        localStorage.setItem('paperchat_voice_position', JSON.stringify(pos));
    }
}

function updateVoiceParticipants() {
    const container = document.getElementById('voice-participants');
    container.innerHTML = '';
    
    voiceState.participants.forEach(participant => {
        const participantEl = document.createElement('div');
        participantEl.className = 'voice-participant';
        if (participant.talking) {
            participantEl.classList.add('talking');
        }
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'voice-participant-avatar';
        
        if (participant.customAvatar) {
            avatarDiv.style.backgroundImage = `url('${participant.customAvatar}')`;
            avatarDiv.style.backgroundSize = 'cover';
            avatarDiv.style.backgroundPosition = 'center';
        } else {
            avatarDiv.textContent = participant.avatar;
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'voice-participant-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'voice-participant-name';
        nameDiv.textContent = participant.username + (participant.self ? ' (You)' : '');
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'voice-participant-status';
        
        let statusText = '';
        if (participant.self) {
            if (voiceState.isDeafened) {
                statusText = '🔇 Deafened';
            } else if (voiceState.isMuted) {
                statusText = '🔇 Muted';
            } else if (participant.talking) {
                statusText = '🎤 Speaking';
            } else {
                statusText = '🎤 Connected';
            }
        } else {
            statusText = participant.talking ? '🎤 Speaking' : '🎤 Connected';
        }
        
        statusDiv.textContent = statusText;
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(statusDiv);
        
        participantEl.appendChild(avatarDiv);
        participantEl.appendChild(infoDiv);
        
        container.appendChild(participantEl);
    });
}

let talkingInterval;

function startTalkingSimulation() {
    // Randomly make participants talk
    talkingInterval = setInterval(() => {
        if (!voiceState.inCall) {
            clearInterval(talkingInterval);
            return;
        }
        
        // Reset all talking states
        voiceState.participants.forEach(p => p.talking = false);
        
        // Randomly select 0-2 participants to be talking
        const talkingCount = Math.random() < 0.6 ? Math.floor(Math.random() * 2) + 1 : 0;
        
        for (let i = 0; i < talkingCount; i++) {
            const randomIndex = Math.floor(Math.random() * voiceState.participants.length);
            voiceState.participants[randomIndex].talking = true;
        }
        
        updateVoiceParticipants();
    }, 1500); // Update every 1.5 seconds
}

function toggleMute() {
    voiceState.isMuted = !voiceState.isMuted;
    
    const muteBtn = document.getElementById('mute-btn');
    const muteIcon = document.getElementById('mute-icon');
    
    if (voiceState.isMuted) {
        muteBtn.classList.add('active');
        muteIcon.textContent = '🔇';
        showNotification('Microphone muted');
    } else {
        muteBtn.classList.remove('active');
        muteIcon.textContent = '🎤';
        showNotification('Microphone unmuted');
    }
    
    // If deafened, unmute also undeafens
    if (voiceState.isDeafened) {
        voiceState.isDeafened = false;
        document.getElementById('deafen-btn').classList.remove('active');
        document.getElementById('deafen-icon').textContent = '🔊';
    }
    
    updateVoiceParticipants();
}

function toggleDeafen() {
    voiceState.isDeafened = !voiceState.isDeafened;
    
    const deafenBtn = document.getElementById('deafen-btn');
    const deafenIcon = document.getElementById('deafen-icon');
    
    if (voiceState.isDeafened) {
        deafenBtn.classList.add('active');
        deafenIcon.textContent = '🔇';
        // Deafening also mutes
        voiceState.isMuted = true;
        document.getElementById('mute-btn').classList.add('active');
        document.getElementById('mute-icon').textContent = '🔇';
        showNotification('Deafened');
    } else {
        deafenBtn.classList.remove('active');
        deafenIcon.textContent = '🔊';
        showNotification('Undeafened');
    }
    
    updateVoiceParticipants();
}

function leaveVoiceCall() {
    voiceState.inCall = false;
    voiceState.channel = null;
    voiceState.server = null;
    voiceState.participants = [];
    voiceState.isMuted = false;
    voiceState.isDeafened = false;
    
    // Clear interval
    if (talkingInterval) {
        clearInterval(talkingInterval);
    }
    
    // Hide popup
    document.getElementById('voice-call-popup').style.display = 'none';
    
    // Reset button states
    document.getElementById('mute-btn').classList.remove('active');
    document.getElementById('deafen-btn').classList.remove('active');
    document.getElementById('mute-icon').textContent = '🎤';
    document.getElementById('deafen-icon').textContent = '🔊';
    
    showNotification('Disconnected from voice channel');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

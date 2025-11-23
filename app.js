// TapChatter - Discord-like Social Platform
// State Management
let currentUser = null;
let currentChat = null;
let currentServer = null;
let users = [];
let messages = {};
let servers = [];
let friendRequests = [];

// Initialize app
function init() {
    loadData();
    checkAuth();
}

// Data Persistence
function loadData() {
    users = JSON.parse(localStorage.getItem('tapchatter_users') || '[]');
    messages = JSON.parse(localStorage.getItem('tapchatter_messages') || '{}');
    servers = JSON.parse(localStorage.getItem('tapchatter_servers') || '[]');
    friendRequests = JSON.parse(localStorage.getItem('tapchatter_friend_requests') || '[]');
}

function saveData() {
    localStorage.setItem('tapchatter_users', JSON.stringify(users));
    localStorage.setItem('tapchatter_messages', JSON.stringify(messages));
    localStorage.setItem('tapchatter_servers', JSON.stringify(servers));
    localStorage.setItem('tapchatter_friend_requests', JSON.stringify(friendRequests));
}

function checkAuth() {
    const savedUser = localStorage.getItem('tapchatter_current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
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
    localStorage.setItem('tapchatter_current_user', JSON.stringify(currentUser));
    
    showApp();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser.status = 'offline';
        saveData();
        localStorage.removeItem('tapchatter_current_user');
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
    document.getElementById('user-avatar').textContent = currentUser.avatar;
    document.getElementById('status-select').value = currentUser.status;
    
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
            
            friendEl.innerHTML = `
                <div class="friend-avatar ${statusClass}">${friend.avatar}</div>
                <div class="friend-name">${friend.username}</div>
            `;
            
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
        localStorage.setItem('tapchatter_current_user', JSON.stringify(currentUser));
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
        serverEl.innerHTML = `<span>${server.icon}</span>`;
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
    
    // Add server to current user
    if (!currentUser.servers) {
        currentUser.servers = [];
    }
    currentUser.servers.push(server.id);
    
    saveData();
    localStorage.setItem('tapchatter_current_user', JSON.stringify(currentUser));
    
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
                <h2>Voice Channel</h2>
                <p>Click the call button to join the voice channel.</p>
                <p>🎤 Voice calls are simulated in this demo.</p>
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
            <h2>Welcome to TapChatter!</h2>
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
    
    memberEl.innerHTML = `
        <div class="member-avatar" style="position: relative;">
            ${user.avatar}
            <div style="position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: ${statusColor}; border: 2px solid #2f3136; border-radius: 50%;"></div>
        </div>
        <div class="member-info">
            <div class="member-name">${user.username}</div>
            ${user.customStatus ? `<div class="member-status">${user.customStatus}</div>` : ''}
        </div>
    `;
    
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
    localStorage.setItem('tapchatter_current_user', JSON.stringify(currentUser));
    
    loadMembersList();
}

function showSettingsModal() {
    document.getElementById('settings-modal').classList.add('active');
    document.getElementById('avatar-input').value = currentUser.avatar;
    document.getElementById('custom-status-input').value = currentUser.customStatus || '';
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
        localStorage.setItem('tapchatter_current_user', JSON.stringify(currentUser));
        
        document.getElementById('user-avatar').textContent = avatar;
        loadMembersList();
        
        showNotification('Avatar updated!');
    }
}

function updateCustomStatus() {
    const customStatus = document.getElementById('custom-status-input').value.trim();
    currentUser.customStatus = customStatus;
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].customStatus = customStatus;
    }
    
    saveData();
    localStorage.setItem('tapchatter_current_user', JSON.stringify(currentUser));
    
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

// Initialize on load
window.addEventListener('DOMContentLoaded', init);

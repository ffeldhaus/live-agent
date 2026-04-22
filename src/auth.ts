export async function verifyToken(token: string) {
    try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
        if (!response.ok) {
            throw new Error(`Token verification failed: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Token info:', data);
        return data;
    } catch (e) {
        console.error('Error verifying token:', e);
        return null;
    }
}

export async function fetchUserProfile(token: string, elements: { userName: HTMLSpanElement | null, userAvatar: HTMLImageElement | null, userProfile: HTMLDivElement | null, googleSignInBtn: HTMLButtonElement | null }, store: any) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('User info:', data);
        
        store.userName = data.name;
        store.userAvatar = data.picture;
        
        if (elements.userName) elements.userName.textContent = data.name;
        if (elements.userAvatar) elements.userAvatar.src = data.picture;
        
        // Replace login button with user avatar information
        if (elements.userProfile) elements.userProfile.classList.remove('hidden');
        if (elements.googleSignInBtn) elements.googleSignInBtn.classList.add('hidden');
        
        localStorage.setItem('gemini_user_name', data.name);
        localStorage.setItem('gemini_user_avatar', data.picture);
    } catch (e) {
        console.error('Error fetching user profile:', e);
    }
}

export async function ensureValidToken(store: any, tokenClient: any) {
    const token = store.accessToken;
    const expiry = store.tokenExpiry;
    const now = new Date().getTime();

    if (!token || now >= expiry) {
        console.log('Token missing or expired, requesting new one...');
        if (tokenClient) {
            tokenClient.requestAccessToken();
            return false;
        } else {
            alert('OAuth Client ID is required to acquire a token.');
            return false;
        }
    }
    return true;
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// State
let app, auth, db;
let currentUser = null;
let userRole = 'student';

// DOM Elements
const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const mainContent = document.getElementById('main-content');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

// Auth Listener
const setupAuthListener = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                userRole = docSnap.data().role;
            }
            authBtn.textContent = '로그아웃';
            renderHome();
        } else {
            currentUser = null;
            authBtn.textContent = '로그인';
            renderHome();
        }
    });
};

// Routing / Rendering
const renderHome = () => {
    mainContent.innerHTML = `
        <header class="hero">
            <h1>안녕하세요, 우리반입니다 🌿</h1>
            <p>오늘의 학습 소식을 확인하세요.</p>
        </header>
        <div class="glass" style="margin-top: 2rem;">
            <h3>반갑습니다!</h3>
            ${currentUser ? `<p>현재 <b>${userRole === 'teacher' ? '교사' : '학생'}</b> 계정으로 로그인되어 있습니다.</p>` : '<p>홈페이지를 이용하시려면 로그인해주세요.</p>'}
        </div>
    `;
};

const renderBoard = () => {
    mainContent.innerHTML = `
        <div class="header-with-action">
            <h2>📦 학습 준비물 게시판</h2>
            ${userRole === 'teacher' ? '<button id="add-supply-btn" class="btn-primary">준비물 추가</button>' : ''}
        </div>
        <div id="supply-list" class="board-grid">
            <!-- 준비물 리스트 로딩 -->
        </div>
    `;

    if (userRole === 'teacher') {
        document.getElementById('add-supply-btn').addEventListener('click', () => {
            const title = prompt("준비물 명칭을 입력하세요:");
            const desc = prompt("상세 내용을 입력하세요:");
            if (title) {
                addDoc(collection(db, "supplies"), {
                    title,
                    desc,
                    createdAt: new Date(),
                    author: currentUser.email
                });
            }
        });
    }

    const q = query(collection(db, "supplies"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('supply-list');
        list.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            list.innerHTML += `
                <div class="supply-card glass">
                    <h3>${data.title}</h3>
                    <p>${data.desc}</p>
                    <small>${new Date(data.createdAt.seconds * 1000).toLocaleDateString()}</small>
                </div>
            `;
        });
    });
};

// Event Listeners
authBtn.addEventListener('click', () => {
    if (currentUser) {
        signOut(auth);
    } else {
        authModal.style.display = 'flex';
    }
});

document.querySelectorAll('.close').forEach(c => c.onclick = () => {
    authModal.style.display = 'none';
});

document.getElementById('nav-board').onclick = (e) => {
    e.preventDefault();
    if (!currentUser) return alert("로그인이 필요합니다.");
    renderBoard();
};

document.getElementById('nav-home').onclick = (e) => {
    e.preventDefault();
    renderHome();
};

document.getElementById('go-signup').onclick = () => {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
};

document.getElementById('go-login').onclick = () => {
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
};

// Auth Actions
document.getElementById('do-signup').onclick = async () => {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const name = document.getElementById('signup-name').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), { name, role, email });
        alert("회원가입 성공!");
        authModal.style.display = 'none';
    } catch (e) {
        alert("가입 실패: " + e.message);
    }
};

document.getElementById('do-login').onclick = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        authModal.style.display = 'none';
    } catch (e) {
        alert("로그인 실패: " + e.message);
    }
};

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYkqiS_gyhfArVTIV4OPIPAzc8DGn333k",
    authDomain: "jang-db278.firebaseapp.com",
    projectId: "jang-db278",
    storageBucket: "jang-db278.firebasestorage.app",
    messagingSenderId: "636003735694",
    appId: "1:636003735694:web:281075a5a4a3ce5c68d1df",
    measurementId: "G-DTBMH9JVTN"
};

// Initialize Firebase
app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getFirestore(app);
setupAuthListener();
renderHome();

// mainscript.js
import { db, auth } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const guestBtn = document.getElementById('guestBtn');
const closeModal = document.getElementById('closeModal');
const blogSection = document.getElementById('blogSection');

let floatingAddButton = null;
let floatingLogoutButton = null;
let floatingDeleteAllButton = null;
let continueAsGuest = localStorage.getItem('continueAsGuest') === 'true';



const keySequence = ['o', 's', 'a', 'd', 'm', 'i', 'n'];
let currentIndex = 0;
document.addEventListener('keydown', (event) => {
  if(event.key.toLowerCase() === keySequence[currentIndex]) {
    currentIndex++;
    if(currentIndex === keySequence.length) {
      // Reset guest mode
      localStorage.removeItem('continueAsGuest');
      continueAsGuest = false;
      loginModal.style.display = 'flex';
      currentIndex = 0;
    }
  } else {
    currentIndex = 0;
  }
});


if(closeModal) {
  closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });
}

if(loginBtn) {
  loginBtn.addEventListener('click', () => {
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        loginModal.style.display = 'none';
      })
      .catch(error => {
        alert('Błędne dane logowania: ' + error.message);
      });
  });
}

if (guestBtn) {
  guestBtn.addEventListener('click', () => {
    localStorage.setItem('continueAsGuest', 'true');
    continueAsGuest = true;
    loginModal.style.display = 'none';
  });
}

if (continueAsGuest) {
  loginModal.style.display = 'none';
}

function showAdminButtons() {
  if(floatingAddButton || floatingLogoutButton || floatingDeleteAllButton) return;

  floatingAddButton = document.createElement('button');
  floatingAddButton.textContent = 'Dodaj';
  Object.assign(floatingAddButton.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '10px 20px',
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    zIndex: '1001'
  });

  floatingLogoutButton = document.createElement('button');
  floatingLogoutButton.textContent = 'Wyloguj';
  Object.assign(floatingLogoutButton.style, {
    position: 'fixed',
    bottom: '70px',
    right: '20px',
    padding: '10px 20px',
    background: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    zIndex: '1001'
  });

  floatingDeleteAllButton = document.createElement('button');
  floatingDeleteAllButton.textContent = 'Usuń wszystkie';
  Object.assign(floatingDeleteAllButton.style, {
    position: 'fixed',
    bottom: '120px',
    right: '20px',
    padding: '10px 20px',
    background: '#c0392b',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    zIndex: '1001'
  });

  document.body.appendChild(floatingAddButton);
  document.body.appendChild(floatingLogoutButton);
  document.body.appendChild(floatingDeleteAllButton);

  floatingAddButton.addEventListener('click', showAddArticleForm);
  floatingLogoutButton.addEventListener('click', () => signOut(auth));
  floatingDeleteAllButton.addEventListener('click', deleteAllArticles);
}

async function deleteAllArticles() {
  if (!confirm('Czy na pewno chcesz usunąć wszystkie artykuły?')) return;
  try {
    const q = query(collection(db, "articles"));
    const querySnapshot = await getDocs(q);
    const deletions = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletions);
    alert('Wszystkie artykuły zostały usunięte.');
    loadArticles();
  } catch (error) {
    alert('Błąd przy usuwaniu: ' + error.message);
  }
}

function showAddArticleForm() {
  if (!blogSection) return alert('Nie znaleziono sekcji bloga.');

  const post = document.createElement('div');
  post.classList.add('post');
  post.innerHTML = `
    <div class="post-thumbnail" style="cursor:pointer;">
      <img src="https://via.placeholder.com/400x200?text=Kliknij+by+dodać" alt="Miniaturka" class="thumb" />
      <input type="file" accept="image/*" class="thumbInput" style="display:none;" />
    </div>
    <h2 contenteditable="true" class="title">Nowy tytuł</h2>
    <p><em>${new Date().toISOString().split('T')[0]}</em></p>
    <p contenteditable="true" class="content">Treść...</p>
    <button class="saveBtn">Zapisz</button>
  `;
  blogSection.prepend(post);

  const imgElement = post.querySelector('.thumb');
  const fileInput = post.querySelector('.thumbInput');

  imgElement.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      imgElement.src = reader.result;
      imgElement.dataset.base64 = reader.result;
    };
    reader.readAsDataURL(file);
  });

  post.querySelector('.saveBtn').addEventListener('click', async () => {
    const title = post.querySelector('.title').innerText.trim();
    const date = new Date().toISOString().split('T')[0];
    const content = post.querySelector('.content').innerText.trim();
    const imgSrc = imgElement.dataset.base64 || 'https://via.placeholder.com/400x200?text=Brak+miniaturki';

    try {
      const docRef = await addDoc(collection(db, 'articles'), {
        title,
        date,
        content,
        imgSrc
      });

      post.innerHTML = `
        <a href="post1.html?id=${docRef.id}" style="text-decoration:none; color:inherit; display:block;">
          <div class="post-thumbnail">
            <img src="${imgSrc}" alt="Miniaturka" />
          </div>
          <h2>${title}</h2>
          <p><em>${date}</em></p>
        </a>
      `;
    } catch (error) {
      alert('Błąd przy zapisie artykułu.');
      console.error(error);
    }
  });
}

async function loadArticles() {
  if (!blogSection) return;
  blogSection.innerHTML = 'Ładowanie...';

  try {
    const q = query(collection(db, "articles"), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    blogSection.innerHTML = '';

    if (querySnapshot.empty) {
      blogSection.textContent = 'Brak artykułów do wyświetlenia.';
      return;
    }

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const post = document.createElement('div');
      post.classList.add('post');
      post.style.margin = '20px';
      post.style.border = '1px solid #ccc';
      post.style.padding = '15px';
      post.style.borderRadius = '8px';
      post.style.boxShadow = '0 0 5px rgba(0,0,0,0.1)';

      post.innerHTML = `
        <a href="post1.html?id=${doc.id}" style="text-decoration:none; color:inherit; display:block;">
          <div class="post-thumbnail" style="margin-bottom: 10px;">
            <img src="${data.imgSrc}" alt="Miniaturka" style="max-width: 100%; height: auto; border-radius: 6px;" />
          </div>
          <h2>${data.title}</h2>
          <p><em>${data.date}</em></p>
        </a>
      `;

      blogSection.appendChild(post);
    });

  } catch (e) {
    blogSection.textContent = 'Błąd przy ładowaniu artykułów: ' + e.message;
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    showAdminButtons();
  } else {
    if(floatingAddButton) floatingAddButton.remove(), floatingAddButton = null;
    if(floatingLogoutButton) floatingLogoutButton.remove(), floatingLogoutButton = null;
    if(floatingDeleteAllButton) floatingDeleteAllButton.remove(), floatingDeleteAllButton = null;

    // NIE pokazuj logowania, jeśli użytkownik wybrał "Kontynuuj jako gość"
    if (!continueAsGuest) {
      // Można opcjonalnie dodać powiadomienie
    }
  }
});

loadArticles();

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDgWlTlsbkqIo2xQFf-UI6fE6X1KeyI9-U",
    authDomain: "madrasa-acf90.firebaseapp.com",
    projectId: "madrasa-acf90",
    storageBucket: "madrasa-acf90.firebasestorage.app",
    messagingSenderId: "128246256646",
    appId: "1:128246256646:web:49e41f5f8d16340550df87",
    measurementId: "G-3FHMCRGX0W"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// 2. ലോഗിൻ ഫങ്ക്ഷൻ
async function loginUser() {
    // പരിശോധനയ്ക്കായി: ബട്ടൺ അമർത്തിയാൽ ഉടൻ ഈ മെസ്സേജ് വരണം
    console.log("Login ബട്ടൺ അമർത്തി"); 

    const idElement = document.getElementById('login-id');
    const passElement = document.getElementById('login-pass');

    if (!idElement || !passElement) {
        alert("HTML-ൽ ഐഡികൾ തെറ്റാണ് (login-id, login-pass എന്നിവ ഉണ്ടെന്ന് ഉറപ്പാക്കുക)");
        return;
    }

    let userID = idElement.value.trim();
    const pass = passElement.value.trim();
    
    if (userID === "" || pass === "") {
        alert("ദയവായി യൂസർ ഐഡിയും പാസ്‌വേഡും നൽകുക.");
        return;
    }

    let email = userID.toLowerCase().startsWith('usthad') ? 
                userID.toLowerCase() + "@islahululoom.com" : 
                userID + "@islahululoom.com";

    try {
        const res = await auth.signInWithEmailAndPassword(email, pass);
        checkUser(res.user.uid);
    } catch (e) {
        alert("ലോഗിൻ പരാജയപ്പെട്ടു: " + e.message);
    }
}

// 3. യൂസർ റോൾ പരിശോധന
async function checkUser(uid) {
    try {
        const doc = await db.collection("users").doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('main-dashboard').style.display = 'block';
            document.getElementById('display-name').innerText = data.name;
            document.getElementById('user-avatar').innerText = data.name.charAt(0).toUpperCase();
            
            if (data.role === 'admin') {
                document.getElementById('usthad-view').style.display = 'block';
                document.getElementById('student-view').style.display = 'none';
                showSection('student-list');
            } else {
                document.getElementById('student-view').style.display = 'block';
                document.getElementById('usthad-view').style.display = 'none';
            }
        } else {
            alert("യൂസർ വിവരങ്ങൾ ലഭ്യമല്ല.");
            auth.signOut();
        }
    } catch (error) {
        alert("ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പിശക്!");
    }
}

// 4. സെക്ഷൻ സ്വിച്ചർ
function showSection(section) {
    const content = document.getElementById('dynamic-content');
    if (section === 'student-list') loadStudents();
    else if (section === 'add-student') {
        content.innerHTML = `
            <h3>പുതിയ കുട്ടി</h3>
            <input id="n-name" placeholder="പേര്">
            <input id="n-class" placeholder="ക്ലാസ്">
            <input id="n-phone" placeholder="WhatsApp (eg: 9198...)">
            <input id="n-fees" type="number" placeholder="ആകെ വരിസംഖ്യ">
            <button onclick="saveStudent()">സേവ് ചെയ്യുക</button>
        `;
    }
}

// 5. കുട്ടി വിവരങ്ങൾ സേവ് ചെയ്യുക
async function saveStudent() {
    const name = document.getElementById('n-name').value;
    const cls = document.getElementById('n-class').value;
    const phone = document.getElementById('n-phone').value;
    const fees = document.getElementById('n-fees').value;

    try {
        await db.collection("students").add({
            name, class: cls, parentPhone: phone, 
            totalAmount: Number(fees), paidAmount: 0, balance: Number(fees)
        });
        alert("വിജയകരമായി ചേർത്തു!");
        showSection('student-list');
    } catch(e) {
        alert("സേവ് ചെയ്യുന്നതിൽ പിശക്!");
    }
}

// 6. ലിസ്റ്റ് ലോഡ് ചെയ്യുക
async function loadStudents() {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = "ലോഡിംഗ്...";
    const snap = await db.collection("students").get();
    content.innerHTML = "";
    snap.forEach(doc => {
        const s = doc.data();
        content.innerHTML += `
            <div class="student-item" style="border:1px solid #ddd; padding:10px; margin-bottom:5px; border-radius:8px;">
                <strong>${s.name} (Class: ${s.class})</strong><br>
                ബാക്കി: ₹${s.balance}
                <button onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')" style="margin-top:5px;">Pay Fee</button>
            </div>
        `;
    });
}

// 7. വരിസംഖ്യ അപ്‌ഡേറ്റ് & വാട്ട്‌സ്ആപ്പ്
async function updateFees(id, phone, name) {
    const amt = prompt("അടച്ച തുക നൽകുക:");
    if (!amt || isNaN(amt)) return;

    try {
        const ref = db.collection("students").doc(id);
        const doc = await ref.get();
        const data = doc.data();
        
        const newPaid = Number(data.paidAmount) + Number(amt);
        const newBal = Number(data.totalAmount) - newPaid;

        await ref.update({ paidAmount: newPaid, balance: newBal });
        
        const msg = `അസ്സലാമു അലൈക്കും, ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസയിൽ നിന്ന്: ${name}, ${amt} രൂപ വരിസംഖ്യ അടച്ചു. ബാക്കി തുക: ₹${newBal}.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');

        loadStudents();
    } catch(e) {
        alert("പിശക് സംഭവിച്ചു!");
    }
}

function logout() { auth.signOut().then(() => location.reload()); }


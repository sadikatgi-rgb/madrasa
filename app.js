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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. ലോഗിൻ ഫങ്ക്ഷൻ
async function loginUser() {
    const userID = document.getElementById('login-id').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    
    if (!userID || !pass) {
        alert("ഐഡിയും പാസ്‌വേഡും നൽകുക");
        return;
    }

    // വിദ്യാർത്ഥി ലോഗിൻ പരിശോധന (Email ഇല്ലാതെ ID മാത്രം ഉപയോഗിച്ച്)
    if (!userID.toLowerCase().startsWith('usthad')) {
        checkStudentLogin(userID, pass);
        return;
    }

    // ഉസ്താദ് ലോഗിൻ
    let email = userID.toLowerCase() + "@islahululoom.com";
    try {
        const res = await auth.signInWithEmailAndPassword(email, pass);
        checkUser(res.user.uid);
    } catch (e) {
        alert("ലോഗിൻ പരാജയപ്പെട്ടു: " + e.message);
    }
}

// വിദ്യാർത്ഥി ലോഗിൻ ലോജിക്
async function checkStudentLogin(sid, pass) {
    // ഇവിടെ പാസ്‌വേഡ് ആയി ഫോൺ നമ്പറോ മറ്റോ ഉപയോഗിക്കാം. തൽക്കാലം ലളിതമാക്കാൻ ID മാത്രം നോക്കുന്നു.
    const snap = await db.collection("students").where("studentID", "==", sid).get();
    if (!snap.empty) {
        const s = snap.docs[0].data();
        showStudentProfile(s);
    } else {
        alert("വിദ്യാർത്ഥി ഐഡി തെറ്റാണ്!");
    }
}

// 3. ഉസ്താദ് റോൾ പരിശോധന
async function checkUser(uid) {
    try {
        const doc = await db.collection("users").doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('main-dashboard').style.display = 'block';
            document.getElementById('display-name').innerText = data.name;
            document.getElementById('display-role').innerText = "Administrator";
            
            document.getElementById('usthad-view').style.display = 'block';
            document.getElementById('student-view').style.display = 'none';
            showSection('student-list');
        }
    } catch (error) {
        alert("Error loading data!");
    }
}

function showStudentProfile(s) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'block';
    document.getElementById('student-view').style.display = 'block';
    document.getElementById('usthad-view').style.display = 'none';
    document.getElementById('display-name').innerText = s.name;
    document.getElementById('display-role').innerText = "Student (Class: " + s.class + ")";
    
    document.getElementById('my-details-box').innerHTML = `
        <div class="student-item">
            <p><strong>പിതാവ്:</strong> ${s.fatherName}</p>
            <p><strong>വീട്:</strong> ${s.houseName}</p>
            <p><strong>ഐഡി:</strong> ${s.studentID}</p>
            <hr style="margin:10px 0;">
            <p><strong>ആകെ വരിസംഖ്യ:</strong> ₹${s.totalAmount}</p>
            <p><strong>അടച്ചത്:</strong> ₹${s.paidAmount}</p>
            <p style="color:red; font-weight:bold;">ബാക്കി: ₹${s.balance}</p>
        </div>
    `;
}

// 4. സെക്ഷൻ സ്വിച്ചർ
function showSection(section) {
    const content = document.getElementById('dynamic-content');
    if (section === 'student-list') loadStudents();
    else if (section === 'add-student') {
        content.innerHTML = `
            <h3>പുതിയ കുട്ടി</h3>
            <input id="n-name" placeholder="കുട്ടിയുടെ പേര്">
            <input id="n-class" placeholder="ക്ലാസ്സ് (eg: 1, 2..)">
            <input id="n-father" placeholder="പിതാവിന്റെ പേര്">
            <input id="n-house" placeholder="വീട്ടുപേര്">
            <input id="n-sibling" placeholder="സഹോദരങ്ങൾ ഉള്ള ക്ലാസ്സ്">
            <input id="n-phone" placeholder="വാട്ട്സാപ്പ് നമ്പർ">
            <input id="n-fees" type="number" placeholder="ആകെ വരിസംഖ്യ">
            <button onclick="saveStudent()">സേവ് ചെയ്യുക</button>
        `;
    }
}

// 5. കുട്ടി വിവരങ്ങൾ സേവ് ചെയ്യുക
async function saveStudent() {
    const name = document.getElementById('n-name').value;
    const cls = document.getElementById('n-class').value;
    const father = document.getElementById('n-father').value;
    const house = document.getElementById('n-house').value;
    const sibling = document.getElementById('n-sibling').value;
    const phone = document.getElementById('n-phone').value;
    const fees = document.getElementById('n-fees').value;

    // ലളിതമായ ഒരു സ്റ്റുഡന്റ് ഐഡി ഉണ്ടാക്കുന്നു (പേരും ഫോണിന്റെ അവസാന 4 അക്കവും)
    const sid = name.toLowerCase().substring(0,3) + phone.slice(-4);

    try {
        await db.collection("students").add({
            name, class: cls, fatherName: father, houseName: house,
            siblingInfo: sibling, parentPhone: phone, studentID: sid,
            totalAmount: Number(fees), paidAmount: 0, balance: Number(fees)
        });
        alert("വിജയകരമായി ചേർത്തു! കുട്ടിയുടെ ID: " + sid);
        showSection('student-list');
    } catch(e) {
        alert("Error saving data!");
    }
}

// 6. ലിസ്റ്റ് ലോഡ് ചെയ്യുക (ക്ലാസ്സ് ഫിൽട്ടർ സഹിതം)
async function loadStudents(filterClass = 'all') {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <select onchange="loadStudents(this.value)" style="margin-bottom:15px;">
            <option value="all">എല്ലാ ക്ലാസ്സും</option>
            <option value="1">ക്ലാസ്സ് 1</option>
            <option value="2">ക്ലാസ്സ് 2</option>
            <option value="3">ക്ലാസ്സ് 3</option>
            <option value="4">ക്ലാസ്സ് 4</option>
        </select>
        <div id="list-area">ലോഡിംഗ്...</div>
    `;

    let query = db.collection("students");
    if (filterClass !== 'all') query = query.where("class", "==", filterClass);

    const snap = await query.get();
    const listArea = document.getElementById('list-area');
    listArea.innerHTML = "";

    snap.forEach(doc => {
        const s = doc.data();
        listArea.innerHTML += `
            <div class="student-item">
                <strong>${s.name} (ക്ലാസ്: ${s.class})</strong><br>
                <small>വീട്: ${s.houseName} | ID: ${s.studentID}</small><br>
                <span style="color:${s.balance > 0 ? 'red' : 'green'}">ബാക്കി: ₹${s.balance}</span>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="fee-btn" onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')">Pay Fee</button>
                    <button class="wa-btn" onclick="window.open('https://wa.me/${s.parentPhone}', '_blank')"><i class="fab fa-whatsapp"></i> Chat</button>
                </div>
            </div>
        `;
    });
}

// 7. ഫീ അപ്‌ഡേറ്റ്
async function updateFees(id, phone, name) {
    const amt = prompt("അടച്ച തുക നൽകുക:");
    if (!amt || isNaN(amt)) return;

    const ref = db.collection("students").doc(id);
    const doc = await ref.get();
    const s = doc.data();
    
    const newPaid = Number(s.paidAmount) + Number(amt);
    const newBal = Number(s.totalAmount) - newPaid;

    await ref.update({ paidAmount: newPaid, balance: newBal });
    
    const msg = `അസ്സലാമു അലൈക്കും, ${name} വരിസംഖ്യ ₹${amt} അടച്ചു. ബാക്കി: ₹${newBal}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    loadStudents();
}

function logout() { auth.signOut().then(() => location.reload()); }

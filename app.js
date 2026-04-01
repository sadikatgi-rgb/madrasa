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
// ... (Firebase Config പഴയത് പോലെ തന്നെ വയ്ക്കുക)

// 4. സെക്ഷൻ സ്വിച്ചർ അപ്ഡേറ്റ് ചെയ്തത്
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
            <input id="n-sibling-name" placeholder="സഹോദരങ്ങളുടെ പേര്">
            <input id="n-sibling-class" placeholder="സഹോദരങ്ങൾ പഠിക്കുന്ന ക്ലാസ്സ്">
            <input id="n-phone" placeholder="വാട്ട്സാപ്പ് നമ്പർ (91xxxx)">
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
    const sName = document.getElementById('n-sibling-name').value;
    const sClass = document.getElementById('n-sibling-class').value;
    const phone = document.getElementById('n-phone').value;
    const fees = document.getElementById('n-fees').value;

    const sid = name.toLowerCase().substring(0,3) + phone.slice(-4);

    try {
        await db.collection("students").add({
            name, class: cls, fatherName: father, houseName: house,
            siblingName: sName, siblingClass: sClass, parentPhone: phone, studentID: sid,
            totalAmount: Number(fees), paidAmount: 0, balance: Number(fees)
        });
        alert("വിജയകരമായി ചേർത്തു!");
        showSection('student-list');
    } catch(e) { alert("Error!"); }
}

// 6. ലിസ്റ്റ് ലോഡ് ചെയ്യുക (Edit/Delete ബട്ടണുകൾ സഹിതം)
async function loadStudents(filterClass = 'all') {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <select onchange="loadStudents(this.value)" style="margin-bottom:15px;">
            <option value="all">എല്ലാ ക്ലാസ്സും</option>
            <option value="1">ക്ലാസ്സ് 1</option>
            <option value="2">ക്ലാസ്സ് 2</option>
            <option value="3">ക്ലാസ്സ് 3</option>
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
            <div class="student-item" style="position:relative;">
                <div style="position:absolute; right:10px; top:10px;">
                    <i class="fas fa-edit" onclick="editStudent('${doc.id}')" style="color:blue; cursor:pointer; margin-right:15px;"></i>
                    <i class="fas fa-trash" onclick="deleteStudent('${doc.id}')" style="color:red; cursor:pointer;"></i>
                </div>
                <strong>${s.name} (ക്ലാസ്: ${s.class})</strong><br>
                <small>വീട്: ${s.houseName || 'N/A'} | ID: ${s.studentID}</small><br>
                <small>സഹോദരങ്ങൾ: ${s.siblingName || 'ഇല്ല'} (${s.siblingClass || '-'})</small><br>
                <span style="color:red; font-weight:bold;">ബാക്കി: ₹${s.balance}</span>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button class="fee-btn" onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')">Pay Fee</button>
                    <button class="wa-btn" onclick="sendCustomWA('${s.parentPhone}', '${s.name}')"><i class="fab fa-whatsapp"></i> Chat</button>
                </div>
            </div>
        `;
    });
}

// 8. എഡിറ്റ് ഫങ്ക്ഷൻ
async function editStudent(id) {
    const doc = await db.collection("students").doc(id).get();
    const s = doc.data();
    
    const newName = prompt("പേര് മാറ്റുക:", s.name);
    const newClass = prompt("ക്ലാസ്സ് മാറ്റുക:", s.class);
    const newPhone = prompt("ഫോൺ നമ്പർ മാറ്റുക:", s.parentPhone);
    const newTotal = prompt("ആകെ വരിസംഖ്യ മാറ്റുക:", s.totalAmount);

    if (newName && newClass) {
        const newBal = Number(newTotal) - Number(s.paidAmount);
        await db.collection("students").doc(id).update({
            name: newName, class: newClass, parentPhone: newPhone, 
            totalAmount: Number(newTotal), balance: newBal
        });
        alert("വിവരങ്ങൾ പുതുക്കി!");
        loadStudents();
    }
}

// 9. ഡിലീറ്റ് ഫങ്ക്ഷൻ
async function deleteStudent(id) {
    if (confirm("ഈ കുട്ടിയുടെ വിവരങ്ങൾ പൂർണ്ണമായും ഒഴിവാക്കണോ?")) {
        await db.collection("students").doc(id).delete();
        alert("ഒഴിവാക്കി!");
        loadStudents();
    }
}

// 10. വാട്സാപ്പ് ചാറ്റ് (സാധാരണ മെസ്സേജ് അയക്കാൻ)
function sendCustomWA(phone, name) {
    const msg = `അസ്സലാമു അലൈക്കും, ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസയിൽ നിന്ന് ${name}-ന്റെ കാര്യവുമായി ബന്ധപ്പെട്ട് ബന്ധപ്പെടുകയാണ്.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ... (ബാക്കി updateFees, logout പഴയത് പോലെ തന്നെ വയ്ക്കുക)

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

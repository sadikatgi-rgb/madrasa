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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
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

    if (!userID.toLowerCase().startsWith('usthad')) {
        checkStudentLogin(userID, pass);
        return;
    }

    let email = userID.toLowerCase() + "@islahululoom.com";
    try {
        const res = await auth.signInWithEmailAndPassword(email, pass);
        checkUser(res.user.uid);
    } catch (e) {
        alert("ലോഗിൻ പരാജയപ്പെട്ടു: " + e.message);
    }
}

async function checkStudentLogin(sid, pass) {
    const snap = await db.collection("students").where("studentID", "==", sid).get();
    if (!snap.empty) {
        const s = snap.docs[0].data();
        showStudentProfile(s, snap.docs[0].id);
    } else {
        alert("വിദ്യാർത്ഥി ഐഡി തെറ്റാണ്!");
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
            document.getElementById('display-role').innerText = "Administrator";
            
            document.getElementById('usthad-view').style.display = 'block';
            document.getElementById('student-view').style.display = 'none';
            showSection('student-list');
        }
    } catch (error) { alert("Error!"); }
}

function showStudentProfile(s, docId) {
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
            <button onclick="viewHistory('${docId}', '${s.name}')" style="background:#6c757d; margin-top:15px;">എന്റെ പെയ്മെന്റ് ഹിസ്റ്ററി</button>
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
    const ഇപ്പോൾ = new Date();
    const സമയം = ഇപ്പോൾ.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const തീയതി = ഇപ്പോൾ.toLocaleDateString('en-IN'); 

    try {
        await db.collection("students").add({
            name, class: cls, fatherName: father, houseName: house,
            siblingName: sName, siblingClass: sClass, parentPhone: phone, studentID: sid,
            totalAmount: Number(fees), paidAmount: 0, balance: Number(fees),
            addedDate: തീയതി, addedTime: സമയം,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`വിജയകരമായി ചേർത്തു! \nID: ${sid}`);
        showSection('student-list');
    } catch(e) { alert("Error!"); }
}

// 6. ലിസ്റ്റ് ലോഡ് ചെയ്യുക
async function loadStudents(filterClass = 'all') {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <select onchange="loadStudents(this.value)" style="margin-bottom:15px; width:100%; padding:10px;">
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
            <div class="student-item" style="position:relative; border:1px solid #ddd; padding:15px; border-radius:10px; margin-bottom:10px;">
                <div style="position:absolute; right:10px; top:10px;">
                    <i class="fas fa-edit" onclick="editStudent('${doc.id}')" style="color:blue; cursor:pointer; margin-right:15px;"></i>
                    <i class="fas fa-trash" onclick="deleteStudent('${doc.id}')" style="color:red; cursor:pointer;"></i>
                </div>
                <strong>${s.name} (ക്ലാസ്: ${s.class})</strong><br>
                <small>വീട്: ${s.houseName || '-'} | ID: ${s.studentID}</small><br>
                <small>സഹോദരങ്ങൾ: ${s.siblingName || 'ഇല്ല'} (${s.siblingClass || '-'})</small><br>
                <small style="color:#666;">ചേർത്തത്: ${s.addedDate} | ${s.addedTime}</small><br>
                <span style="color:red; font-weight:bold;">ബാക്കി: ₹${s.balance}</span>
                <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:10px;">
                    <button class="fee-btn" onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')" style="flex:1;">Pay Fee</button>
                    <button onclick="viewHistory('${doc.id}', '${s.name}')" style="background:#6c757d; flex:1;">History</button>
                    <button class="wa-btn" onclick="sendCustomWA('${s.parentPhone}', '${s.name}')" style="flex:1;"><i class="fab fa-whatsapp"></i> Chat</button>
                </div>
            </div>
        `;
    });
}

// 7. ഫീ അപ്‌ഡേറ്റ് & ഹിസ്റ്ററി
async function updateFees(id, phone, name) {
    const amt = prompt("അടച്ച തുക നൽകുക:");
    if (!amt || isNaN(amt)) return;

    try {
        const ref = db.collection("students").doc(id);
        const doc = await ref.get();
        const s = doc.data();
        
        const newPaid = Number(s.paidAmount) + Number(amt);
        const newBal = Number(s.totalAmount) - newPaid;

        await ref.update({ paidAmount: newPaid, balance: newBal });

        const ഇപ്പോൾ = new Date();
        const ദിവസം = ഇപ്പോൾ.getDate().toString().padStart(2, '0');
        const മാസം = (ഇപ്പോൾ.getMonth() + 1).toString().padStart(2, '0');
        const വർഷം = ഇപ്പോൾ.getFullYear();
        const ആഴ്ചദിവസങ്ങൾ = ["ഞായർ", "തിങ്കൾ", "ചൊവ്വ", "ബുധൻ", "വ്യാഴം", "വെള്ളി", "ശനി"];
        const തീയതിഫോർമാറ്റ് = `${ദിവസം}/${മാസം}/${വർഷം} ${ആഴ്ചദിവസങ്ങൾ[ഇപ്പോൾ.getDay()]}`;
        const സമയം = ഇപ്പോൾ.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        await db.collection("payments").add({
            studentId: id,
            studentName: name,
            amountPaid: Number(amt),
            date: `${ദിവസം}/${മാസം}/${വർഷം}`,
            time: സമയം,
            currentBalance: newBal,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        const msg = `അസ്സലാമു അലൈക്കും, 
ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസയിൽ നിന്ന്: 
വിദ്യാർത്ഥി: ${name}
തീയതി: ${തീയതിഫോർമാറ്റ്}
അടച്ച തുക: ₹${amt}
ബാക്കി വരിസംഖ്യ: ₹${newBal}.`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        loadStudents();
    } catch(e) { alert("Error!"); }
}

// 8. ഹിസ്റ്ററി കാണാൻ
async function viewHistory(studentId, studentName) {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `<h4>Payment History: ${studentName}</h4><button onclick="loadStudents()" style="margin-bottom:10px; width:auto; padding:5px 10px;">Back</button><div id="hist-list">ലോഡിംഗ്...</div>`;
    
    const snap = await db.collection("payments")
                    .where("studentId", "==", studentId)
                    .orderBy("timestamp", "desc")
                    .get();
    
    const histArea = document.getElementById('hist-list');
    histArea.innerHTML = "";
    
    if(snap.empty) { histArea.innerHTML = "വിവരങ്ങൾ ലഭ്യമല്ല"; return; }

    snap.forEach(doc => {
        const p = doc.data();
        histArea.innerHTML += `
            <div style="background:#f0f7ff; padding:10px; margin-bottom:8px; border-radius:8px; border-left:4px solid #1a73e8;">
                <small>${p.date} | ${p.time}</small><br>
                <strong>അടച്ചത്: ₹${p.amountPaid}</strong><br>
                <small>ആ സമയത്തെ ബാക്കി: ₹${p.currentBalance}</small>
            </div>
        `;
    });
}

// എഡിറ്റ് & ഡിലീറ്റ്
async function editStudent(id) {
    const doc = await db.collection("students").doc(id).get();
    const s = doc.data();
    const newName = prompt("പേര് മാറ്റുക:", s.name);
    const newClass = prompt("ക്ലാസ്സ് മാറ്റുക:", s.class);
    const newTotal = prompt("ആകെ വരിസംഖ്യ മാറ്റുക:", s.totalAmount);

    if (newName && newClass) {
        const newBal = Number(newTotal) - Number(s.paidAmount);
        await db.collection("students").doc(id).update({
            name: newName, class: newClass, totalAmount: Number(newTotal), balance: newBal
        });
        loadStudents();
    }
}

async function deleteStudent(id) {
    if (confirm("ഒഴിവാക്കണോ?")) {
        await db.collection("students").doc(id).delete();
        loadStudents();
    }
}

function sendCustomWA(phone, name) {
    const msg = `അസ്സലാമു അലൈക്കും, ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസയിൽ നിന്ന് ${name}-ന്റെ കാര്യവുമായി ബന്ധപ്പെട്ട് ബന്ധപ്പെടുകയാണ്.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function logout() { auth.signOut().then(() => location.reload()); }

let students = JSON.parse(localStorage.getItem('students')) || ['Alice', 'Bob', 'Charlie', 'Diana'];
let teacherName = localStorage.getItem('teacherName') || '';
let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || {};

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

function markAttendance(student, status) {
    if (!attendanceData[today]) {
        attendanceData[today] = [];
    }
    if (status === 'present') {
        if (!attendanceData[today].includes(student)) {
            attendanceData[today].push(student);
        }
    } else {
        const index = attendanceData[today].indexOf(student);
        if (index > -1) {
            attendanceData[today].splice(index, 1);
        }
    }
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    renderAttendance();
    renderReports();
}

function renderAttendance() {
    const studentList = document.getElementById('student-list');
    studentList.innerHTML = '';
    students.forEach(student => {
        const div = document.createElement('div');
        div.className = 'student';
        div.innerHTML = `
            <span>${student}</span>
            <div>
                <button class="present-btn" onclick="markAttendance('${student}', 'present')">Present</button>
                <button class="absent-btn" onclick="markAttendance('${student}', 'absent')">Absent</button>
                <button class="remove-btn" onclick="removeStudent('${student}')">Hapus</button>
            </div>
        `;
        studentList.appendChild(div);
    });
}

function renderReports() {
    const reports = document.getElementById('reports');
    reports.innerHTML = '';
    const totalDays = Object.keys(attendanceData).length;
    students.forEach(student => {
        let presentDays = 0;
        Object.values(attendanceData).forEach(day => {
            if (day.includes(student)) {
                presentDays++;
            }
        });
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;
        const div = document.createElement('div');
        div.className = 'report-item';
        div.innerHTML = `${student}: ${presentDays}/${totalDays} days (${percentage}%)`;
        reports.appendChild(div);
    });
}

function exportToExcel() {
    const now = new Date();
    const exportDateTime = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`;
    const data = [
        { Date: 'Teacher', Present: teacherName, Absent: '' },
        { Date: 'Exported on', Present: exportDateTime, Absent: '' },
        { Date: '', Present: '', Absent: '' }
    ];

    // Add daily attendance
    const dates = Object.keys(attendanceData).sort();
    dates.forEach(date => {
        const present = attendanceData[date];
        const absent = students.filter(s => !present.includes(s));
        data.push({
            Date: date,
            Present: present.join(', '),
            Absent: absent.join(', ')
        });
    });

    // Add summary
    data.push({ Date: '', Present: '', Absent: '' });
    data.push({ Date: 'Summary', Present: '', Absent: '' });
    students.forEach(student => {
        const totalDays = dates.length;
        let presentDays = 0;
        dates.forEach(date => {
            if (attendanceData[date].includes(student)) {
                presentDays++;
            }
        });
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;
        data.push({
            Date: student,
            Present: `${presentDays}/${totalDays}`,
            Absent: `${percentage}%`
        });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, 'attendance_report.xlsx');
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const now = new Date();
    const exportDateTime = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`;
    doc.text('Attendance Report', 10, 10);
    doc.text(`Teacher: ${teacherName}`, 10, 20);
    doc.text(`Exported on: ${exportDateTime}`, 10, 30);
    let y = 40;

    // Daily attendance
    const dates = Object.keys(attendanceData).sort();
    dates.forEach(date => {
        const present = attendanceData[date];
        const absent = students.filter(s => !present.includes(s));
        doc.text(`${date}: Present - ${present.join(', ')}`, 10, y);
        y += 10;
        doc.text(`Absent - ${absent.join(', ')}`, 10, y);
        y += 10;
    });

    y += 10;
    doc.text('Summary:', 10, y);
    y += 10;
    students.forEach(student => {
        const totalDays = dates.length;
        let presentDays = 0;
        dates.forEach(date => {
            if (attendanceData[date].includes(student)) {
                presentDays++;
            }
        });
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;
        doc.text(`${student}: ${presentDays}/${totalDays} (${percentage}%)`, 10, y);
        y += 10;
    });
    doc.save('attendance_report.pdf');
}

document.getElementById('export-excel').addEventListener('click', exportToExcel);
document.getElementById('export-pdf').addEventListener('click', exportToPDF);

// Display current date and time
function updateDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('id-ID');
    const time = now.toLocaleTimeString('id-ID');
    document.getElementById('current-date').innerText = `Tanggal: ${date} | Waktu: ${time}`;
}
updateDateTime();
setInterval(updateDateTime, 1000);

// Functions for teacher and students
function saveTeacher() {
    const input = document.getElementById('teacher-name');
    teacherName = input.value.trim();
    localStorage.setItem('teacherName', teacherName);
    alert('Nama guru disimpan!');
}

function addStudent() {
    const input = document.getElementById('new-student');
    const name = input.value.trim();
    if (name && !students.includes(name)) {
        students.push(name);
        localStorage.setItem('students', JSON.stringify(students));
        input.value = '';
        renderAttendance();
        renderReports();
    } else {
        alert('Nama murid tidak valid atau sudah ada!');
    }
}

function removeStudent(student) {
    students = students.filter(s => s !== student);
    localStorage.setItem('students', JSON.stringify(students));
    // Also remove from attendance data
    Object.keys(attendanceData).forEach(day => {
        attendanceData[day] = attendanceData[day].filter(s => s !== student);
    });
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    renderAttendance();
    renderReports();
}

document.getElementById('save-teacher').addEventListener('click', saveTeacher);
document.getElementById('add-student').addEventListener('click', addStudent);

// Set initial teacher name
document.getElementById('teacher-name').value = teacherName;

// Initial render
renderAttendance();
renderReports();

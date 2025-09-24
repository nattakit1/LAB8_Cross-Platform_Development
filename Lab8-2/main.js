const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
    console.log('🖥️ [MAIN] กำลังสร้าง window...');

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 900,
        webPreferences: {
            nodeIntegration: false,      // ✅ ปิดเพื่อความปลอดภัย
            contextIsolation: true,      // ✅ เปิดเพื่อความปลอดภัย  
            preload: path.join(__dirname, 'preload.js')  // ✅ ใช้ preload
        }
    });

    mainWindow.loadFile('index.html');

    // เปิด DevTools เพื่อดู console
    mainWindow.webContents.openDevTools();

    console.log('✅ [MAIN] สร้าง window สำเร็จ');
}

// 📨 Handler สำหรับรับข้อความ
ipcMain.handle('send-message', (event, message) => {
    console.log('📨 [MAIN] ได้รับข้อความ:', message);

    // ประมวลผลข้อความ
    const response = {
        original: message,
        reply: `Server ได้รับ: "${message}"`,
        timestamp: new Date().toISOString(),
        status: 'success'
    };

    console.log('📤 [MAIN] ส่งกลับ:', response);
    return response;
});

// 👋 Handler สำหรับคำทักทาย
ipcMain.handle('say-hello', (event, name) => {
    console.log('👋 [MAIN] ทักทายกับ:', name);

    const greetings = [
        `สวัสดี ${name}! ยินดีต้อนรับสู่ Agent Wallboard`,
        `หวัดดี ${name}! วันนี้พร้อมทำงานแล้วหรือยัง?`,
        `Hello ${name}! มีความสุขในการทำงานนะ`,
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    return {
        greeting: randomGreeting,
        name: name,
        time: new Date().toLocaleString('th-TH'),
        agentCount: 3  // จำลองจำนวน agents ที่ online
    };
});

console.log('🔧 [MAIN] IPC Handlers ตั้งค่าเสร็จแล้ว');

// 📊 Handler สำหรับโหลดข้อมูล agents
ipcMain.handle('get-agents', async () => {
    console.log('📊 [MAIN] กำลังโหลดข้อมูล agents...');

    try {
        // อ่านไฟล์ข้อมูล agents
        const data = await fs.readFile('agent-data.json', 'utf8');
        const agentData = JSON.parse(data);

        console.log('✅ [MAIN] โหลดข้อมูล agents สำเร็จ');
        return {
            success: true,
            data: agentData,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ [MAIN] Error โหลดข้อมูล:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// ✅ เพิ่ม handler สำหรับ authentication
ipcMain.handle('authenticate', async (event, { agentId, password }) => {
    const credRaw = await fs.readFile(path.join(__dirname, 'credentials.json'), 'utf8');
    const credentials = JSON.parse(credRaw);

    if (credentials[agentId] && credentials[agentId] === password) {
        const dataRaw = await fs.readFile(path.join(__dirname, 'agent-data.json'), 'utf8');
        const agentData = JSON.parse(dataRaw);
        const agent = agentData.agents.find(a => a.id === agentId);
        return { success: true, agent, message: 'Authenticated' };
    }
    return { success: false, error: 'Invalid credentials' };
});

// 🔄 Handler สำหรับเปลี่ยนสถานะ agent
// ✅ แก้ change-agent-status ให้ broadcast กลับ renderer
ipcMain.handle('change-agent-status', async (event, { agentId, newStatus }) => {
    const filePath = path.join(__dirname, 'agent-data.json');
    const dataRaw = await fs.readFile(filePath, 'utf8');
    const agentData = JSON.parse(dataRaw);

    const agent = agentData.agents.find(a => a.id === agentId);
    agent.status = newStatus;
    agent.lastStatusChange = new Date().toISOString();

    await fs.writeFile(filePath, JSON.stringify(agentData, null, 2));

    // ✅ ส่ง event กลับไปยัง renderer
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('agent-status-updated', { agent, statistics: agentData.statistics });
    });

    return { success: true, agent, message: `เปลี่ยนสถานะเป็น ${newStatus} แล้ว` };
});

app.whenReady().then(() => {
    console.log('⚡ [MAIN] Electron พร้อมทำงาน');
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
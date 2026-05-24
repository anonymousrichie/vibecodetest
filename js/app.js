import { supabase } from './auth.js';
import { extractTasksFromText } from './ai.js';

// DOM Elements
const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const taskModal = document.getElementById('taskModal');
const addBtn = document.getElementById('addBtn');
const closeModal = document.getElementById('closeModal');
const logoutBtn = document.getElementById('logoutBtn');
const panicBtn = document.getElementById('panicBtn');
const dueTodayCount = document.getElementById('dueTodayCount');
const nextActionTitle = document.getElementById('nextActionTitle');
const nextActionDeadline = document.getElementById('nextActionDeadline');

// AI Elements
const aiBtn = document.getElementById('aiBtn');
const aiModal = document.getElementById('aiModal');
const closeAiModal = document.getElementById('closeAiModal');
const extractBtn = document.getElementById('extractBtn');
const aiInput = document.getElementById('aiInput');

// State
let tasks = [];
let isPanicMode = false;

// Initialize
async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }
    fetchTasks();
}

// Fetch Tasks
async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true });

    if (error) {
        console.error('Error fetching tasks:', error);
        return;
    }

    tasks = data;
    renderTasks();
    updateStats();
}

// Render Tasks
function renderTasks() {
    taskList.innerHTML = '';
    
    let filteredTasks = tasks;
    if (isPanicMode) {
        filteredTasks = tasks.filter(t => t.priority === 'critical' || t.priority === 'high');
        if (filteredTasks.length === 0) {
             taskList.innerHTML = '<p class="text-center text-panic-orange font-bold py-8 animate-pulse">NOTHING CRITICAL! YOU MIGHT SURVIVE. 😮‍💨</p>';
             return;
        }
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<p class="text-center opacity-40 py-8">No missions yet. Add one!</p>';
        return;
    }

    filteredTasks.forEach(task => {
        // ... (rest of the card rendering logic is same)
        const date = new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const priorityColor = getPriorityColor(task.priority);
        
        const card = document.createElement('div');
        card.className = `glass p-4 rounded-2xl flex justify-between items-center group animate-fade-in ${task.status === 'completed' ? 'opacity-50' : ''}`;
        card.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${priorityColor}"></span>
                    <h4 class="font-bold ${task.status === 'completed' ? 'line-through' : ''}">${task.title}</h4>
                </div>
                <p class="text-[10px] opacity-60 mt-1 uppercase tracking-wider font-bold">${date}</p>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="toggleTask('${task.id}', '${task.status}')" class="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <i data-lucide="${task.status === 'completed' ? 'rotate-ccw' : 'check'}" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteTask('${task.id}')" class="p-2 hover:bg-panic-red/20 text-panic-red rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        taskList.appendChild(card);
    });
    
    if (window.refreshIcons) window.refreshIcons();
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'critical': return 'bg-panic-red panic-glow';
        case 'high': return 'bg-orange-500';
        case 'medium': return 'bg-yellow-400';
        default: return 'bg-blue-400';
    }
}

// Update Stats & Next Action
function updateStats() {
    const today = new Date().setHours(0,0,0,0);
    const dueToday = tasks.filter(t => new Date(t.deadline).setHours(0,0,0,0) === today && t.status !== 'completed').length;
    dueTodayCount.textContent = dueToday;

    const urgent = tasks.find(t => t.status !== 'completed');
    if (urgent) {
        nextActionTitle.textContent = urgent.title;
        nextActionDeadline.textContent = `Due ${new Date(urgent.deadline).toLocaleString()}`;
    } else {
        nextActionTitle.textContent = "No urgent tasks!";
        nextActionDeadline.textContent = "You're chilling... for now.";
    }
}

// Task Actions
window.toggleTask = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    if (!error) fetchTasks();
};

window.deleteTask = async (id) => {
    if (!confirm('Abort this mission?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) fetchTasks();
};

// Event Listeners
addBtn.addEventListener('click', () => taskModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => taskModal.classList.add('hidden'));

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    
    const newTask = {
        user_id: user.id,
        title: document.getElementById('taskTitle').value,
        deadline: document.getElementById('taskDeadline').value,
        priority: document.getElementById('taskPriority').value,
        status: 'todo'
    };

    const { error } = await supabase.from('tasks').insert([newTask]);
    if (error) {
        alert(error.message);
    } else {
        taskModal.classList.add('hidden');
        taskForm.reset();
        fetchTasks();
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'auth.html';
});

// Panic Mode
panicBtn.addEventListener('click', () => {
    isPanicMode = !isPanicMode;
    document.body.classList.toggle('panic-mode-active');
    
    const survivalMessage = document.getElementById('survivalMessage');
    const tips = [
        "Survival Mode: ON 💀",
        "Stop scrolling. Start cooking. 🔥",
        "Coffee is your only friend now. ☕",
        "Focus on the RED missions first. 🎯",
        "Minimum effort, maximum survival. 🛡️"
    ];

    if (isPanicMode) {
        panicBtn.textContent = "I'M SURVIVING ⚡";
        survivalMessage.textContent = tips[Math.floor(Math.random() * tips.length)];
        survivalMessage.classList.remove('hidden');
    } else {
        panicBtn.textContent = "I'M COOKED 😭";
        survivalMessage.classList.add('hidden');
    }
    renderTasks();
});

// AI Modals
aiBtn.addEventListener('click', () => aiModal.classList.remove('hidden'));
closeAiModal.addEventListener('click', () => aiModal.classList.add('hidden'));

// AI Extraction Logic
extractBtn.addEventListener('click', async () => {
    const text = aiInput.value.trim();
    if (!text) return;

    extractBtn.disabled = true;
    extractBtn.textContent = 'Analyzing...';

    try {
        const extractedTasks = await extractTasksFromText(text);
        const { data: { user } } = await supabase.auth.getUser();

        const tasksToInsert = extractedTasks.map(t => ({
            ...t,
            user_id: user.id,
            status: 'todo'
        }));

        const { error } = await supabase.from('tasks').insert(tasksToInsert);
        if (error) throw error;

        aiModal.classList.add('hidden');
        aiInput.value = '';
        fetchTasks();
        alert(`Successfully extracted ${extractedTasks.length} missions!`);
    } catch (error) {
        alert(error.message);
    } finally {
        extractBtn.disabled = false;
        extractBtn.textContent = 'Extract Tasks';
    }
});

init();

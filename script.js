class TaskManager {
    constructor() {
        // Check authentication first
        this.currentUser = this.checkAuth();
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // Load user-specific tasks
        this.tasks = JSON.parse(localStorage.getItem(`tasks_${this.currentUser.id}`)) || [];
        this.currentDate = new Date();
        this.currentView = 'month';
        this.init();
    }

    checkAuth() {
        const userSession = localStorage.getItem('currentUser');
        if (!userSession) {
            return null;
        }
        return JSON.parse(userSession);
    }

    init() {
        this.displayUserInfo();
        this.bindEvents();
        this.renderCalendar();
        this.updateStats();
        this.renderUpcoming();
    }

    displayUserInfo() {
        const userInfo = document.getElementById('userInfo');
        userInfo.textContent = `Welcome, ${this.currentUser.name} (${this.currentUser.id})`;
    }

    bindEvents() {
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.saveTask(e));
        document.getElementById('deleteTask').addEventListener('click', () => this.deleteTask());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('searchInput').addEventListener('input', (e) => this.search(e.target.value));
        document.getElementById('statusFilter').addEventListener('change', (e) => this.filterByStatus(e.target.value));
        document.getElementById('generateSummary').addEventListener('click', () => this.generateDailySummary());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Set today's date as default for summary
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        document.getElementById('summaryDate').value = todayStr;
        
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('taskModal')) {
                this.closeModal();
            }
        });
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    openModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteTask');

        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('client').value = task.client;
            document.getElementById('taskDesc').value = task.description;
            document.getElementById('dueDate').value = task.dueDate;
            document.getElementById('priority').value = task.priority;
            document.getElementById('status').value = task.status;
            deleteBtn.style.display = 'inline-block';
        } else {
            title.textContent = 'Add Task';
            form.reset();
            document.getElementById('taskId').value = '';
            deleteBtn.style.display = 'none';
        }

        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('taskModal').style.display = 'none';
    }

    saveTask(e) {
        e.preventDefault();
        
        const taskData = {
            id: document.getElementById('taskId').value || Date.now().toString(),
            client: document.getElementById('client').value,
            description: document.getElementById('taskDesc').value,
            dueDate: document.getElementById('dueDate').value,
            priority: document.getElementById('priority').value,
            status: document.getElementById('status').value,
            createdAt: new Date().toISOString()
        };

        const existingIndex = this.tasks.findIndex(t => t.id === taskData.id);
        if (existingIndex >= 0) {
            this.tasks[existingIndex] = taskData;
        } else {
            this.tasks.push(taskData);
        }

        this.saveTasks();
        this.closeModal();
        this.renderCalendar();
        this.updateStats();
        this.renderUpcoming();
    }

    deleteTask() {
        const taskId = document.getElementById('taskId').value;
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.closeModal();
        this.renderCalendar();
        this.updateStats();
        this.renderUpcoming();
    }

    saveTasks() {
        localStorage.setItem(`tasks_${this.currentUser.id}`, JSON.stringify(this.tasks));
    }

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const monthYear = document.getElementById('currentMonth');
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        monthYear.textContent = new Date(year, month).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        calendar.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header-day';
            header.textContent = day;
            header.style.cssText = 'padding: 10px; font-weight: bold; text-align: center; background: #f8f9fa; border: 1px solid #eee;';
            calendar.appendChild(header);
        });

        // Add calendar days
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (date.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            if (this.isToday(date)) {
                dayElement.classList.add('today');
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = date.getDate();
            dayElement.appendChild(dayNumber);

            // Add tasks for this date
            const dayTasks = this.getTasksForDate(date);
            dayTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `task-item ${task.priority} ${task.status}`;
                taskElement.textContent = task.client;
                taskElement.title = task.description; // Show description on hover
                taskElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openModal(task);
                });
                dayElement.appendChild(taskElement);
            });

            dayElement.addEventListener('click', () => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                document.getElementById('dueDate').value = `${year}-${month}-${day}`;
                this.openModal();
            });

            calendar.appendChild(dayElement);
        }
    }

    getTasksForDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return this.tasks.filter(task => task.dueDate === dateStr);
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    updateStats() {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const weekStr = `${weekFromNow.getFullYear()}-${String(weekFromNow.getMonth() + 1).padStart(2, '0')}-${String(weekFromNow.getDate()).padStart(2, '0')}`;

        const todayTasks = this.tasks.filter(t => t.dueDate === todayStr).length;
        const weekTasks = this.tasks.filter(t => t.dueDate <= weekStr && t.dueDate >= todayStr).length;
        const pendingTasks = this.tasks.filter(t => t.status === 'pending').length;
        const overdueTasks = this.tasks.filter(t => t.dueDate < todayStr && t.status !== 'completed').length;

        document.getElementById('todayTasks').textContent = todayTasks;
        document.getElementById('weekTasks').textContent = weekTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('overdueTasks').textContent = overdueTasks;
    }

    renderUpcoming() {
        const upcomingList = document.getElementById('upcomingList');
        const upcoming = this.tasks
            .filter(t => t.status !== 'completed')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);

        upcomingList.innerHTML = '';
        
        upcoming.forEach(task => {
            const item = document.createElement('div');
            item.className = 'upcoming-item';
            item.innerHTML = `
                <div>
                    <strong>${task.client}</strong><br>
                    <small>${task.description}</small>
                </div>
                <div>
                    <span class="task-item ${task.priority}">${task.priority}</span>
                    <small>${new Date(task.dueDate).toLocaleDateString()}</small>
                </div>
            `;
            item.addEventListener('click', () => this.openModal(task));
            upcomingList.appendChild(item);
        });
    }

    search(query) {
        const filtered = this.tasks.filter(task => 
            task.client.toLowerCase().includes(query.toLowerCase()) ||
            task.description.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredTasks(filtered);
    }

    filterByStatus(status) {
        const filtered = status ? this.tasks.filter(task => task.status === status) : this.tasks;
        this.renderFilteredTasks(filtered);
    }

    renderFilteredTasks(filteredTasks) {
        // Store original tasks and replace with filtered for rendering
        const originalTasks = this.tasks;
        this.tasks = filteredTasks;
        this.renderCalendar();
        this.tasks = originalTasks;
    }

    generateDailySummary() {
        const selectedDate = document.getElementById('summaryDate').value;
        const summaryContent = document.getElementById('summaryContent');
        
        if (!selectedDate) {
            summaryContent.innerHTML = '<p style="color: #1976d2;">Please select a date for the summary.</p>';
            return;
        }

        const dayTasks = this.tasks.filter(task => task.dueDate === selectedDate);
        const completed = dayTasks.filter(task => task.status === 'completed');
        const pending = dayTasks.filter(task => task.status === 'pending');
        const inProgress = dayTasks.filter(task => task.status === 'in-progress');
        
        const selectedDateObj = new Date(selectedDate + 'T00:00:00');
        const formattedDate = selectedDateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        if (dayTasks.length === 0) {
            summaryContent.innerHTML = `
                <div style="background: #f8f9ff; padding: 20px; border-radius: 15px; border-left: 5px solid #1976d2;">
                    <h4 style="color: #1976d2; margin-bottom: 15px;">📅 ${formattedDate}</h4>
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        You have no tasks scheduled for this day. This presents a great opportunity to focus on personal projects, 
                        catch up on administrative work, or simply take a well-deserved break to recharge for upcoming commitments.
                    </p>
                </div>`;
            return;
        }

        const completionRate = Math.round((completed.length / dayTasks.length) * 100);
        const clients = [...new Set(dayTasks.map(task => task.client))];
        const highPriority = dayTasks.filter(task => task.priority === 'high').length;
        
        let summary = `
            <div style="background: #f8f9ff; padding: 25px; border-radius: 15px; border-left: 5px solid #1976d2;">
                <h4 style="color: #1976d2; margin-bottom: 20px;">📅 ${formattedDate}</h4>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                    <p style="line-height: 1.7; color: #333; font-size: 16px;">
                        Your schedule includes ${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''} distributed across ${clients.length} client${clients.length > 1 ? 's' : ''}. `;
        
        if (completed.length > 0) {
            summary += `You have successfully completed ${completed.length} task${completed.length > 1 ? 's' : ''}, achieving a ${completionRate}% completion rate. `;
        }
        
        if (inProgress.length > 0) {
            summary += `Currently, ${inProgress.length} task${inProgress.length > 1 ? 's are' : ' is'} in progress and require continued attention. `;
        }
        
        if (pending.length > 0) {
            summary += `There ${pending.length > 1 ? 'are' : 'is'} ${pending.length} pending task${pending.length > 1 ? 's' : ''} awaiting your action. `;
        }
        
        if (highPriority > 0) {
            summary += `Please note that ${highPriority} task${highPriority > 1 ? 's are' : ' is'} marked as high priority and should be addressed promptly. `;
        }
        
        if (completionRate === 100) {
            summary += `Congratulations on completing all scheduled tasks for the day!`;
        } else if (completionRate >= 75) {
            summary += `You're making excellent progress with most tasks completed.`;
        } else if (completionRate >= 50) {
            summary += `You're halfway through your scheduled work with steady progress.`;
        } else if (completionRate > 0) {
            summary += `You've made a good start on your daily tasks.`;
        } else {
            summary += `All tasks are ready for execution when you're prepared to begin.`;
        }
        
        summary += `</p></div>`;
        
        // Add bullet breakdown
        summary += this.generateTaskBreakdown(completed, inProgress, pending);
        summary += `</div>`;

        summaryContent.innerHTML = summary;
    }

    generateTaskBreakdown(completed, inProgress, pending) {
        if (completed.length === 0 && inProgress.length === 0 && pending.length === 0) {
            return '';
        }

        let breakdown = `
            <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                <h5 style="color: #1976d2; margin-bottom: 15px;">📋 Task Details</h5>
        `;

        if (completed.length > 0) {
            breakdown += `
                <div style="margin-bottom: 15px;">
                    <h6 style="color: #4caf50; margin-bottom: 8px;">✅ Completed (${completed.length})</h6>
                    <ul style="margin-left: 20px; color: #333;">`;
            completed.forEach(task => {
                breakdown += `<li style="margin-bottom: 5px;"><strong>${task.client}:</strong> ${task.description}</li>`;
            });
            breakdown += `</ul></div>`;
        }

        if (inProgress.length > 0) {
            breakdown += `
                <div style="margin-bottom: 15px;">
                    <h6 style="color: #ff9800; margin-bottom: 8px;">🔄 In Progress (${inProgress.length})</h6>
                    <ul style="margin-left: 20px; color: #333;">`;
            inProgress.forEach(task => {
                breakdown += `<li style="margin-bottom: 5px;"><strong>${task.client}:</strong> ${task.description}</li>`;
            });
            breakdown += `</ul></div>`;
        }

        if (pending.length > 0) {
            breakdown += `
                <div style="margin-bottom: 15px;">
                    <h6 style="color: #9c27b0; margin-bottom: 8px;">⏳ Pending (${pending.length})</h6>
                    <ul style="margin-left: 20px; color: #333;">`;
            pending.forEach(task => {
                breakdown += `<li style="margin-bottom: 5px;"><strong>${task.client}:</strong> ${task.description}</li>`;
            });
            breakdown += `</ul></div>`;
        }

        breakdown += `</div>`;
        return breakdown;
    }

    analyzeWorkload(dayTasks, clients, completionRate) {
        const totalTasks = dayTasks.length;
        const clientCount = clients.length;
        const avgTasksPerClient = Math.round(totalTasks / clientCount);
        
        let analysis = `Your schedule for today encompasses ${totalTasks} task${totalTasks > 1 ? 's' : ''} distributed across ${clientCount} client${clientCount > 1 ? 's' : ''}. `;
        
        if (clientCount === 1) {
            analysis += `This focused approach allows for deep concentration on ${clients[0]}'s requirements, potentially leading to higher quality deliverables and stronger client relationships. `;
        } else if (clientCount > 3) {
            analysis += `The diverse client portfolio of ${clientCount} accounts requires strategic time management and context switching. Consider batching similar tasks to maintain efficiency. `;
        } else {
            analysis += `With an average of ${avgTasksPerClient} task${avgTasksPerClient > 1 ? 's' : ''} per client, your workload appears well-balanced for optimal productivity. `;
        }
        
        if (completionRate === 100) {
            analysis += `Your exceptional 100% completion rate demonstrates outstanding time management and execution capabilities.`;
        } else if (completionRate >= 80) {
            analysis += `Your current ${completionRate}% completion rate indicates strong progress with minimal outstanding items.`;
        } else if (completionRate >= 50) {
            analysis += `At ${completionRate}% completion, you're maintaining steady progress through your scheduled commitments.`;
        } else if (completionRate > 0) {
            analysis += `With ${completionRate}% completion, there's significant opportunity to accelerate progress on remaining deliverables.`;
        } else {
            analysis += `Your tasks are ready for execution. This presents an opportunity to establish strong momentum early in the day.`;
        }
        
        return analysis;
    }

    generateRecommendations(pending, inProgress, highPriority) {
        if (pending.length === 0 && inProgress.length === 0) return null;
        
        let recommendations = '';
        
        if (highPriority.length > 0) {
            recommendations += `Immediate attention should be directed toward ${highPriority.length} high-priority item${highPriority.length > 1 ? 's' : ''}: ${highPriority.map(t => t.client).join(', ')}. `;
        }
        
        if (inProgress.length > 0) {
            recommendations += `Your ${inProgress.length} in-progress task${inProgress.length > 1 ? 's' : ''} should be prioritized for completion to maintain workflow momentum. `;
        }
        
        if (pending.length > 2) {
            recommendations += `Consider implementing time-blocking techniques for your ${pending.length} pending tasks to ensure systematic progress. `;
        } else if (pending.length > 0) {
            recommendations += `The ${pending.length} pending task${pending.length > 1 ? 's' : ''} can be strategically scheduled during your peak productivity hours. `;
        }
        
        recommendations += `Recommend reviewing task dependencies and client communication requirements to optimize delivery timelines.`;
        
        return recommendations;
    }

    generateInsights(dayTasks, clients, completionRate) {
        const priorityDistribution = {
            high: dayTasks.filter(t => t.priority === 'high').length,
            medium: dayTasks.filter(t => t.priority === 'medium').length,
            low: dayTasks.filter(t => t.priority === 'low').length
        };
        
        let insights = '';
        
        if (priorityDistribution.high > priorityDistribution.medium + priorityDistribution.low) {
            insights += `Your task portfolio shows a high-priority focus (${priorityDistribution.high} critical tasks), indicating significant business impact potential. `;
        } else if (priorityDistribution.low > priorityDistribution.high + priorityDistribution.medium) {
            insights += `The prevalence of low-priority tasks (${priorityDistribution.low}) suggests good pipeline management with room for strategic initiatives. `;
        } else {
            insights += `Your balanced priority distribution demonstrates effective workload curation and strategic planning. `;
        }
        
        if (clients.length === dayTasks.length) {
            insights += `Each client receives dedicated attention today, fostering strong individual relationships and personalized service delivery. `;
        } else {
            insights += `Multiple tasks per client indicate deepening engagement and potential for expanded project scope. `;
        }
        
        const today = new Date();
        const isWeekend = today.getDay() === 0 || today.getDay() === 6;
        
        if (isWeekend && dayTasks.length > 0) {
            insights += `Weekend scheduling demonstrates commitment to client success and may indicate project urgency or personal productivity preferences.`;
        } else {
            insights += `This workload aligns well with standard business operations and client expectations.`;
        }
        
        return insights;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});

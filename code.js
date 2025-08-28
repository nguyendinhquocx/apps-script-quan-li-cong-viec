// code.gs
// === CẤU HÌNH CHUNG ===
// Tên các sheet trong Google Spreadsheet
const TASK_SHEET_NAME = "Nhiệm vụ";
const PROJECT_SHEET_NAME = "Dự án";
const STAFF_SHEET_NAME = "Nhân sự";
const ACTIVITY_LOG_SHEET_NAME = "Nhật ký hoạt động";
const NOTIFICATION_SHEET_NAME = "Thông báo";

// === Cột sheet "Nhiệm vụ" ===
const TASK_ID_COLUMN_NAME = "Mã nhiệm vụ";
const TASK_PROJECT_ID_COLUMN_NAME = "Mã dự án";
const TASK_NAME_COLUMN_NAME = "Tên nhiệm vụ";
const TASK_DESC_COLUMN_NAME = "Mô tả nhiệm vụ";
const TASK_ASSIGNEE_COLUMN_NAME = "Người thực hiện";
const TASK_STATUS_COLUMN_NAME = "Trạng thái";
const TASK_PRIORITY_COLUMN_NAME = "Ưu tiên";
const TASK_START_DATE_COLUMN_NAME = "Ngày bắt đầu";
const TASK_DUE_DATE_COLUMN_NAME = "Hạn chót";
const TASK_COMPLETION_COLUMN_NAME = "Tiến độ (%)";
const TASK_REPORT_DATE_COLUMN_NAME = "Ngày báo cáo";
const TASK_TARGET_COLUMN_NAME = "Mục tiêu";
const TASK_RESULT_LINKS_COLUMN_NAME = "Link kết quả";
const TASK_OUTPUT_COLUMN_NAME = "Kết quả đầu ra";
const TASK_NOTES_COLUMN_NAME = "Ghi chú";

// === Cột sheet "Dự án" ===
const PROJECT_ID_COLUMN_NAME = "Mã dự án";
const PROJECT_NAME_COLUMN_NAME = "Tên dự án";
const PROJECT_DESC_COLUMN_NAME = "Mô tả dự án";
const PROJECT_MANAGER_COLUMN_NAME = "Quản lý dự án";
const PROJECT_START_DATE_COLUMN_NAME = "Ngày bắt đầu";
const PROJECT_END_DATE_COLUMN_NAME = "Ngày kết thúc";
const PROJECT_STATUS_COLUMN_NAME = "Trạng thái dự án";

// === Cột sheet "Nhân sự" ===
const STAFF_ID_COLUMN_NAME = "Mã NV";
const STAFF_NAME_COLUMN_NAME = "Họ tên";
const STAFF_EMAIL_COLUMN_NAME = "Email";
const STAFF_POSITION_COLUMN_NAME = "Chức vụ";
const STAFF_ROLE_COLUMN_NAME = "Phân quyền";
const STAFF_PASSWORD_COLUMN_NAME = "Mật khẩu";

// === Cột sheet "Nhật ký hoạt động" ===
const LOG_TIMESTAMP_COLUMN_NAME = "Thời gian";
const LOG_ACTION_COLUMN_NAME = "Hành động";
const LOG_USER_COLUMN_NAME = "Người thực hiện";
const LOG_DETAILS_COLUMN_NAME = "Chi tiết";

// === Cột sheet "Thông báo" ===
const NOTIFICATION_ID_COLUMN_NAME = "Mã thông báo";
const NOTIFICATION_TIMESTAMP_COLUMN_NAME = "Thời gian";
const NOTIFICATION_USER_COLUMN_NAME = "Người nhận";
const NOTIFICATION_CONTENT_COLUMN_NAME = "Nội dung";
const NOTIFICATION_STATUS_COLUMN_NAME = "Trạng thái";
const NOTIFICATION_TYPE_COLUMN_NAME = "Loại";

// Giới hạn dữ liệu
const MAX_ACTIVITIES = 50;
const MAX_NOTIFICATIONS = 50;

// ==================================
// == HÀM CHÍNH (GIAO TIẾP VỚI FRONTEND) ==
// ==================================

/**
 * Phục vụ giao diện HTML khi truy cập URL ứng dụng web.
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Quản Lý Dự Án')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setFaviconUrl("https://static.vecteezy.com/system/resources/thumbnails/016/712/564/small_2x/3d-render-illustration-of-project-management-analysis-result-icon-png.png");
}

/**
 * Include files for HTML template
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Authenticate user with email and password
 */
function authenticateUser(email, password) {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email và mật khẩu là bắt buộc' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const staffSheet = ss.getSheetByName(STAFF_SHEET_NAME);
    
    if (!staffSheet) {
      return { success: false, error: 'Không tìm thấy dữ liệu nhân viên' };
    }

    const headers = getHeaders(staffSheet);
    const emailColIndex = headers.indexOf(STAFF_EMAIL_COLUMN_NAME);
    const passwordColIndex = headers.indexOf(STAFF_PASSWORD_COLUMN_NAME);
    const roleColIndex = headers.indexOf(STAFF_ROLE_COLUMN_NAME);
    const nameColIndex = headers.indexOf(STAFF_NAME_COLUMN_NAME);
    const idColIndex = headers.indexOf(STAFF_ID_COLUMN_NAME);

    if (emailColIndex === -1 || passwordColIndex === -1 || roleColIndex === -1) {
      return { success: false, error: 'Cấu trúc dữ liệu nhân viên không đúng' };
    }

    const lastRow = staffSheet.getLastRow();
    if (lastRow < 2) {
      return { success: false, error: 'Không có dữ liệu nhân viên' };
    }

    // Get all staff data
    const range = staffSheet.getRange(2, 1, lastRow - 1, headers.length);
    const values = range.getValues();

    // Find user by email
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const userEmail = String(row[emailColIndex] || '').trim().toLowerCase();
      const userPassword = String(row[passwordColIndex] || '').trim();
      
      if (userEmail === email.toLowerCase() && userPassword === password) {
        const userData = {
          id: row[idColIndex] || '',
          name: row[nameColIndex] || '',
          email: row[emailColIndex] || '',
          role: row[roleColIndex] || 'Nhân viên',
          position: row[headers.indexOf(STAFF_POSITION_COLUMN_NAME)] || ''
        };

        // Store session
        storeUserSession(userData);
        
        return { 
          success: true, 
          user: userData,
          message: 'Đăng nhập thành công'
        };
      }
    }

    return { success: false, error: 'Email hoặc mật khẩu không đúng' };

  } catch (e) {
    console.error('Authentication error:', e);
    return { success: false, error: 'Lỗi hệ thống khi đăng nhập: ' + e.message };
  }
}

/**
 * Store user session in PropertiesService
 */

function storeUserSession(userData) {
  try {
    const sessionData = {
      ...userData,
      loginTime: new Date().toISOString(),
      sessionId: Utilities.getUuid()
    };
    
    // THAY ĐỔI: Sử dụng email làm key để phân biệt session từng user
    const sessionKey = `user_session_${userData.email}`;
    PropertiesService.getScriptProperties().setProperty(sessionKey, JSON.stringify(sessionData));
    
    // Lưu thêm current session key để logout
    const currentUserKey = `current_user_${Session.getTemporaryActiveUserKey()}`;
    PropertiesService.getScriptProperties().setProperty(currentUserKey, userData.email);
    
    console.log('Session stored for user:', userData.email);
  } catch (e) {
    console.error('Error storing session:', e);
  }
}

/**
 * Get current user session
 */
function getCurrentUser() {
  try {
    // Lấy email của user hiện tại từ session key
    const currentUserKey = `current_user_${Session.getTemporaryActiveUserKey()}`;
    const userEmail = PropertiesService.getScriptProperties().getProperty(currentUserKey);
    
    if (!userEmail) {
      return null;
    }
    
    const sessionKey = `user_session_${userEmail}`;
    const sessionString = PropertiesService.getScriptProperties().getProperty(sessionKey);
    
    if (!sessionString) {
      return null;
    }
    
    const sessionData = JSON.parse(sessionString);
    
    // Check if session is still valid (24 hours)
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (now - loginTime > sessionDuration) {
      // Session expired
      logout();
      return null;
    }
    
    return sessionData;
  } catch (e) {
    console.error('Error getting current user:', e);
    return null;
  }
}

/**
 * Logout user
 */
function logout() {
  try {
    // Lấy email của user hiện tại
    const currentUserKey = `current_user_${Session.getTemporaryActiveUserKey()}`;
    const userEmail = PropertiesService.getScriptProperties().getProperty(currentUserKey);
    
    if (userEmail) {
      // Xóa session của user này
      const sessionKey = `user_session_${userEmail}`;
      PropertiesService.getScriptProperties().deleteProperty(sessionKey);
    }
    
    // Xóa current user key
    PropertiesService.getScriptProperties().deleteProperty(currentUserKey);
    
    return { success: true, message: 'Đăng xuất thành công' };
  } catch (e) {
    console.error('Error during logout:', e);
    return { success: false, error: 'Lỗi khi đăng xuất' };
  }
}

/**
 * Check if user is admin
 */
function isAdmin(user) {
  if (!user) return false;
  return String(user.role || '').toLowerCase().includes('admin');
}

/**
 * Check if user is manager
 */
function isManager(user) {
  if (!user) return false;
  return String(user.role || '').toLowerCase().includes('quản lý');
}

/**
 * Get filtered data based on user role
 */
function getDataForUser() {
  try {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return { 
        success: false, 
        error: 'Chưa đăng nhập',
        requireLogin: true 
      };
    }

    // Get all data
    let projects = getProjects();
    let tasks = getTasks();
    const staff = getStaffList();
    let recentActivities = getRecentActivities();

    // Filter data based on role
    if (!isAdmin(currentUser)) {
      if (isManager(currentUser)) {
        // === FILTER TASKS: Managers see tasks assigned to them and tasks in projects they manage ===
        const managerProjectIds = projects
          .filter(project => project[PROJECT_MANAGER_COLUMN_NAME] === currentUser.name)
          .map(project => project[PROJECT_ID_COLUMN_NAME]);
        
        tasks = tasks.filter(task => {
          // Tasks assigned to this manager
          if (task[TASK_ASSIGNEE_COLUMN_NAME] === currentUser.name) {
            return true;
          }
          
          // Tasks in projects managed by this manager
          if (managerProjectIds.includes(task[TASK_PROJECT_ID_COLUMN_NAME])) {
            return true;
          }
          
          return false;
        });
        
        // === FILTER PROJECTS: Managers see projects they manage or have tasks in ===
        const managerTaskProjectIds = tasks
          .map(task => task[TASK_PROJECT_ID_COLUMN_NAME])
          .filter(id => id);
        
        projects = projects.filter(project => {
          // Projects managed by this manager
          if (project[PROJECT_MANAGER_COLUMN_NAME] === currentUser.name) {
            return true;
          }
          
          // Projects where this manager has tasks
          if (managerTaskProjectIds.includes(project[PROJECT_ID_COLUMN_NAME])) {
            return true;
          }
          
          return false;
        });
      } else {
        // === FILTER TASKS: Regular users see tasks assigned to them OR in projects they manage ===
        tasks = tasks.filter(task => {
          const assignee = String(task[TASK_ASSIGNEE_COLUMN_NAME] || '').trim();
          if (assignee === currentUser.name) {
            return true;
          }
          
          // Check if user is project manager for this task
          const projectId = task[TASK_PROJECT_ID_COLUMN_NAME];
          const project = projects.find(p => p[PROJECT_ID_COLUMN_NAME] === projectId);
          return project && project[PROJECT_MANAGER_COLUMN_NAME] === currentUser.name;
        });
        
        // === FILTER PROJECTS: Show projects that have tasks assigned to this user OR user is manager ===
        const userTaskProjectIds = new Set(
          tasks.map(task => task[TASK_PROJECT_ID_COLUMN_NAME]).filter(id => id)
        );
        
        // Include projects where user is manager
        const userManagedProjects = projects.filter(project => 
          project[PROJECT_MANAGER_COLUMN_NAME] === currentUser.name
        );
        
        userManagedProjects.forEach(project => {
          userTaskProjectIds.add(project[PROJECT_ID_COLUMN_NAME]);
        });
        
        projects = projects.filter(project => {
          const projectId = project[PROJECT_ID_COLUMN_NAME];
          return userTaskProjectIds.has(projectId);
        });
      }

      // === FILTER RECENT ACTIVITIES: Only show activities related to this user or their projects/tasks ===
      const userProjectIds = projects.map(project => project[PROJECT_ID_COLUMN_NAME]);
      
      recentActivities = recentActivities.filter(activity => {
        const activityUser = String(activity[LOG_USER_COLUMN_NAME] || '').trim();
        const activityDetails = String(activity[LOG_DETAILS_COLUMN_NAME] || '').toLowerCase();
        
        // Show activities where:
        // 1. User is the one who performed the action, OR
        // 2. Activity details mention this user's name/email, OR  
        // 3. Activity is about projects/tasks that belong to this user
        if (activityUser === currentUser.email || 
            activityUser === currentUser.name ||
            activityDetails.includes(currentUser.name.toLowerCase()) ||
            activityDetails.includes(currentUser.email.toLowerCase())) {
          return true;
        }
        
        // Check if activity is related to user's projects
        for (const projectId of userProjectIds) {
          if (activityDetails.includes(projectId.toLowerCase())) {
            return true;
          }
        }
        
        return false;
      });
    }

    // Get other data
    const chartData = getTaskStatusChartData(tasks);
    const notifications = getNotifications();
    const summaryStats = getSummaryStats(projects, tasks);

    console.log(`Data filtered for user ${currentUser.name}:`);
    console.log(`- Projects: ${projects.length}`);
    console.log(`- Tasks: ${tasks.length}`); 
    console.log(`- Activities: ${recentActivities.length}`);

    let filteredStaff = staff;
    if (!isAdmin(currentUser)) {
      if (isManager(currentUser)) {
        // Quản lý có thể thấy tất cả nhân viên trừ admin
        filteredStaff = staff.filter(s => {
          const role = String(s[STAFF_ROLE_COLUMN_NAME] || '').toLowerCase();
          return !role.includes('admin');
        });
      } else {
        // Người dùng thường chỉ thấy mình
        const currentUserStaff = staff.find(s => s[STAFF_NAME_COLUMN_NAME] === currentUser.name);
        filteredStaff = currentUserStaff ? [currentUserStaff] : [];
      }
    }

    return {
      success: true,
      user: currentUser,
      projects: projects,
      tasks: tasks,
      staff: isAdmin(currentUser) ? staff : filteredStaff,
      chartData: chartData,
      recentActivities: recentActivities,
      notifications: notifications,
      summaryStats: summaryStats
    };

  } catch (e) {
    console.error('Error getting data for user:', e);
    return { 
      success: false, 
      error: 'Lỗi khi tải dữ liệu: ' + e.message 
    };
  }
}

// === UPDATED CRUD FUNCTIONS WITH PERMISSION CHECKS ===

/**
 * Updated addProject with permission check
 */
function addProjectWithAuth(projectData) {
  const permissionCheck = checkUserPermission('create', 'project');
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return addProject(projectData);
}

/**
 * Updated updateProject with permission check
 */
function updateProjectWithAuth(projectId, projectData) {
  // LẤY DỮ LIỆU DỰ ÁN GỐC TRƯỚC KHI KIỂM TRA QUYỀN
  const projects = getProjects();
  const originalProject = projects.find(p => p[PROJECT_ID_COLUMN_NAME] === projectId);
  
  if (!originalProject) {
    return { success: false, error: `Không tìm thấy dự án ID: ${projectId}` };
  }
  
  // Kiểm tra quyền dựa trên dự án gốc
  const permissionCheck = checkUserPermission('update', 'project', originalProject);
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return updateProject(projectId, projectData);
}

/**
 * Updated deleteProject with permission check
 */
function deleteProjectWithAuth(projectId) {
  // LẤY DỮ LIỆU DỰ ÁN GỐC TRƯỚC KHI KIỂM TRA QUYỀN
  const projects = getProjects();
  const originalProject = projects.find(p => p[PROJECT_ID_COLUMN_NAME] === projectId);
  
  if (!originalProject) {
    return { success: false, error: `Không tìm thấy dự án ID: ${projectId}` };
  }
  
  const permissionCheck = checkUserPermission('delete', 'project', originalProject);
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return deleteProject(projectId);
}

/**
 * Updated addTask with permission check
 */
function addTaskWithAuth(taskData) {
  const permissionCheck = checkUserPermission('create', 'task');
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return addTask(taskData);
}

/**
 * Updated updateTask with permission check
 */
function updateTaskWithAuth(taskId, taskData) {
  // Get original task data for permission check
  const tasks = getTasks();
  const originalTask = tasks.find(task => task[TASK_ID_COLUMN_NAME] === taskId);
  
  const permissionCheck = checkUserPermission('update', 'task', originalTask);
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return updateTask(taskId, taskData);
}

/**
 * Updated deleteTask with permission check
 */
function deleteTaskWithAuth(taskId) {
  // Get original task data for permission check
  const tasks = getTasks();
  const originalTask = tasks.find(task => task[TASK_ID_COLUMN_NAME] === taskId);
  
  const permissionCheck = checkUserPermission('delete', 'task', originalTask);
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return deleteTask(taskId);
}

/**
 * Updated staff functions with permission checks
 */
function addStaffWithAuth(staffData) {
  const permissionCheck = checkUserPermission('create', 'staff');
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return addStaff(staffData);
}

function updateStaffWithAuth(staffId, staffData) {
  const permissionCheck = checkUserPermission('update', 'staff');
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return updateStaff(staffId, staffData);
}

function deleteStaffWithAuth(staffId) {
  const permissionCheck = checkUserPermission('delete', 'staff');
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return deleteStaff(staffId);
}

/**
 * Updated getInitialData to check authentication
 */
function getInitialDataWithAuth() {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return { 
      success: false, 
      requireLogin: true,
      message: 'Vui lòng đăng nhập để tiếp tục'
    };
  }
  
  return getDataForUser();
}

/**
 * Check user permissions for operations
 */
function checkUserPermission(action, resourceType, resourceData = null) {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return { success: false, error: 'Chưa đăng nhập' };
  }

  // Admin can do everything
  if (isAdmin(currentUser)) {
    return { success: true };
  }
  
  // Manager permissions
  if (isManager(currentUser)) {
    switch (resourceType) {
      case 'project':
        // Managers can manage projects
        return { success: true };
        
      case 'task':
        // Managers can manage tasks
        return { success: true };
        
      case 'staff':
        // Only admin can manage staff
        return { success: false, error: 'Chỉ admin mới có thể quản lý nhân viên' };

      case 'notification':
        return { success: false, error: 'Chỉ admin mới có thể quản lý thông báo' };
    }
  }

  // Regular user permissions
  switch (resourceType) {
    case 'project':
      // THAY ĐỔI: Kiểm tra xem người dùng có phải là người phụ trách dự án không
      if (resourceData) {
        // Đối với update/delete, kiểm tra nếu người dùng là người phụ trách
        if (resourceData[PROJECT_MANAGER_COLUMN_NAME] === currentUser.name) {
          return { success: true };
        }
      } else if (action === 'create') {
        // Nhân viên không thể tạo dự án mới
        return { success: false, error: 'Chỉ admin và quản lý mới có thể tạo dự án mới' };
      } else {
        // Để lấy thông tin dự án khi update/delete
        const projects = getProjects();
        const project = projects.find(p => p[PROJECT_ID_COLUMN_NAME] === resourceData);
        if (project && project[PROJECT_MANAGER_COLUMN_NAME] === currentUser.name) {
          return { success: true };
        }
      }
      return { success: false, error: 'Bạn chỉ có thể quản lý dự án do bạn phụ trách' };
      
    case 'task':
      if (action === 'create') {
        // Kiểm tra nếu người dùng là người phụ trách của bất kỳ dự án nào
        const projects = getProjects();
        const userManagedProjects = projects.filter(project => 
          project[PROJECT_MANAGER_COLUMN_NAME] === currentUser.name
        );
        if (userManagedProjects.length > 0) {
          return { success: true }; // Người phụ trách dự án có thể tạo nhiệm vụ
        }
        
        // User can create tasks if they have at least one task in a project
        const userTasks = getTasks().filter(task => task[TASK_ASSIGNEE_COLUMN_NAME] === currentUser.name);
        if (userTasks.length > 0) {
          return { success: true };
        }
        return { success: false, error: 'Bạn chỉ có thể tạo nhiệm vụ trong các dự án mà bạn đã được giao việc' };
      }
      if (action === 'update' || action === 'delete') {
        // Check if user is project manager for this task
        if (resourceData) {
          const projectId = resourceData[TASK_PROJECT_ID_COLUMN_NAME];
          const projects = getProjects();
          const project = projects.find(p => p[PROJECT_ID_COLUMN_NAME] === projectId);
          
          if (project && project[PROJECT_MANAGER_COLUMN_NAME] === currentUser.name) {
            return { success: true }; // Project manager can edit/delete all tasks
          }
        }
        
        // Users can only update their own tasks
        if (resourceData && resourceData[TASK_ASSIGNEE_COLUMN_NAME] === currentUser.name) {
          return { success: true };
        }
        return { success: false, error: 'Bạn chỉ có thể chỉnh sửa nhiệm vụ của mình hoặc nhiệm vụ trong dự án bạn quản lý' };
      }
      break;
      
    case 'staff':
      // Only admin can manage staff
      return { success: false, error: 'Chỉ admin mới có thể quản lý nhân viên' };

    case 'notification':
      return { success: false, error: 'Chỉ admin mới có thể quản lý thông báo' };
  }

  return { success: false, error: 'Không có quyền thực hiện hành động này' };
}

/**
 * Lấy tất cả dữ liệu cần thiết cho lần tải trang đầu tiên.
 */
function getInitialData() {
  try {
    console.log("Starting getInitialData...");
    
    // Lấy dữ liệu song song
    const projects = getProjects();
    const tasks = getTasks();
    const staff = getStaffList();

    // Xử lý dữ liệu phụ thuộc
    const chartData = getTaskStatusChartData(tasks);
    const recentActivities = getRecentActivities();
    const notifications = getNotifications();
    const summaryStats = getSummaryStats(projects, tasks);

    console.log("getInitialData completed successfully");
    
    return {
      projects: projects,
      tasks: tasks,
      staff: staff,
      chartData: chartData,
      recentActivities: recentActivities,
      notifications: notifications,
      summaryStats: summaryStats
    };
  } catch (e) {
    console.error("Error in getInitialData:", e);
    return { error: "Không thể tải dữ liệu ban đầu. Chi tiết: " + e.message };
  }
}

// ==================================
// == QUẢN LÝ DỰ ÁN (PROJECTS) ==
// ==================================

function addProject(projectData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

        // Kiểm tra quyền hạn của người dùng về quản lý dự án
    const currentUser = getCurrentUser();
    if (!isAdmin(currentUser) && isManager(currentUser)) {
      // Nếu người dùng là Quản lý, bắt buộc phải chọn chính họ làm quản lý dự án
      projectData.manager = currentUser.name;
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const projectSheet = getOrCreateSheet(ss, PROJECT_SHEET_NAME, [
      PROJECT_ID_COLUMN_NAME, PROJECT_NAME_COLUMN_NAME, PROJECT_DESC_COLUMN_NAME,
      PROJECT_MANAGER_COLUMN_NAME, PROJECT_START_DATE_COLUMN_NAME, 
      PROJECT_END_DATE_COLUMN_NAME, PROJECT_STATUS_COLUMN_NAME
    ]);
    
    const headers = getHeaders(projectSheet);

    // Validate dữ liệu đầu vào
    if (!projectData || !projectData.name || String(projectData.name).trim() === '') {
        return { success: false, error: 'Tên dự án là bắt buộc.' };
    }

    const idColIndex = headers.indexOf(PROJECT_ID_COLUMN_NAME);
    const lastId = getLastId(projectSheet, idColIndex, "DA");
    const newProjectId = generateNextId(lastId, "DA");

    const newRow = Array(headers.length).fill('');

    // Điền dữ liệu
    newRow[idColIndex] = newProjectId;
    newRow[headers.indexOf(PROJECT_NAME_COLUMN_NAME)] = String(projectData.name).trim();
    newRow[headers.indexOf(PROJECT_DESC_COLUMN_NAME)] = projectData.description ? String(projectData.description).trim() : '';
    newRow[headers.indexOf(PROJECT_MANAGER_COLUMN_NAME)] = projectData.manager ? String(projectData.manager).trim() : '';
    newRow[headers.indexOf(PROJECT_START_DATE_COLUMN_NAME)] = parseDate(projectData.startDate);
    newRow[headers.indexOf(PROJECT_END_DATE_COLUMN_NAME)] = parseDate(projectData.endDate);
    newRow[headers.indexOf(PROJECT_STATUS_COLUMN_NAME)] = projectData.status || 'Chưa bắt đầu';

    console.log("Adding project row:", newRow);
    projectSheet.appendRow(newRow);
    SpreadsheetApp.flush();

    logActivity("Thêm dự án", `Tên: ${projectData.name}, Quản lý: ${projectData.manager || 'N/A'}, ID: ${newProjectId}`);

    return { success: true, projectId: newProjectId };

  } catch (e) {
    console.error(`Error adding project:`, e);
    return { success: false, error: `Lỗi khi thêm dự án: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function updateProject(projectId, projectData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const projectSheet = ss.getSheetByName(PROJECT_SHEET_NAME);
    if (!projectSheet) throw new Error(`Không tìm thấy sheet "${PROJECT_SHEET_NAME}".`);
    
    const headers = getHeaders(projectSheet);
    const idColIndex = headers.indexOf(PROJECT_ID_COLUMN_NAME);
    if (idColIndex === -1) throw new Error(`Không tìm thấy cột "${PROJECT_ID_COLUMN_NAME}".`);

    // Validate đầu vào
    if (!projectId) return { success: false, error: 'ID dự án không được cung cấp.' };
    if (!projectData || !projectData.name || String(projectData.name).trim() === '') {
        return { success: false, error: 'Tên dự án là bắt buộc.' };
    }

    const rowInfo = findRowById(projectSheet, idColIndex + 1, projectId);
    if (!rowInfo) return { success: false, error: `Không tìm thấy dự án ID: ${projectId}` };
    
    const rowNumber = rowInfo.rowNumber;
    const range = projectSheet.getRange(rowNumber, 1, 1, headers.length);
    const values = range.getValues()[0];

    let changesDetected = false;

    // Cập nhật các trường
    const updates = [
      [headers.indexOf(PROJECT_NAME_COLUMN_NAME), projectData.name],
      [headers.indexOf(PROJECT_DESC_COLUMN_NAME), projectData.description],
      [headers.indexOf(PROJECT_MANAGER_COLUMN_NAME), projectData.manager],
      [headers.indexOf(PROJECT_START_DATE_COLUMN_NAME), parseDate(projectData.startDate)],
      [headers.indexOf(PROJECT_END_DATE_COLUMN_NAME), parseDate(projectData.endDate)],
      [headers.indexOf(PROJECT_STATUS_COLUMN_NAME), projectData.status]
    ];

    updates.forEach(([index, newValue]) => {
      if (index !== -1 && newValue !== undefined) {
        const formattedValue = (newValue instanceof Date || newValue === null) ? newValue : String(newValue).trim();
        if (values[index] !== formattedValue) {
          values[index] = formattedValue;
          changesDetected = true;
        }
      }
    });

    if (changesDetected) {
      console.log("Updating project row:", rowNumber, values);
      range.setValues([values]);
      SpreadsheetApp.flush();
      logActivity("Cập nhật dự án", `ID: ${projectId}, Tên: ${projectData.name}`);
    }

    return { success: true, updated: changesDetected };

  } catch (e) {
    console.error(`Error updating project ${projectId}:`, e);
    return { success: false, error: `Lỗi khi cập nhật dự án: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function deleteProject(projectId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const projectSheet = ss.getSheetByName(PROJECT_SHEET_NAME);
    if (!projectSheet) throw new Error(`Không tìm thấy sheet "${PROJECT_SHEET_NAME}".`);
    
    const headers = getHeaders(projectSheet);
    const idColIndex = headers.indexOf(PROJECT_ID_COLUMN_NAME);
    if (idColIndex === -1) throw new Error(`Không tìm thấy cột "${PROJECT_ID_COLUMN_NAME}".`);

    if (!projectId) return { success: false, error: 'ID dự án không được cung cấp.' };

    const rowInfo = findRowById(projectSheet, idColIndex + 1, projectId);
    if (!rowInfo) return { success: false, error: `Không tìm thấy dự án ID: ${projectId}` };
    
    const rowNumber = rowInfo.rowNumber;
    const nameColIndex = headers.indexOf(PROJECT_NAME_COLUMN_NAME);
    const projectName = nameColIndex !== -1 ? projectSheet.getRange(rowNumber, nameColIndex + 1).getValue() : projectId;

    // XÓA CÁC NHIỆM VỤ THUỘC DỰ ÁN TRƯỚC KHI XÓA DỰ ÁN
    const taskSheet = ss.getSheetByName(TASK_SHEET_NAME);
    if (taskSheet) {
      const taskHeaders = getHeaders(taskSheet);
      const taskProjIdColIndex = taskHeaders.indexOf(TASK_PROJECT_ID_COLUMN_NAME);
      const taskIdColIndex = taskHeaders.indexOf(TASK_ID_COLUMN_NAME);
      
      if (taskProjIdColIndex !== -1 && taskIdColIndex !== -1) {
        const lastRow = taskSheet.getLastRow();
        if (lastRow > 1) {
          // Lấy tất cả ID nhiệm vụ và ID dự án tương ứng
          const taskRange = taskSheet.getRange(2, taskProjIdColIndex + 1, lastRow - 1, 1);
          const taskProjIds = taskRange.getValues();
          const taskIdRange = taskSheet.getRange(2, taskIdColIndex + 1, lastRow - 1, 1);
          const taskIds = taskIdRange.getValues();
          
          // Tạo danh sách các nhiệm vụ cần xóa (thuộc dự án bị xóa)
          const tasksToDelete = [];
          for (let i = 0; i < taskProjIds.length; i++) {
            if (String(taskProjIds[i][0]).trim() === String(projectId).trim()) {
              tasksToDelete.push({
                row: i + 2, // +2 vì hàng 1 là header và chúng ta bắt đầu từ hàng 2
                id: taskIds[i][0]
              });
            }
          }
          
          // Xóa các nhiệm vụ từ dưới lên trên (để tránh lỗi khi xóa)
          tasksToDelete.sort((a, b) => b.row - a.row);
          
          for (const task of tasksToDelete) {
            taskSheet.deleteRow(task.row);
            logActivity("Xóa nhiệm vụ", `ID: ${task.id}, Thuộc dự án: ${projectId}`);
          }
          
          console.log(`Đã xóa ${tasksToDelete.length} nhiệm vụ thuộc dự án ${projectId}`);
        }
      }
    }

    projectSheet.deleteRow(rowNumber);
    logActivity("Xóa dự án", `ID: ${projectId}, Tên: ${projectName}`);
    
    return { success: true };

  } catch (e) {
    console.error(`Error deleting project ${projectId}:`, e);
    return { success: false, error: `Lỗi khi xóa dự án: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function getProjects() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(PROJECT_SHEET_NAME);
    if (!sheet) {
        console.log(`Sheet "${PROJECT_SHEET_NAME}" not found.`);
        return [];
    }
    return sheetDataToObjectArray(sheet);
  } catch (e) {
    console.error("Error getting projects:", e);
    return [];
  }
}

// ==================================
// == QUẢN LÝ NHIỆM VỤ (TASKS) ==
// ==================================

function addTask(taskData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const taskSheet = getOrCreateSheet(ss, TASK_SHEET_NAME, [
      TASK_ID_COLUMN_NAME, TASK_PROJECT_ID_COLUMN_NAME, TASK_NAME_COLUMN_NAME,
      TASK_DESC_COLUMN_NAME, TASK_ASSIGNEE_COLUMN_NAME, TASK_STATUS_COLUMN_NAME,
      TASK_PRIORITY_COLUMN_NAME, TASK_START_DATE_COLUMN_NAME, TASK_DUE_DATE_COLUMN_NAME,
      TASK_COMPLETION_COLUMN_NAME, TASK_REPORT_DATE_COLUMN_NAME, TASK_TARGET_COLUMN_NAME, 
      TASK_RESULT_LINKS_COLUMN_NAME, TASK_OUTPUT_COLUMN_NAME, TASK_NOTES_COLUMN_NAME
    ]);
    
    const headers = getHeaders(taskSheet);

    // Validate dữ liệu đầu vào
    if (!taskData || !taskData.name || String(taskData.name).trim() === '') {
        return { success: false, error: 'Tên nhiệm vụ là bắt buộc.' };
    }
    if (!taskData.projectId || String(taskData.projectId).trim() === '') {
        return { success: false, error: 'Nhiệm vụ phải thuộc về một dự án.' };
    }
    if (!checkProjectExists(taskData.projectId)) {
         return { success: false, error: `Mã dự án "${taskData.projectId}" không tồn tại.` };
    }

    const idColIndex = headers.indexOf(TASK_ID_COLUMN_NAME);
    const lastId = getLastId(taskSheet, idColIndex, "NVT");
    const newTaskId = generateNextId(lastId, "NVT", 4);

    const newRow = Array(headers.length).fill('');

    // Điền dữ liệu
    newRow[idColIndex] = newTaskId;
    newRow[headers.indexOf(TASK_PROJECT_ID_COLUMN_NAME)] = String(taskData.projectId).trim();
    newRow[headers.indexOf(TASK_NAME_COLUMN_NAME)] = String(taskData.name).trim();
    newRow[headers.indexOf(TASK_DESC_COLUMN_NAME)] = taskData.description ? String(taskData.description).trim() : '';
    newRow[headers.indexOf(TASK_ASSIGNEE_COLUMN_NAME)] = taskData.assignee ? String(taskData.assignee).trim() : '';
    newRow[headers.indexOf(TASK_STATUS_COLUMN_NAME)] = taskData.status || 'Chưa bắt đầu';
    newRow[headers.indexOf(TASK_PRIORITY_COLUMN_NAME)] = taskData.priority || 'Trung bình';
    newRow[headers.indexOf(TASK_START_DATE_COLUMN_NAME)] = parseDate(taskData.startDate);
    newRow[headers.indexOf(TASK_DUE_DATE_COLUMN_NAME)] = parseDate(taskData.dueDate);

    // Xử lý Tiến độ (%)
    let completion = 0;
    if (taskData.completion !== undefined && taskData.completion !== null && taskData.completion !== '') {
        const parsedCompletion = parseInt(taskData.completion, 10);
        if (!isNaN(parsedCompletion)) {
            completion = Math.max(0, Math.min(100, parsedCompletion));
        }
    }
    newRow[headers.indexOf(TASK_COMPLETION_COLUMN_NAME)] = completion;
    newRow[headers.indexOf(TASK_REPORT_DATE_COLUMN_NAME)] = parseDate(taskData.reportDate);
    newRow[headers.indexOf(TASK_TARGET_COLUMN_NAME)] = taskData.target ? String(taskData.target).trim() : '';
    newRow[headers.indexOf(TASK_RESULT_LINKS_COLUMN_NAME)] = taskData.resultLinks ? String(taskData.resultLinks).trim() : '';
    newRow[headers.indexOf(TASK_OUTPUT_COLUMN_NAME)] = taskData.output ? String(taskData.output).trim() : '';
    newRow[headers.indexOf(TASK_NOTES_COLUMN_NAME)] = taskData.notes ? String(taskData.notes).trim() : '';

    console.log("Adding task row:", newRow);
    taskSheet.appendRow(newRow);
    SpreadsheetApp.flush();

    logActivity("Thêm nhiệm vụ", `Tên: ${taskData.name}, Giao cho: ${taskData.assignee || 'N/A'}, Dự án: ${taskData.projectId}, ID: ${newTaskId}`);

    return { success: true, taskId: newTaskId };

  } catch (e) {
    console.error(`Error adding task:`, e);
    return { success: false, error: `Lỗi khi thêm nhiệm vụ: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function updateTask(taskId, taskData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const taskSheet = ss.getSheetByName(TASK_SHEET_NAME);
    if (!taskSheet) throw new Error(`Không tìm thấy sheet "${TASK_SHEET_NAME}".`);
    
    const headers = getHeaders(taskSheet);
    const idColIndex = headers.indexOf(TASK_ID_COLUMN_NAME);
    if (idColIndex === -1) throw new Error(`Không tìm thấy cột "${TASK_ID_COLUMN_NAME}".`);

    // Validate đầu vào
    if (!taskId) return { success: false, error: 'ID nhiệm vụ không được cung cấp.' };
    if (!taskData || !taskData.name || String(taskData.name).trim() === '') {
        return { success: false, error: 'Tên nhiệm vụ là bắt buộc.' };
    }
    if (!taskData.projectId || String(taskData.projectId).trim() === '') {
        return { success: false, error: 'Nhiệm vụ phải thuộc về một dự án.' };
    }
    if (!checkProjectExists(taskData.projectId)) {
         return { success: false, error: `Mã dự án "${taskData.projectId}" không tồn tại.` };
    }

    const rowInfo = findRowById(taskSheet, idColIndex + 1, taskId);
    if (!rowInfo) return { success: false, error: `Không tìm thấy nhiệm vụ ID: ${taskId}` };
    
    const rowNumber = rowInfo.rowNumber;
    const range = taskSheet.getRange(rowNumber, 1, 1, headers.length);
    const values = range.getValues()[0];

    let changesDetected = false;

    // Xử lý completion
    let completion = 0;
    if (taskData.completion !== undefined && taskData.completion !== null && taskData.completion !== '') {
        const parsedCompletion = parseInt(taskData.completion, 10);
        if (!isNaN(parsedCompletion)) {
            completion = Math.max(0, Math.min(100, parsedCompletion));
        }
    }

    // Cập nhật các trường
    const updates = [
      [headers.indexOf(TASK_NAME_COLUMN_NAME), taskData.name],
      [headers.indexOf(TASK_PROJECT_ID_COLUMN_NAME), taskData.projectId],
      [headers.indexOf(TASK_DESC_COLUMN_NAME), taskData.description],
      [headers.indexOf(TASK_ASSIGNEE_COLUMN_NAME), taskData.assignee],
      [headers.indexOf(TASK_PRIORITY_COLUMN_NAME), taskData.priority],
      [headers.indexOf(TASK_START_DATE_COLUMN_NAME), parseDate(taskData.startDate)],
      [headers.indexOf(TASK_DUE_DATE_COLUMN_NAME), parseDate(taskData.dueDate)],
      [headers.indexOf(TASK_STATUS_COLUMN_NAME), taskData.status],
      [headers.indexOf(TASK_COMPLETION_COLUMN_NAME), completion],
      [headers.indexOf(TASK_REPORT_DATE_COLUMN_NAME), parseDate(taskData.reportDate)],
      [headers.indexOf(TASK_TARGET_COLUMN_NAME), taskData.target],
      [headers.indexOf(TASK_RESULT_LINKS_COLUMN_NAME), taskData.resultLinks],
      [headers.indexOf(TASK_OUTPUT_COLUMN_NAME), taskData.output],
      [headers.indexOf(TASK_NOTES_COLUMN_NAME), taskData.notes]
    ];

    updates.forEach(([index, newValue]) => {
      if (index !== -1 && newValue !== undefined) {
        const formattedValue = (newValue instanceof Date || newValue === null || typeof newValue === 'number') ? newValue : String(newValue).trim();
        if (values[index] !== formattedValue) {
          values[index] = formattedValue;
          changesDetected = true;
        }
      }
    });

    if (changesDetected) {
      console.log("Updating task row:", rowNumber, values);
      range.setValues([values]);
      SpreadsheetApp.flush();
      logActivity("Cập nhật nhiệm vụ", `ID: ${taskId}, Tên: ${taskData.name}`);
    }

    return { success: true, updated: changesDetected };

  } catch (e) {
    console.error(`Error updating task ${taskId}:`, e);
    return { success: false, error: `Lỗi khi cập nhật nhiệm vụ: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function deleteTask(taskId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const taskSheet = ss.getSheetByName(TASK_SHEET_NAME);
    if (!taskSheet) throw new Error(`Không tìm thấy sheet "${TASK_SHEET_NAME}".`);
    
    const headers = getHeaders(taskSheet);
    const idColIndex = headers.indexOf(TASK_ID_COLUMN_NAME);
    if (idColIndex === -1) throw new Error(`Không tìm thấy cột "${TASK_ID_COLUMN_NAME}".`);

    if (!taskId) return { success: false, error: 'ID nhiệm vụ không được cung cấp.' };

    const rowInfo = findRowById(taskSheet, idColIndex + 1, taskId);
    if (!rowInfo) return { success: false, error: `Không tìm thấy nhiệm vụ ID: ${taskId}` };
    
    const rowNumber = rowInfo.rowNumber;
    const nameColIndex = headers.indexOf(TASK_NAME_COLUMN_NAME);
    const taskName = nameColIndex !== -1 ? taskSheet.getRange(rowNumber, nameColIndex + 1).getValue() : taskId;

    taskSheet.deleteRow(rowNumber);
    logActivity("Xóa nhiệm vụ", `ID: ${taskId}, Tên: ${taskName}`);
    
    return { success: true };

  } catch (e) {
    console.error(`Error deleting task ${taskId}:`, e);
    return { success: false, error: `Lỗi khi xóa nhiệm vụ: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function getTasks() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(TASK_SHEET_NAME);
    if (!sheet) {
        console.log(`Sheet "${TASK_SHEET_NAME}" not found.`);
        return [];
    }
    return sheetDataToObjectArray(sheet);
  } catch (e) {
    console.error("Error getting tasks:", e);
    return [];
  }
}

// ==================================
// == QUẢN LÝ NHÂN VIÊN (STAFF) ==
// ==================================

function addStaff(staffData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const staffSheet = getOrCreateSheet(ss, STAFF_SHEET_NAME, [
      STAFF_ID_COLUMN_NAME, STAFF_NAME_COLUMN_NAME, 
      STAFF_EMAIL_COLUMN_NAME, STAFF_POSITION_COLUMN_NAME,
      STAFF_ROLE_COLUMN_NAME, STAFF_PASSWORD_COLUMN_NAME  // Thêm 2 dòng này
    ]);
    
    const headers = getHeaders(staffSheet);

    // Validate required fields
    if (!staffData || !staffData.name || String(staffData.name).trim() === '') {
       return { success: false, error: 'Tên nhân viên là bắt buộc.' };
    }

    const idColIndex = headers.indexOf(STAFF_ID_COLUMN_NAME);
    const lastId = getLastId(staffSheet, idColIndex, "NV");
    const newStaffId = generateNextId(lastId, "NV", 3);

    const newRow = Array(headers.length).fill('');

    // Điền dữ liệu
    newRow[idColIndex] = newStaffId;
    newRow[headers.indexOf(STAFF_NAME_COLUMN_NAME)] = String(staffData.name).trim();
    newRow[headers.indexOf(STAFF_EMAIL_COLUMN_NAME)] = staffData.email ? String(staffData.email).trim() : '';
    newRow[headers.indexOf(STAFF_POSITION_COLUMN_NAME)] = staffData.position ? String(staffData.position).trim() : '';
    newRow[headers.indexOf(STAFF_ROLE_COLUMN_NAME)] = staffData.role || 'Nhân viên';
    newRow[headers.indexOf(STAFF_PASSWORD_COLUMN_NAME)] = staffData.password || '';

    console.log("Adding staff row:", newRow);
    staffSheet.appendRow(newRow);
    SpreadsheetApp.flush();

    logActivity("Thêm nhân viên", `Tên: ${staffData.name}, Email: ${staffData.email || 'N/A'}, ID: ${newStaffId}`);

    return { success: true, staffId: newStaffId };

  } catch (e) {
    console.error(`Error adding staff:`, e);
    return { success: false, error: `Lỗi khi thêm nhân viên: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function updateStaff(staffId, staffData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const staffSheet = ss.getSheetByName(STAFF_SHEET_NAME);
    if (!staffSheet) throw new Error(`Không tìm thấy sheet "${STAFF_SHEET_NAME}".`);
    
    const headers = getHeaders(staffSheet);
    const idColIndex = headers.indexOf(STAFF_ID_COLUMN_NAME);
    if (idColIndex === -1) throw new Error(`Không tìm thấy cột "${STAFF_ID_COLUMN_NAME}".`);

    // Validate đầu vào
    if (!staffId) return { success: false, error: 'ID nhân viên không được cung cấp.' };
    if (!staffData || !staffData.name || String(staffData.name).trim() === '') {
         return { success: false, error: 'Tên nhân viên là bắt buộc.' };
    }

    const rowInfo = findRowById(staffSheet, idColIndex + 1, staffId);
    if (!rowInfo) return { success: false, error: `Không tìm thấy nhân viên ID: ${staffId}` };
    
    const rowNumber = rowInfo.rowNumber;
    const range = staffSheet.getRange(rowNumber, 1, 1, headers.length);
    const values = range.getValues()[0];

    let changesDetected = false;

    // Cập nhật các trường
    const updates = [
      [headers.indexOf(STAFF_NAME_COLUMN_NAME), staffData.name],
      [headers.indexOf(STAFF_EMAIL_COLUMN_NAME), staffData.email],
      [headers.indexOf(STAFF_POSITION_COLUMN_NAME), staffData.position],
      [headers.indexOf(STAFF_ROLE_COLUMN_NAME), staffData.role],          // Thêm dòng này
      [headers.indexOf(STAFF_PASSWORD_COLUMN_NAME), staffData.password]    // Thêm dòng này
    ];

    updates.forEach(([index, newValue]) => {
      if (index !== -1 && newValue !== undefined) {
        const formattedValue = newValue ? String(newValue).trim() : '';
        if (String(values[index]).trim() !== formattedValue) {
          values[index] = formattedValue;
          changesDetected = true;
        }
      }
    });

    if (changesDetected) {
      console.log("Updating staff row:", rowNumber, values);
      range.setValues([values]);
      SpreadsheetApp.flush();
      logActivity("Cập nhật nhân viên", `ID: ${staffId}, Tên: ${staffData.name}`);
    }

    return { success: true, updated: changesDetected };

  } catch (e) {
    console.error(`Error updating staff ${staffId}:`, e);
    return { success: false, error: `Lỗi khi cập nhật nhân viên: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function deleteStaff(staffId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const staffSheet = ss.getSheetByName(STAFF_SHEET_NAME);
    if (!staffSheet) throw new Error(`Không tìm thấy sheet "${STAFF_SHEET_NAME}".`);
    
    const headers = getHeaders(staffSheet);
    const idColIndex = headers.indexOf(STAFF_ID_COLUMN_NAME);
    if (idColIndex === -1) throw new Error(`Không tìm thấy cột "${STAFF_ID_COLUMN_NAME}".`);

    if (!staffId) return { success: false, error: 'ID nhân viên không được cung cấp.' };

    const rowInfo = findRowById(staffSheet, idColIndex + 1, staffId);
    if (!rowInfo) return { success: false, error: `Không tìm thấy nhân viên ID: ${staffId}` };
    
    const rowNumber = rowInfo.rowNumber;
    const nameColIndex = headers.indexOf(STAFF_NAME_COLUMN_NAME);
    const staffName = nameColIndex !== -1 ? staffSheet.getRange(rowNumber, nameColIndex + 1).getValue() : staffId;

    staffSheet.deleteRow(rowNumber);
    logActivity("Xóa nhân viên", `ID: ${staffId}, Tên: ${staffName}`);
    
    return { success: true };

  } catch (e) {
    console.error(`Error deleting staff ${staffId}:`, e);
    return { success: false, error: `Lỗi khi xóa nhân viên: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}

function getStaffList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(STAFF_SHEET_NAME);
    if (!sheet) {
        console.log(`Sheet "${STAFF_SHEET_NAME}" not found. Creating one.`);
        const newSheet = getOrCreateSheet(ss, STAFF_SHEET_NAME, [
          STAFF_ID_COLUMN_NAME, STAFF_NAME_COLUMN_NAME, 
          STAFF_EMAIL_COLUMN_NAME, STAFF_POSITION_COLUMN_NAME
        ]);
        return [];
    }
    return sheetDataToObjectArray(sheet);
  } catch (e) {
    console.error("Error getting staff list:", e);
    return [];
  }
}

// ==================================
// == BIỂU ĐỒ & THỐNG KÊ ==
// ==================================

function getTaskStatusChartData(tasks) {
  try {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return { labels: [], data: [], message: "Không có dữ liệu nhiệm vụ để tạo biểu đồ." };
    }
    
    const statusCounts = {};
    const statusHeader = TASK_STATUS_COLUMN_NAME;

    tasks.forEach(task => {
      if (typeof task === 'object' && task !== null && task.hasOwnProperty(statusHeader)) {
         const status = String(task[statusHeader] || "Không xác định").trim();
         if (status) {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
         }
      }
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);

    if (labels.length === 0) {
       return { labels: [], data: [], message: "Không có trạng thái nhiệm vụ nào được tìm thấy." };
    }
    
    return { labels: labels, data: data };

  } catch (e) {
     console.error("Error getting chart data:", e);
     return { labels: [], data: [], error: `Lỗi khi lấy dữ liệu biểu đồ: ${e.message}` };
  }
}

function getSummaryStats(projects, tasks) {
    try {
        const totalProjects = (projects && Array.isArray(projects)) ? projects.length : 0;
        let completedTasks = 0;
        let ongoingTasks = 0;
        let overdueTasks = 0;
        const totalTasks = (tasks && Array.isArray(tasks)) ? tasks.length : 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (tasks && Array.isArray(tasks)) {
            const statusHeader = TASK_STATUS_COLUMN_NAME;
            const dueDateHeader = TASK_DUE_DATE_COLUMN_NAME;

            tasks.forEach(task => {
                 if (typeof task !== 'object' || task === null || !task.hasOwnProperty(statusHeader)) {
                     return;
                 }

                const status = String(task[statusHeader] || '').trim().toLowerCase();
                const dueDateString = task[dueDateHeader];

                // Đếm trạng thái
                if (status.includes('hoàn thành')) {
                    completedTasks++;
                } else if (status.includes('đang')) {
                    ongoingTasks++;
                }

                // Kiểm tra quá hạn
                if (!status.includes('hoàn thành') && dueDateString) {
                    try {
                        const dueDate = parseDate(dueDateString);
                         if (dueDate && dueDate < today) {
                            overdueTasks++;
                         }
                    } catch (dateError) {
                        console.log(`Could not parse due date for task: ${dueDateString} - Error: ${dateError}`);
                    }
                }
            });
        }

        return {
            totalProjects: totalProjects,
            totalTasks: totalTasks,
            completedTasks: completedTasks,
            ongoingTasks: ongoingTasks,
            overdueTasks: overdueTasks
        };
    } catch (e) {
        console.error("Error calculating summary stats:", e);
        return { error: `Lỗi khi tính toán thống kê: ${e.message}` };
    }
}

// ==================================
// == NHẬT KÝ & THÔNG BÁO ==
// ==================================

function getRecentActivities() {
    try {
       const ss = SpreadsheetApp.getActiveSpreadsheet();
       let sheet = getOrCreateSheet(ss, ACTIVITY_LOG_SHEET_NAME, [
         LOG_TIMESTAMP_COLUMN_NAME, LOG_ACTION_COLUMN_NAME, 
         LOG_USER_COLUMN_NAME, LOG_DETAILS_COLUMN_NAME
       ]);
       
       const lastRow = sheet.getLastRow();
       if (lastRow < 2) return [];
       
       const startRow = Math.max(2, lastRow - MAX_ACTIVITIES + 1);
       const numRows = lastRow - startRow + 1;
       if (numRows <= 0) return [];
       
       const range = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn());
       const data = range.getValues();
       const headers = getHeaders(sheet);
       
       const activities = data.map(row => {
         const activity = {};
         headers.forEach((header, index) => {
           if (header && index < row.length) {
              if (header === LOG_TIMESTAMP_COLUMN_NAME && row[index] instanceof Date) {
                   activity[header] = row[index].toISOString();
              } else {
                  activity[header] = row[index];
              }
           }
         });
         return activity;
       }).reverse();
       
      return activities;
     } catch (e) {
       console.error("Error getting recent activities:", e);
       return [];
     }
}

function getNotifications() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = getOrCreateSheet(ss, NOTIFICATION_SHEET_NAME, [
      NOTIFICATION_ID_COLUMN_NAME, NOTIFICATION_TIMESTAMP_COLUMN_NAME,
      NOTIFICATION_USER_COLUMN_NAME, NOTIFICATION_CONTENT_COLUMN_NAME,
      NOTIFICATION_STATUS_COLUMN_NAME, NOTIFICATION_TYPE_COLUMN_NAME
    ]);
    
    const lastRow = sheet.getLastRow();
     if (lastRow < 2) return [];
     
    const startRow = Math.max(2, lastRow - MAX_NOTIFICATIONS + 1);
    const numRows = lastRow - startRow + 1;
    if (numRows <= 0) return [];
    
    const range = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn());
    const data = range.getValues();
    const headers = getHeaders(sheet);
    const statusColIndex = headers.indexOf(NOTIFICATION_STATUS_COLUMN_NAME);

    const notifications = data.map(row => {
      const notification = {};
      let isRead = false;
      headers.forEach((header, index) => {
        if (header && index < row.length) {
           if (header === NOTIFICATION_TIMESTAMP_COLUMN_NAME && row[index] instanceof Date) {
                 notification[header] = row[index].toISOString();
            } else {
                notification[header] = row[index];
            }
            if (index === statusColIndex && String(row[index]).trim().toLowerCase() === 'đã đọc') {
                isRead = true;
            }
        }
      });
      notification.isRead = isRead;
      return notification;
    }).reverse();
    
    return notifications;
  } catch (e) {
     console.error("Error getting notifications:", e);
     return [];
  }
}

function markNotificationAsRead(notificationId) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(15000);
        
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const notificationSheet = ss.getSheetByName(NOTIFICATION_SHEET_NAME);
        if (!notificationSheet) throw new Error(`Không tìm thấy sheet "${NOTIFICATION_SHEET_NAME}".`);
        
        const headers = getHeaders(notificationSheet);
        const idColIndex = headers.indexOf(NOTIFICATION_ID_COLUMN_NAME);
        const statusColIndex = headers.indexOf(NOTIFICATION_STATUS_COLUMN_NAME);
        if (idColIndex === -1 || statusColIndex === -1) {
            throw new Error(`Thiếu cột ID hoặc Status trong sheet thông báo.`);
        }
        
        if (!notificationId) return { success: false, error: 'ID thông báo không được cung cấp.' };

        const rowInfo = findRowById(notificationSheet, idColIndex + 1, notificationId);
        if (!rowInfo) return { success: false, error: `Không tìm thấy thông báo ID: ${notificationId}` };
        
        const rowNumber = rowInfo.rowNumber;
        notificationSheet.getRange(rowNumber, statusColIndex + 1).setValue("Đã đọc");
        SpreadsheetApp.flush();
        
        return { success: true };
    } catch (e) {
        console.error(`Error marking notification ${notificationId} as read:`, e);
        return { success: false, error: `Lỗi khi cập nhật trạng thái thông báo: ${e.message}` };
    } finally {
        lock.releaseLock();
    }
}

function clearReadNotifications() {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000);
        
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const notificationSheet = ss.getSheetByName(NOTIFICATION_SHEET_NAME);
        if (!notificationSheet || notificationSheet.getLastRow() < 2) {
            return { success: true, message: "Không có thông báo nào để xóa.", deletedCount: 0 };
        }
        
        const headers = getHeaders(notificationSheet);
        const statusColIndex = headers.indexOf(NOTIFICATION_STATUS_COLUMN_NAME);
        if (statusColIndex === -1) {
            throw new Error(`Thiếu cột Status trong sheet Thông báo.`);
        }

        const range = notificationSheet.getRange(2, 1, notificationSheet.getLastRow() - 1, headers.length);
        const values = range.getValues();
        const rowsToDelete = [];
        
        // ✅ SỬA LOGIC TÌM HÀNG CẦN XÓA
        for (let i = 0; i < values.length; i++) {
            const statusValue = String(values[i][statusColIndex] || '').trim().toLowerCase();
            if (statusValue === 'đã đọc') {
                rowsToDelete.push(i + 2); // +2 vì bắt đầu từ hàng 2
            }
        }

        if (rowsToDelete.length === 0) {
            return { success: true, message: "Không có thông báo 'Đã đọc' nào.", deletedCount: 0 };
        }

        // ✅ XÓA TỪNG HÀNG TỪ DƯỚI LÊN TRÊN
        rowsToDelete.reverse().forEach(rowNum => {
            notificationSheet.deleteRow(rowNum);
        });
        
        SpreadsheetApp.flush();

        logActivity("Xóa thông báo", `Đã xóa ${rowsToDelete.length} thông báo đã đọc.`);
        return { success: true, deletedCount: rowsToDelete.length };

    } catch (e) {
        console.error(`Error clearing read notifications:`, e);
        return { success: false, error: `Lỗi khi xóa thông báo đã đọc: ${e.message}` };
    } finally {
        lock.releaseLock();
    }
}

// ==================================
// == HÀM HỖ TRỢ (HELPERS) ==
// ==================================

function getOrCreateSheet(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f8f9fa');
    }
    console.log(`Created sheet: ${sheetName}`);
  }
  return sheet;
}

function sheetDataToObjectArray(sheet) {
    if (!sheet) {
        console.log("sheetDataToObjectArray called with null sheet.");
        return [];
    }
    
    try {
        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();
        if (values.length < 2) return [];

        const headers = values[0].map(header => header ? String(header).trim() : '');
        const dataRows = values.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));
        if (dataRows.length === 0) return [];

        const objectArray = dataRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                if (header && index < row.length) {
                    let cellValue = row[index];
                    // Định dạng ngày tháng thành YYYY-MM-DD
                    if (cellValue instanceof Date) {
                         obj[header] = formatSheetDate(cellValue);
                    } else {
                         obj[header] = cellValue;
                    }
                }
            });
            return obj;
        });
        
        return objectArray;
    } catch(e) {
         console.error(`Error in sheetDataToObjectArray for sheet "${sheet.getName()}":`, e);
         return [];
    }
}

function logActivity(action, details) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let logSheet = getOrCreateSheet(ss, ACTIVITY_LOG_SHEET_NAME, [
          LOG_TIMESTAMP_COLUMN_NAME, LOG_ACTION_COLUMN_NAME, 
          LOG_USER_COLUMN_NAME, LOG_DETAILS_COLUMN_NAME
        ]);
        
        const timestamp = new Date();
        let user = "Unknown User";
        try {
             user = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail() || user;
        } catch(e) { 
          console.log("Could not get user email for logging:", e);
        }

        logSheet.appendRow([timestamp, action, user, details]);
    } catch (e) {
        console.error("Error logging activity:", e);
    }
}

function getHeaders(sheet) {
    if (!sheet) return [];
    try {
        const lastCol = sheet.getLastColumn();
        if (lastCol === 0) return [];
        const headerRange = sheet.getRange(1, 1, 1, lastCol);
        return headerRange.getValues()[0].map(header => header ? String(header).trim() : '');
    } catch (e) {
        console.error(`Error getting headers for sheet "${sheet.getName()}":`, e);
        return [];
    }
}

function getLastId(sheet, idColIndex, prefix) {
    if (!sheet || idColIndex < 0) return null;
    try {
        const lastRow = sheet.getLastRow();
        if (lastRow < 2) return null;

        const idRange = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1);
        const idValues = idRange.getDisplayValues().flat();
        const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');
        let maxNumericPart = 0;

        idValues.forEach(id => {
             if (typeof id === 'string' && id.trim() !== '') {
                const match = id.trim().match(regex);
                if (match) {
                    const numericPart = parseInt(match[1], 10);
                    if (!isNaN(numericPart) && numericPart >= maxNumericPart) {
                        maxNumericPart = numericPart;
                    }
                }
            }
        });

        if (maxNumericPart > 0) {
             const minLength = 3;
             const numericString = String(maxNumericPart).padStart(minLength, '0');
             return `${prefix}${numericString}`;
        } else {
            return null;
        }

    } catch (e) {
        console.error(`Error getting last ID for prefix ${prefix} in column ${idColIndex+1}:`, e);
        return null;
    }
}

function generateNextId(lastId, prefix, minLength = 3) {
    let nextNumericPart = 1;
    if (lastId) {
        const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');
        const match = String(lastId).match(regex);
        if (match) {
            const currentNumericPart = parseInt(match[1], 10);
            if (!isNaN(currentNumericPart)) {
                 nextNumericPart = currentNumericPart + 1;
            }
        }
    }
    const numericString = String(nextNumericPart).padStart(minLength, '0');
    return `${prefix}${numericString}`;
}

function checkProjectExists(projectId) {
    if (!projectId) return false;
    try {
     const ss = SpreadsheetApp.getActiveSpreadsheet();
     const projectSheet = ss.getSheetByName(PROJECT_SHEET_NAME);
     if (!projectSheet) return false;
     
     const headers = getHeaders(projectSheet);
     const idColIndex = headers.indexOf(PROJECT_ID_COLUMN_NAME);
     if (idColIndex === -1 || projectSheet.getLastRow() < 2) return false;

     const idRange = projectSheet.getRange(2, idColIndex + 1, projectSheet.getLastRow() - 1, 1);
     const idValues = idRange.getDisplayValues();
     const existingIds = new Set(idValues.flat().map(id => String(id).trim()));
     return existingIds.has(String(projectId).trim());
    } catch(e) {
     console.error(`Error checking project existence for ID ${projectId}:`, e);
     return false;
    }
}

function findRowById(sheet, idColumnNumber, id) {
    if (!sheet || sheet.getLastRow() < 2 || idColumnNumber < 1) return null;
    try {
        const idToFind = String(id).trim().toLowerCase();
        const idValues = sheet.getRange(2, idColumnNumber, sheet.getLastRow() - 1, 1).getDisplayValues();

        for (let i = 0; i < idValues.length; i++) {
            const currentValue = String(idValues[i][0]).trim().toLowerCase();
            if (currentValue === idToFind) {
                return { rowNumber: i + 2 };
            }
        }
        return null;
    } catch (e) {
        console.error(`Error finding row by ID ${id} in column ${idColumnNumber} of sheet "${sheet.getName()}":`, e);
        return null;
    }
}

function formatSheetDate(dateValue) {
    if (!dateValue) return '';
    try {
        let date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            date = new Date(dateValue);
        }
        if (isNaN(date.getTime())) { return ''; }
        
        const timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
        return Utilities.formatDate(date, timeZone, 'yyyy-MM-dd');
    } catch (e) {
        console.error("Error formatting date:", dateValue, "-", e);
        return '';
    }
}

function parseDate(dateInput) {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
        if (!isNaN(dateInput.getTime())) {
            const validDate = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
            return validDate;
        } else { 
          return null; 
        }
    }
    if (typeof dateInput === 'string') {
        const dateString = dateInput.trim();
        if (dateString === '') return null;
        try {
            // Thử ISO 8601 YYYY-MM-DD
            let date = new Date(dateString + 'T00:00:00');
            if (!isNaN(date.getTime())) return date;

            // Thử DD/MM/YYYY hoặc DD-MM-YYYY
            const partsDMY = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (partsDMY) {
                date = new Date(parseInt(partsDMY[3], 10), parseInt(partsDMY[2], 10) - 1, parseInt(partsDMY[1], 10));
                if (!isNaN(date.getTime()) && date.getDate() === parseInt(partsDMY[1], 10)) return date;
            }
            
            console.log("Could not parse date string:", dateString);
            return null;
        } catch (e) {
            console.error("Error parsing date string '" + dateString + "':", e);
            return null;
        }
    }
    return null;
}

// ==================================
// == TỰ ĐỘNG & TRIGGER ==
// ==================================

function createOverdueNotificationIfNeeded(task) {
   if (!task || typeof task !== 'object') return;
   
   const lock = LockService.getScriptLock();
   try {
        lock.waitLock(10000);
        
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let notificationSheet = getOrCreateSheet(ss, NOTIFICATION_SHEET_NAME, [
          NOTIFICATION_ID_COLUMN_NAME, NOTIFICATION_TIMESTAMP_COLUMN_NAME,
          NOTIFICATION_USER_COLUMN_NAME, NOTIFICATION_CONTENT_COLUMN_NAME,
          NOTIFICATION_STATUS_COLUMN_NAME, NOTIFICATION_TYPE_COLUMN_NAME
        ]);
        
        const headers = getHeaders(notificationSheet);
        const requiredIndexes = [NOTIFICATION_ID_COLUMN_NAME, NOTIFICATION_CONTENT_COLUMN_NAME, NOTIFICATION_STATUS_COLUMN_NAME, NOTIFICATION_TYPE_COLUMN_NAME, NOTIFICATION_TIMESTAMP_COLUMN_NAME].map(h => headers.indexOf(h));
        if (requiredIndexes.some(i => i === -1)) { 
          console.error("Error: Missing required columns in Notification sheet."); 
          return; 
        }

        const [idColIndex, contentColIndex, statusColIndex, typeColIndex, timestampColIndex] = requiredIndexes;
        const userColIndex = headers.indexOf(NOTIFICATION_USER_COLUMN_NAME);

        const taskId = task[TASK_ID_COLUMN_NAME] || 'N/A';
        const taskName = task[TASK_NAME_COLUMN_NAME] || 'Không tên';
        const assignee = task[TASK_ASSIGNEE_COLUMN_NAME] || '';
        const dueDateFormatted = formatSheetDate(task[TASK_DUE_DATE_COLUMN_NAME]);
        const notificationContent = `Nhiệm vụ "${taskName}" (ID: ${taskId}, Người TH: ${assignee || 'Chưa gán'}) đã quá hạn vào ngày ${dueDateFormatted}.`;
        const notificationType = "Quá hạn";
        const notificationStatus = "Chưa đọc";

        // Kiểm tra thông báo trùng lặp
        const lastRow = notificationSheet.getLastRow();
        let alreadyNotifiedUnread = false;
        if (lastRow > 1) {
            const existingContents = notificationSheet.getRange(2, contentColIndex + 1, lastRow - 1, 1).getValues();
            const existingStatuses = notificationSheet.getRange(2, statusColIndex + 1, lastRow - 1, 1).getValues();
            alreadyNotifiedUnread = existingContents.some((content, i) =>
                content[0] === notificationContent &&
                String(existingStatuses[i][0]).trim().toLowerCase() === notificationStatus.toLowerCase()
            );
        }

        if (!alreadyNotifiedUnread) {
            const lastNotiId = getLastId(notificationSheet, idColIndex, "TB");
            const newNotiId = generateNextId(lastNotiId, "TB", 4);
            const newRow = Array(headers.length).fill('');
            newRow[idColIndex] = newNotiId;
            newRow[timestampColIndex] = new Date();
            newRow[contentColIndex] = notificationContent;
            newRow[statusColIndex] = notificationStatus;
            newRow[typeColIndex] = notificationType;
            if (userColIndex !== -1 && assignee) newRow[userColIndex] = assignee;
            
            notificationSheet.appendRow(newRow);
            console.log(`Created overdue notification for task ${taskId}: "${taskName}"`);
        }
   } catch(e) {
       const errorTaskId = task ? (task[TASK_ID_COLUMN_NAME] || 'UNKNOWN_ID') : 'UNKNOWN_TASK';
       console.error(`Error creating overdue notification for task ${errorTaskId}:`, e);
   } finally {
       lock.releaseLock();
   }
}

function checkAndNotifyOverdueTasks() {
   console.log("Running daily check for overdue tasks...");
   const tasks = getTasks();
   if (!Array.isArray(tasks) || tasks.length === 0) { 
     console.log("No tasks found."); 
     return; 
   }

   const today = new Date(); 
   today.setHours(0, 0, 0, 0);
   let overdueCount = 0;
   const statusHeader = TASK_STATUS_COLUMN_NAME;
   const dueDateHeader = TASK_DUE_DATE_COLUMN_NAME;

   tasks.forEach(task => {
        if (typeof task !== 'object' || task === null || !task.hasOwnProperty(statusHeader)) return;
       const status = (task[statusHeader] || '').toLowerCase();
       const dueDateString = task[dueDateHeader];
       if (!status.includes('hoàn thành') && dueDateString) {
           try {
               const dueDate = parseDate(dueDateString);
               if (dueDate && dueDate < today) {
                  overdueCount++;
                  createOverdueNotificationIfNeeded(task);
               }
           } catch (dateError) {
                const taskId = task[TASK_ID_COLUMN_NAME] || 'Không rõ ID';
                console.log(`Daily Check: Could not process task ${taskId}:`, dateError);
           }
       }
   });
   console.log(`Daily check finished. Checked ${tasks.length} tasks. Found ${overdueCount} overdue tasks.`);
}

// ==================================
// == THIẾT LẬP TRIGGER (CHẠY 1 LẦN TỪ EDITOR) ==
// ==================================

function setupDailyTrigger() {
  const triggerFunctionName = 'checkAndNotifyOverdueTasks';
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  
  // Xóa trigger cũ
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === triggerFunctionName) {
      try { 
        ScriptApp.deleteTrigger(trigger); 
        console.log('Deleted existing trigger:', trigger.getUniqueId()); 
        deletedCount++; 
      } catch (e) { 
        console.log(`Could not delete trigger ${trigger.getUniqueId()}:`, e); 
      }
    }
  });
  
  console.log(`Deleted ${deletedCount} existing trigger(s) for ${triggerFunctionName}.`);
  
  try {
      ScriptApp.newTrigger(triggerFunctionName)
        .timeBased()
        .atHour(1)
        .everyDays(1)
        .inTimezone(Session.getScriptTimeZone())
        .create();
      console.log(`Successfully created new daily trigger for ${triggerFunctionName}.`);
      
      if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
        SpreadsheetApp.getUi().alert(`Đã tạo trigger kiểm tra nhiệm vụ quá hạn hàng ngày thành công!`);
      }
  } catch (e) {
       console.error(`Error creating trigger for ${triggerFunctionName}:`, e);
       if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
         SpreadsheetApp.getUi().alert(`Không thể tạo trigger tự động. Lỗi: ${e.message}. Vui lòng kiểm tra quyền hoặc thử lại sau.`);
       }
  }
}

function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  if (triggers.length === 0) { 
    console.log('No triggers found.'); 
    return; 
  }
  
  triggers.forEach(trigger => {
    try { 
      ScriptApp.deleteTrigger(trigger); 
      console.log('Deleted trigger:', trigger.getUniqueId()); 
      deletedCount++; 
    } catch (e) { 
      console.log(`Could not delete trigger ${trigger.getUniqueId()}:`, e); 
    }
  });
  
  console.log(`Deleted ${deletedCount} trigger(s).`);
  if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getUi) {
    SpreadsheetApp.getUi().alert(`Đã xóa ${deletedCount} trigger(s).`);
  }
}

/**
 * Get filtered notifications for user (optional enhancement)
 */
function getFilteredNotifications(userName, userEmail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = getOrCreateSheet(ss, NOTIFICATION_SHEET_NAME, [
      NOTIFICATION_ID_COLUMN_NAME, NOTIFICATION_TIMESTAMP_COLUMN_NAME,
      NOTIFICATION_USER_COLUMN_NAME, NOTIFICATION_CONTENT_COLUMN_NAME,
      NOTIFICATION_STATUS_COLUMN_NAME, NOTIFICATION_TYPE_COLUMN_NAME
    ]);
    
    const lastRow = sheet.getLastRow();
     if (lastRow < 2) return [];
     
    const startRow = Math.max(2, lastRow - MAX_NOTIFICATIONS + 1);
    const numRows = lastRow - startRow + 1;
    if (numRows <= 0) return [];
    
    const range = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn());
    const data = range.getValues();
    const headers = getHeaders(sheet);
    const statusColIndex = headers.indexOf(NOTIFICATION_STATUS_COLUMN_NAME);
    const userColIndex = headers.indexOf(NOTIFICATION_USER_COLUMN_NAME);
    const contentColIndex = headers.indexOf(NOTIFICATION_CONTENT_COLUMN_NAME);

    const notifications = data.map(row => {
      const notification = {};
      let isRead = false;
      headers.forEach((header, index) => {
        if (header && index < row.length) {
           if (header === NOTIFICATION_TIMESTAMP_COLUMN_NAME && row[index] instanceof Date) {
                 notification[header] = row[index].toISOString();
            } else {
                notification[header] = row[index];
            }
            if (index === statusColIndex && String(row[index]).trim().toLowerCase() === 'đã đọc') {
                isRead = true;
            }
        }
      });
      notification.isRead = isRead;
      
      // Filter notifications for this user
      const notificationUser = String(row[userColIndex] || '').trim();
      const notificationContent = String(row[contentColIndex] || '').toLowerCase();
      
      // Show notification if:
      // 1. It's specifically for this user, OR
      // 2. It mentions this user in content, OR
      // 3. It's a general notification (empty user field)
      const isForThisUser = !notificationUser || 
                           notificationUser === userName ||
                           notificationUser === userEmail ||
                           notificationContent.includes(userName.toLowerCase());
      
      return isForThisUser ? notification : null;
    }).filter(n => n !== null).reverse();
    
    return notifications;
  } catch (e) {
     console.error("Error getting filtered notifications:", e);
     return [];
  }
}

/**
 * Enhanced project existence check with user context
 */
function checkProjectExistsForUser(projectId, userName) {
    if (!projectId) return false;
    
    try {
     const ss = SpreadsheetApp.getActiveSpreadsheet();
     const projectSheet = ss.getSheetByName(PROJECT_SHEET_NAME);
     if (!projectSheet) return false;
     
     const headers = getHeaders(projectSheet);
     const idColIndex = headers.indexOf(PROJECT_ID_COLUMN_NAME);
     if (idColIndex === -1 || projectSheet.getLastRow() < 2) return false;

     // Check if project exists
     const idRange = projectSheet.getRange(2, idColIndex + 1, projectSheet.getLastRow() - 1, 1);
     const idValues = idRange.getDisplayValues();
     const existingIds = new Set(idValues.flat().map(id => String(id).trim()));
     const projectExists = existingIds.has(String(projectId).trim());
     
     if (!projectExists) return false;
     
     // For non-admin users, also check if they have tasks in this project
     const currentUser = getCurrentUser();
     if (currentUser && !isAdmin(currentUser) && userName) {
         const tasks = getTasks();
         const userHasTasksInProject = tasks.some(task => 
             task[TASK_PROJECT_ID_COLUMN_NAME] === projectId && 
             task[TASK_ASSIGNEE_COLUMN_NAME] === userName
         );
         return userHasTasksInProject;
     }
     
     return true;
    } catch(e) {
     console.error(`Error checking project existence for user ${userName}:`, e);
     return false;
    }
}

/**
 * Helper function to log user activities with better context
 */
function logUserActivity(action, details, resourceType, resourceId) {
    try {
        const currentUser = getCurrentUser();
        const userContext = currentUser ? `${currentUser.name} (${currentUser.email})` : 'Unknown User';
        
        const enhancedDetails = `${details} [${resourceType}:${resourceId}]`;
        
        logActivity(action, enhancedDetails);
        
        // If this affects other users, we might want to create notifications
        if (resourceType === 'task' && action.includes('gán')) {
            // Could add logic to notify assigned user
        }
        
    } catch (e) {
        console.error('Error logging user activity:', e);
        // Still call original logActivity as fallback
        logActivity(action, details);
    }
}

function addNotificationWithAuth(notificationData) {
  const permissionCheck = checkUserPermission('create', 'notification');
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return addNotification(notificationData);
}

function addNotification(notificationData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const notificationSheet = getOrCreateSheet(ss, NOTIFICATION_SHEET_NAME, [
      NOTIFICATION_ID_COLUMN_NAME, NOTIFICATION_TIMESTAMP_COLUMN_NAME,
      NOTIFICATION_USER_COLUMN_NAME, NOTIFICATION_CONTENT_COLUMN_NAME,
      NOTIFICATION_STATUS_COLUMN_NAME, NOTIFICATION_TYPE_COLUMN_NAME
    ]);
    
    const headers = getHeaders(notificationSheet);
    const idColIndex = headers.indexOf(NOTIFICATION_ID_COLUMN_NAME);
    const lastId = getLastId(notificationSheet, idColIndex, "TB");
    const newNotificationId = generateNextId(lastId, "TB", 4);

    const newRow = Array(headers.length).fill('');
    newRow[idColIndex] = newNotificationId;
    newRow[headers.indexOf(NOTIFICATION_TIMESTAMP_COLUMN_NAME)] = new Date();
    newRow[headers.indexOf(NOTIFICATION_USER_COLUMN_NAME)] = notificationData.recipient || '';
    newRow[headers.indexOf(NOTIFICATION_CONTENT_COLUMN_NAME)] = notificationData.content || '';
    newRow[headers.indexOf(NOTIFICATION_STATUS_COLUMN_NAME)] = 'Chưa đọc';
    newRow[headers.indexOf(NOTIFICATION_TYPE_COLUMN_NAME)] = notificationData.type || 'Thông báo';

    notificationSheet.appendRow(newRow);
    logActivity("Thêm thông báo", `Nội dung: ${notificationData.content}, Người nhận: ${notificationData.recipient || 'Tất cả'}`);
    
    return { success: true, notificationId: newNotificationId };
  } catch (e) {
    return { success: false, error: `Lỗi khi thêm thông báo: ${e.message}` };
  } finally {
    lock.releaseLock();
  }
}
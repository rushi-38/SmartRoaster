# Smart Roster Management System

A full-stack workforce management application built using the MERN stack to simplify employee scheduling, manage workforce availability, and automate monthly roster generation.

The application provides a centralized platform for managing employees, pods, brands, processes, assignments, working rules, and leave requests. It also identifies staffing shortages and scheduling conflicts to help administrators make informed workforce management decisions.

## Project Overview

Managing employee schedules manually becomes challenging when an organization has multiple teams, brands, processes, and different staffing requirements.

The Smart Roster Management System aims to simplify this process by providing an organized platform for workforce management.

Administrators can manage employee information, configure working rules, assign employees to processes, approve leave requests, generate monthly rosters, and monitor staffing conflicts.

## Key Features

### 1. Dashboard
- Overview of workforce information.
- Employee, brand, process, and pod statistics.
- Roster coverage and staffing shortage information.
- Quick access to management sections.

### 2. Employee Management
- Add, update, and manage employees.
- Assign employees to pods.
- Manage employee roles and weekly offs.
- Track active and inactive employees.

### 3. Brand & Process Management
- Create and manage brands.
- Define multiple processes under brands.
- Assign managers.
- Configure process-specific requirements.

### 4. Pod Management
- Create and manage teams (pods).
- Assign pod leads.
- Manage employee-to-pod relationships.

### 5. Assignment Management
- Assign employees to brands and processes.
- Manage employee workload distribution.
- Maintain assignment status.

### 6. Working Rules
- Configure working days for each brand-process combination.
- Define minimum staffing requirements.
- Configure public holiday rules.

### 7. Leave Management
- Manage employee leave requests.
- Support different leave types.
- Approve or reject leave requests.
- Consider approved leaves during roster generation.

### 8. Automated Roster Generation
- Generate monthly employee rosters.
- Consider employee assignments and availability.
- Check weekly offs and approved leaves.
- Apply configured working rules.
- Identify insufficient staffing.

### 9. Conflict Management
- Detect staffing shortages during roster generation.
- Display required and available employee counts.
- Track unresolved scheduling conflicts.

### 10. Reports
- View roster statistics.
- Monitor employee allocations.
- Track staffing shortages.
- Review staffing coverage.

### 11. Authentication
- Administrator login.
- JWT-based authentication.
- Password hashing using bcryptjs.
- Protected backend API routes.

### 12. Search & Notifications
- Search employees, pods, brands, processes, and assignments.
- View pending leave requests.
- Track unresolved roster conflicts.
- Monitor unread notifications.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Bootstrap 5, Bootstrap Icons, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| API Communication | Axios |
| Development Tools | VS Code, Git, GitHub, Postman |

## Application Architecture

The application follows a client-server architecture.

- **Frontend:** React handles the user interface and communicates with backend APIs.
- **Backend:** Express.js manages API requests, authentication, business logic, and roster generation.
- **Database:** MongoDB stores employees, brands, processes, pods, assignments, leaves, rosters, and notifications.

The frontend and backend are maintained separately to keep the application modular and easier to maintain.

## Project Structure

```text
SmartRoaster/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   ├── seed.js
│   └── seedadmin.js
│
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account or local MongoDB
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/rushi-38/SmartRoaster.git
cd SmartRoaster
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret

ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@smartroster.com
ADMIN_PASSWORD=your_admin_password

FRONTEND_URL=http://localhost:5173
```

Replace the placeholder values with your own configuration.

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The application will generally be available at:

```text
http://localhost:5173
```

The backend will generally run at:

```text
http://localhost:5000
```

### 4. Create Administrator Account

Configure the administrator details in the backend `.env` file.

Run the administrator seed script:

```bash
cd backend
node seedadmin.js
```

Use the configured administrator email and password to log in.

## Demo Login

For demonstration purposes, a demo administrator account can be provided for a local or hosted test environment.

| Field | Value |
|---|---|
| Email | admin@smartroster.com |
| Password | YourNewStrongPassword

**Note:** The demo account must be created using the administrator seed script before login. Do not publish production administrator credentials or give public users unrestricted administrative access. For a publicly deployed demo, use a separate test database and restrict destructive operations.

## Database Design

The application uses separate MongoDB collections for:

- Users
- Employees
- Pods
- Brands
- Processes
- Assignments
- Working Rules
- Leaves
- Rosters
- Notifications

References connect related records. For example, employees reference pods, processes reference brands, and assignments connect employees with brands and processes.

This approach keeps the database organized and makes individual entities easier to manage.

## How Roster Generation Works

The roster generator uses employee assignments and working rules to create monthly schedules.

The process includes:

1. Fetching active employees and their assignments.
2. Checking configured working days.
3. Excluding employees on weekly offs.
4. Excluding employees with approved leaves.
5. Checking whether an employee is already allocated on that date.
6. Allocating eligible employees according to minimum staffing requirements.
7. Generating conflicts when staffing requirements cannot be met.
8. Saving the generated monthly roster.

The current implementation uses sequential allocation. It handles the basic scheduling constraints but does not guarantee a globally optimal allocation when multiple processes compete for the same employees.

## Design Decisions & Technical Reasoning

### 1. How did you model employees, brands, processes, pods, and their relationships?

I used separate MongoDB collections for Employees, Brands, Processes, Pods, and Assignments.

Employees are connected to pods through references, processes are connected to brands, and assignments connect employees with the brands and processes they are eligible to work on.

This structure keeps entities independent and avoids unnecessary data duplication.

### 2. How does your system generate a roster and determine whether it satisfies the required constraints?

The system considers active employees, assignments, working rules, approved leaves, weekly offs, and holidays.

For each working day, it identifies eligible employees and allocates them according to the minimum staffing requirement. It then compares the allocated count with the required count and records a conflict if there is a shortage.

### 3. How did you handle single-resource brands and brands with multiple employees?

I used a configurable minimum staffing requirement for each brand-process combination.

For example, a process requiring one employee has a minimum staffing value of 1, while a process requiring eight employees has a value of 8.

The same scheduling logic handles both cases.

### 4. What happens when an employee is unavailable on a required working day?

The system checks employee availability before allocation.

Employees on approved leave or weekly off are excluded. If other eligible employees are available, the system considers them. Otherwise, it records a staffing conflict instead of allocating an unavailable employee.

### 5. How does your system handle conflicting requirements or insufficient staffing?

The system records conflicts when the allocated employee count is below the configured minimum requirement.

Each conflict includes the date, brand, process, required staff, available staff, and resolution status. Administrators can review these conflicts and decide how to handle them.

### 6. Which parts of the process did you automate, and which did you leave under human control? Why?

I automated repetitive operations such as roster generation, availability checking, employee allocation, staffing validation, and conflict detection.

I kept employee management, assignment configuration, leave approvals, working rules, and conflict decisions under administrator control.

This approach reduces manual work while allowing managers to make important operational decisions.

### 7. If the company doubled its team and brand count, what would you change?

I would focus on database indexing, query optimization, pagination, and more efficient scheduling algorithms.

I would also introduce background processing for large roster-generation tasks and improve role-based access control.

### 8. If you had one additional week to work on this, what would you improve first?

I would first improve the roster-generation algorithm.

The current implementation uses sequential allocation, which can produce suboptimal results when multiple processes depend on the same employees.

I would explore constraint-based scheduling, prioritize processes with limited employee availability, add replacement suggestions, and introduce more automated tests for complex scheduling scenarios.

## Future Improvements

- Advanced constraint-based roster optimization.
- Intelligent employee replacement suggestions.
- Improved conflict resolution workflows.
- More detailed role-based permissions.
- Automated testing for scheduling scenarios.
- Background processing for large roster-generation tasks.
- Enhanced reporting and analytics.

## Conclusion

The Smart Roster Management System is a full-stack application designed to address practical workforce management challenges.

During development, I focused on understanding business relationships, implementing scheduling rules, handling employee availability, building REST APIs, and identifying staffing conflicts.

This project helped me understand how frontend interfaces, backend APIs, database relationships, authentication, and business logic work together in a real-world application.

I plan to continue improving the scheduling algorithm and extending the system with more advanced workforce management capabilities.

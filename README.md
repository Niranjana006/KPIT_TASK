# Flow Forge

Build a polished, production-quality full-stack Agile Project Management Tool for a small team of 3–10 users.

IMPORTANT:

This is a technical evaluation assignment for a software engineering internship. Do NOT create a generic template or a simple CRUD demo. Build a realistic, professional product with strong UX, clean architecture, reusable components, responsive design, and realistic interactions.

The product should feel like a lightweight combination of Jira, Linear, and modern project management tools, but with its own visual identity.

CORE CONCEPT:

The application manages work using this mandatory hierarchy:

Project

└── User Story

        └── Task

A Project contains multiple User Stories.

Each User Story contains one or more Tasks.

The hierarchy must be clearly visible and easy to navigate throughout the UI.

==================================================

TECHNOLOGY / FRONTEND

==================================================

Use:

- React

- TypeScript

- Vite

- Tailwind CSS

- shadcn/ui or similarly accessible reusable UI components

- Lucide icons

Build the frontend with a clean component architecture.

Use mock/local data initially so every major UI flow can be demonstrated before the backend is connected.

Keep the data layer isolated behind service/API functions so the frontend can later be connected cleanly to a REST backend.

Do NOT tightly couple UI components to mock data.

==================================================

DESIGN DIRECTION

==================================================

Create a premium, modern B2B SaaS interface.

Visual style:

- Clean

- Professional

- Minimal but information-rich

- Excellent spacing and typography

- Subtle borders

- Soft neutral backgrounds

- Clear status/priority indicators

- Restrained use of accent colors

- No excessive gradients

- No flashy marketing-style sections

- No unnecessary animations

Think:

Linear + Jira + Notion-level usability.

The application must look like something a real engineering team could use.

Fully responsive:

- Desktop

- Tablet

- Mobile

Use proper loading, empty, success, error and confirmation states.

Every button and major interaction should actually work in the frontend.

==================================================

APPLICATION SHELL

==================================================

Create a persistent application layout with:

LEFT SIDEBAR:

- App logo/name: "FlowForge"

- Dashboard

- Projects

- My Work

- Notifications

- Activity

- Settings

At the bottom:

- User avatar

- User name

- Role

- Workspace/team selector

MAIN CONTENT:

- Top navigation/header

- Breadcrumbs where appropriate

- Page title

- Contextual actions

- Search

- Notifications

- User menu

==================================================

1. DASHBOARD

==================================================

Create a useful project-management dashboard.

Show:

- Total Projects

- Active Projects

- Open User Stories

- Open Tasks

- Completed Tasks

- Overdue Tasks

Include:

- Project progress cards

- Task status distribution

- Recent activity

- Recently updated projects

- My assigned tasks

- Upcoming deadlines

Use realistic sample data.

The dashboard should provide actionable information rather than just decorative statistics.

==================================================

2. PROJECTS PAGE

==================================================

Create a Projects page with:

- Search

- Status filter

- Sort

- Create Project button

Project cards/table should show:

- Project name

- Description

- Status

- Owner

- Progress

- Number of stories

- Number of tasks

- Due date

- Last updated

Allow:

- Create project

- Edit project

- Archive project

- Open project

Create a polished project creation/edit dialog.

Fields:

- Name

- Key

- Description

- Owner

- Status

- Start date

- Due date

Statuses:

- Planning

- Active

- On Hold

- Completed

- Archived

==================================================

3. PROJECT DETAIL

==================================================

When opening a project, create a detailed project workspace.

Header:

- Project name

- Project key

- Description

- Owner

- Status

- Progress

- Due date

- Edit button

Navigation/tabs:

- Overview

- Board

- Backlog

- User Stories

- Activity

==================================================

4. AGILE BOARD

==================================================

Create a professional Kanban-style board.

Columns:

- Backlog

- To Do

- In Progress

- In Review

- Done

Tasks should appear as cards.

Each task card should show:

- Task title

- Task ID

- Priority

- Assignee

- Story association

- Due date

- Labels

- Status

Allow task status changes through intuitive interactions.

If implementing drag-and-drop in the frontend, ensure there is also an accessible alternative such as a status selector.

==================================================

5. USER STORIES

==================================================

Create a User Stories view.

Each story should clearly belong to a Project.

Story fields:

- Story ID

- Title

- Description

- Acceptance criteria

- Status

- Priority

- Assignee

- Story points

- Sprint

- Labels

- Created date

- Updated date

Example format:

US-101

"User authentication"

As a user, I want to securely log in so that I can access my projects.

Acceptance Criteria:

- User can enter email

- User can enter password

- Invalid credentials show an error

- Successful login redirects to dashboard

Show the number of tasks under each story.

==================================================

6. TASK MANAGEMENT

==================================================

Create a complete task management experience.

Task fields:

- Task ID

- Title

- Description

- Status

- Priority

- Assignee

- User Story

- Due date

- Estimated hours

- Labels

- Created date

- Updated date

Task priorities:

- Low

- Medium

- High

- Critical

Task statuses:

- Backlog

- To Do

- In Progress

- In Review

- Done

Support:

- Create

- View

- Edit

- Update status

- Assign

- Change priority

- Set due date

- Add labels

- Delete/archive with confirmation

==================================================

7. HIERARCHY EXPERIENCE

==================================================

Make Project → User Story → Task extremely clear.

Provide a hierarchical view such as:

PROJECT

├── US-101 Authentication

│ ├── TASK-201 Login API

│ ├── TASK-202 Login UI

│ └── TASK-203 Validation

│

└── US-102 Dashboard

      ├── TASK-204 Dashboard API

      └── TASK-205 Dashboard UI

Users should be able to expand/collapse stories and tasks.

Clicking a story opens its details.

Clicking a task opens its details.

==================================================

8. TASK / STORY DETAIL DRAWER

==================================================

Use a polished side drawer or modal for detailed work items.

Include:

- Title

- Description

- Status

- Priority

- Assignee

- Parent project

- Parent user story

- Dates

- Labels

- Activity/history

Include an activity timeline showing events such as:

- Created

- Assigned

- Status changed

- Priority changed

- Due date changed

==================================================

9. MY WORK

==================================================

Create a page showing the current user's assigned work.

Sections:

- Assigned Tasks

- Due Today

- Upcoming

- Overdue

- Recently Completed

Provide filters and sorting.

==================================================

10. SEARCH

==================================================

Implement global search UI.

Search across:

- Projects

- User Stories

- Tasks

Show categorized results.

Include keyboard-friendly interaction and a polished search dialog.

==================================================

11. NOTIFICATIONS

==================================================

Create a notification center.

Example notifications:

- "TASK-204 was assigned to you"

- "US-101 was updated"

- "TASK-205 is due tomorrow"

- "Project Alpha reached 75% completion"

Include unread/read states.

IMPORTANT:

This notification UI will later be connected to the backend's asynchronous/background workflow.

==================================================

12. ACTIVITY

==================================================

Create a project/team activity feed.

Show:

- Who performed the action

- What changed

- Related project/story/task

- Timestamp

Examples:

"Arun moved TASK-203 from In Progress to Done."

"Priya assigned TASK-205 to Karthik."

"Project Alpha was marked Completed."

==================================================

13. SETTINGS

==================================================

Create a simple settings page with:

- Profile

- Team members

- Preferences

- Notification preferences

Do not overbuild this section.

==================================================

14. UX REQUIREMENTS

==================================================

Every major action should provide feedback.

Implement:

- Toast notifications

- Confirmation dialogs

- Loading states

- Empty states

- Error states

- Form validation

- Disabled states

- Success states

Forms should have clear labels and validation messages.

Avoid dead buttons.

Use accessible semantic HTML and keyboard-friendly controls.

==================================================

15. SAMPLE DATA

==================================================

Create realistic sample data for:

3 projects

Each project should contain:

- 3–5 User Stories

Each User Story should contain:

- 2–4 Tasks

Use realistic engineering/product-management examples such as:

- Authentication

- Dashboard

- Notifications

- API integration

- User management

- Reporting

- Search

- Performance improvements

Create 5–8 sample team members.

Make the dashboard metrics derive from this data rather than hardcoding unrelated numbers.

==================================================

16. FRONTEND ARCHITECTURE

==================================================

Organize the code into reusable components.

Suggested structure:

src/

components/

pages/

layouts/

features/

    projects/

    stories/

    tasks/

    dashboard/

    notifications/

services/

hooks/

types/

data/

utils/

Keep domain logic separated from presentation.

Create TypeScript interfaces/types for:

- Project

- UserStory

- Task

- User

- Notification

- ActivityEvent

Design the frontend so replacing mock services with REST API calls later requires minimal changes.

==================================================

17. BACKEND READINESS

==================================================

Do NOT build an unnecessary fake backend inside the frontend.

Instead, create a clean service abstraction such as:

projectService

storyService

taskService

notificationService

activityService

These should expose methods that can later map to REST endpoints.

Example:

getProjects()

getProject(id)

createProject(data)

updateProject(id, data)

getStories(projectId)

createStory(data)

updateStory(id, data)

getTasks(storyId)

createTask(data)

updateTask(id, data)

Keep API-related logic isolated.

==================================================

18. PRODUCTION-MINDED UX

==================================================

The application should demonstrate engineering judgment.

Examples:

- Prevent accidental destructive actions

- Validate required fields

- Handle missing data gracefully

- Avoid duplicated UI logic

- Use reusable components

- Provide useful empty states

- Provide useful error messages

- Maintain consistent status/priority terminology

==================================================

19. IMPORTANT FOR THE ASSIGNMENT

==================================================

This project will eventually need:

- Frontend

- Backend APIs

- Persistent SQLite storage

- Project → User Story → Task hierarchy

- Create/view/update/organize functionality

- At least one asynchronous/background workflow

- API documentation

- Database schema documentation

- Architecture documentation

- Design decisions and tradeoffs

- Security considerations

- AI usage note

- Future improvements section

The backend, database, async workflow, documentation and tests will be implemented later after the frontend is connected to GitHub.

Design the frontend now so that it supports those requirements cleanly.

==================================================

FINAL QUALITY BAR

==================================================

Before finishing:

- Ensure all routes work

- Ensure all buttons have meaningful behavior

- Ensure dialogs open and close correctly

- Ensure forms validate

- Ensure sample data is internally consistent

- Ensure Project → Story → Task relationships are clearly represented

- Ensure responsive behavior

- Ensure no placeholder lorem ipsum

- Ensure no obviously unfinished sections

- Ensure the UI looks polished enough for a technical evaluation/demo

Build the application now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://story-task-forge.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9a6230c1-7621-4339-9d36-3b829318d559).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

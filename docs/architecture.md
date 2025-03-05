# OpenStud System Architecture

This document provides a visual guide to the system architecture and data flow of the OpenStud application.

## System Architecture

```mermaid
graph TB
    %% Client Layer
    subgraph "Client Layer"
        Browser["Web Browser"]
        MobileApp["Mobile App (Future)"]
    end

    %% Frontend Layer
    subgraph "Frontend Layer"
        NextJS["Next.js 15.2.1 App Router"]
        
        subgraph "UI Components"
            Pages["Pages (RSC)"]
            Components["Components"]
            ClientComponents["Client Components"]
        end
        
        subgraph "State Management"
            ReactHookForm["React Hook Form"]
            ContextAPI["Context API"]
        end
        
        subgraph "UI Libraries"
            ShadcnUI["Shadcn UI"]
            RadixUI["Radix UI"]
            TailwindCSS["Tailwind CSS"]
        end
    end

    %% Server Layer
    subgraph "Server Layer"
        ServerComponents["React Server Components"]
        
        subgraph "Server Actions"
            CourseActions["Course Actions"]
            ProjectActions["Project Actions"]
            TaskActions["Task Actions"]
            WorkspaceActions["Workspace Actions"]
            NoteActions["Note Actions"]
            DashboardActions["Dashboard Actions"]
        end
        
        subgraph "Authentication"
            NextAuth["NextAuth.js"]
            AuthAdapter["Prisma Auth Adapter"]
        end
        
        subgraph "API Routes"
            APIRoutes["API Routes"]
        end
    end

    %% Data Layer
    subgraph "Data Layer"
        Prisma["Prisma ORM"]
        
        subgraph "Database Models"
            UserModel["User"]
            CourseModel["Course"]
            NoteModel["Note"]
            TeamModel["Team"]
            TeamMemberModel["TeamMember"]
            ProjectModel["Project"]
            TaskModel["Task"]
            AccountModel["Account"]
            SessionModel["Session"]
        end
        
        PostgreSQL["PostgreSQL (Neon)"]
    end

    %% Deployment Layer
    subgraph "Deployment Layer"
        Vercel["Vercel Platform"]
    end

    %% Connections
    Browser --> NextJS
    MobileApp -.-> NextJS
    
    NextJS --> Pages
    Pages --> Components
    Pages --> ClientComponents
    Components --> ShadcnUI
    Components --> RadixUI
    Components --> TailwindCSS
    ClientComponents --> ReactHookForm
    ClientComponents --> ContextAPI
    
    Pages --> ServerComponents
    ServerComponents --> ServerActions
    ServerComponents --> NextAuth
    NextAuth --> AuthAdapter
    ServerComponents --> APIRoutes
    
    ServerActions --> Prisma
    APIRoutes --> Prisma
    AuthAdapter --> Prisma
    
    Prisma --> UserModel
    Prisma --> CourseModel
    Prisma --> NoteModel
    Prisma --> TeamModel
    Prisma --> TeamMemberModel
    Prisma --> ProjectModel
    Prisma --> TaskModel
    Prisma --> AccountModel
    Prisma --> SessionModel
    
    UserModel --> PostgreSQL
    CourseModel --> PostgreSQL
    NoteModel --> PostgreSQL
    TeamModel --> PostgreSQL
    TeamMemberModel --> PostgreSQL
    ProjectModel --> PostgreSQL
    TaskModel --> PostgreSQL
    AccountModel --> PostgreSQL
    SessionModel --> PostgreSQL
    
    NextJS --> Vercel
```

## Data Flow Diagram

```mermaid
flowchart TD
    %% User Actions
    User([User]) --> Login["Login/Register"]
    User --> ManageCourses["Manage Courses"]
    User --> ManageProjects["Manage Projects"]
    User --> ManageTasks["Manage Tasks"]
    User --> ManageTeams["Manage Teams"]
    User --> ViewDashboard["View Dashboard"]
    
    %% Authentication Flow
    Login --> NextAuth["NextAuth.js"]
    NextAuth --> AuthCheck{Authenticated?}
    AuthCheck -->|No| LoginPage["Login Page"]
    AuthCheck -->|Yes| Dashboard["Dashboard"]
    
    %% Course Management Flow
    ManageCourses --> CourseActions["Course Actions"]
    CourseActions --> CourseCreate["Create Course"]
    CourseActions --> CourseUpdate["Update Course"]
    CourseActions --> CourseDelete["Delete Course"]
    CourseActions --> CourseList["List Courses"]
    
    CourseCreate & CourseUpdate & CourseDelete & CourseList --> PrismaORM["Prisma ORM"]
    
    %% Project Management Flow
    ManageProjects --> ProjectActions["Project Actions"]
    ProjectActions --> ProjectCreate["Create Project"]
    ProjectActions --> ProjectUpdate["Update Project"]
    ProjectActions --> ProjectDelete["Delete Project"]
    ProjectActions --> ProjectList["List Projects"]
    
    ProjectCreate & ProjectUpdate & ProjectDelete & ProjectList --> PrismaORM
    
    %% Task Management Flow
    ManageTasks --> TaskActions["Task Actions"]
    TaskActions --> TaskCreate["Create Task"]
    TaskActions --> TaskUpdate["Update Task"]
    TaskActions --> TaskDelete["Delete Task"]
    TaskActions --> TaskList["List Tasks"]
    TaskActions --> TaskUpdateProgress["Update Progress"]
    TaskActions --> TaskUpdatePriority["Update Priority"]
    TaskActions --> TaskUpdateCategory["Update Category"]
    
    TaskCreate & TaskUpdate & TaskDelete & TaskList & TaskUpdateProgress & TaskUpdatePriority & TaskUpdateCategory --> PrismaORM
    
    %% Team Management Flow
    ManageTeams --> TeamActions["Team/Workspace Actions"]
    TeamActions --> TeamCreate["Create Team"]
    TeamActions --> TeamUpdate["Update Team"]
    TeamActions --> TeamDelete["Delete Team"]
    TeamActions --> TeamList["List Teams"]
    TeamActions --> TeamAddMember["Add Member"]
    TeamActions --> TeamRemoveMember["Remove Member"]
    
    TeamCreate & TeamUpdate & TeamDelete & TeamList & TeamAddMember & TeamRemoveMember --> PrismaORM
    
    %% Dashboard Flow
    ViewDashboard --> DashboardActions["Dashboard Actions"]
    DashboardActions --> GetStats["Get Statistics"]
    DashboardActions --> GetRecentActivity["Get Recent Activity"]
    DashboardActions --> GetUpcomingTasks["Get Upcoming Tasks"]
    
    GetStats & GetRecentActivity & GetUpcomingTasks --> PrismaORM
    
    %% Database Operations
    PrismaORM --> Database[(PostgreSQL)]
    
    %% Data Return Flow
    Database --> PrismaORM
    PrismaORM --> ServerComponents["React Server Components"]
    ServerComponents --> ClientComponents["Client Components"]
    ClientComponents --> UserInterface["User Interface"]
    UserInterface --> User
```

## Entity Relationship Diagram

```mermaid
erDiagram
    User {
        string id PK
        string name
        string email
        datetime emailVerified
        string image
        enum plan
        datetime createdAt
        datetime updatedAt
    }
    
    Account {
        string id PK
        string userId FK
        string type
        string provider
        string providerAccountId
        string refresh_token
        string access_token
        int expires_at
        string token_type
        string scope
        string id_token
        string session_state
    }
    
    Session {
        string id PK
        string sessionToken
        string userId FK
        datetime expires
    }
    
    VerificationToken {
        string identifier
        string token
        datetime expires
    }
    
    Course {
        string id PK
        string name
        string description
        datetime createdAt
        datetime updatedAt
        string userId FK
    }
    
    Note {
        string id PK
        string title
        string content
        string courseId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Team {
        string id PK
        string name
        datetime createdAt
        datetime updatedAt
    }
    
    TeamMember {
        string id PK
        string teamId FK
        string userId FK
        enum role
        datetime createdAt
        datetime updatedAt
    }
    
    Project {
        string id PK
        string name
        string description
        string teamId FK
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Task {
        string id PK
        string title
        string description
        boolean completed
        int completionPercentage
        datetime dueDate
        string priority
        string category
        string projectId FK
        datetime createdAt
        datetime updatedAt
    }
    
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ Course : creates
    User ||--o{ TeamMember : participates
    User ||--o{ Project : owns
    
    Course ||--o{ Note : contains
    
    Team ||--o{ TeamMember : has
    Team ||--o{ Project : has
    
    Project ||--o{ Task : contains
```

## Features and Functionality

```mermaid
mindmap
  root((OpenStud))
    Task Management
      Progress Tracking
      Priority System
        Urgent
        High
        Medium
        Low
      Academic Categories
        Assignment
        Exam/Quiz
        Presentation
        Lab Work
        Reading
        Project
        Study Session
        Other
      Due Date Tracking
    Workspace Organization
      Individual Workspace
      Team Workspace
      Projects
      Tasks
    Course Management
      Course Creation
      Note Taking
    Team Collaboration
      Team Creation
      Member Management
      Shared Projects
    Analytics
      Progress Visualization
      Time Management
      Achievement Tracking
    User Management
      Authentication
      Profile Management
      Plan Management
        Free
        Pro
        Team
```

## Technology Stack

```mermaid
graph TD
    subgraph "Frontend"
        NextJS["Next.js 15.2.1"]
        React["React 19.0.0"]
        ReactDOM["React DOM 19.0.0"]
        TypeScript["TypeScript"]
        TailwindCSS["Tailwind CSS"]
        ShadcnUI["Shadcn UI"]
        RadixUI["Radix UI Components"]
        NextThemes["Next Themes"]
        ReactHookForm["React Hook Form"]
        Zod["Zod Validation"]
        Recharts["Recharts"]
        Sonner["Sonner Notifications"]
        DateFNS["Date-fns"]
        LucideReact["Lucide React Icons"]
    end
    
    subgraph "Backend"
        NextJSServer["Next.js Server"]
        NextAuth["NextAuth 5.0.0-beta.25"]
        PrismaORM["Prisma ORM 6.4.1"]
        ServerActions["Server Actions"]
    end
    
    subgraph "Database"
        PostgreSQL["PostgreSQL (Neon)"]
    end
    
    subgraph "Deployment"
        Vercel["Vercel Platform"]
    end
    
    NextJS --> React
    NextJS --> ReactDOM
    NextJS --> TypeScript
    NextJS --> TailwindCSS
    NextJS --> ShadcnUI
    ShadcnUI --> RadixUI
    NextJS --> NextThemes
    NextJS --> ReactHookForm
    ReactHookForm --> Zod
    NextJS --> Recharts
    NextJS --> Sonner
    NextJS --> DateFNS
    NextJS --> LucideReact
    
    NextJS --> NextJSServer
    NextJSServer --> NextAuth
    NextJSServer --> PrismaORM
    NextJSServer --> ServerActions
    
    PrismaORM --> PostgreSQL
    
    NextJSServer --> Vercel
```

## Development Workflow

```mermaid
gitGraph
    commit id: "Initial Setup"
    commit id: "Authentication"
    branch feature/courses
    checkout feature/courses
    commit id: "Course Model"
    commit id: "Course CRUD"
    checkout main
    merge feature/courses
    branch feature/projects
    checkout feature/projects
    commit id: "Project Model"
    commit id: "Project CRUD"
    checkout main
    merge feature/projects
    branch feature/tasks
    checkout feature/tasks
    commit id: "Task Model"
    commit id: "Task CRUD"
    commit id: "Task Categories"
    commit id: "Task Priorities"
    checkout main
    merge feature/tasks
    branch feature/teams
    checkout feature/teams
    commit id: "Team Model"
    commit id: "Team CRUD"
    commit id: "Team Members"
    checkout main
    merge feature/teams
    branch feature/dashboard
    checkout feature/dashboard
    commit id: "Dashboard UI"
    commit id: "Dashboard Stats"
    checkout main
    merge feature/dashboard
    commit id: "UI Improvements"
    commit id: "Performance Optimizations"
```

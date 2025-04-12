# 🦷 OralCheckr Backend

## 📝 Description

Backend service for OralCheckr, a comprehensive oral health assessment and habit tracking application. This RESTful API provides the server-side functionality for user management, questionnaire processing, and habit tracking features.

## 🛠️ Tech Stack

- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**:
  - Development: MySQL
  - Production: PostgreSQL
- **ORM**: Sequelize
- **Authentication**:
  - JWT (JSON Web Tokens)
  - Google OAuth
- **Security**: CORS, SSL configuration

## ✨ Key Features

- User authentication and authorization
- Guest user functionality with data migration
- Questionnaire management
- Habit tracking and logging
- Analytics data processing
- Cross-origin resource sharing (CORS)
- Database flexibility (MySQL/PostgreSQL)
- Secure password hashing
- Environment-based configurations

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL (for development) or PostgreSQL (for production)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/jvpatey/OralCheckr-Backend.git
   cd OralCheckr-Backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   NODE_ENV=development
   PORT=3000
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASS=your_database_password
   DB_DIALECT=mysql
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` by default.

## 📚 API Documentation

### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth login
- `POST /auth/guest` - Create guest account
- `POST /auth/convert` - Convert guest to regular user

### Questionnaire Endpoints

- `POST /questionnaire` - Submit questionnaire
- `GET /questionnaire` - Get user's questionnaire results

### Habit Endpoints

- `GET /habits` - Get user's habits
- `POST /habits` - Create new habit
- `PUT /habits/:id` - Update habit
- `DELETE /habits/:id` - Delete habit

### Habit Log Endpoints

- `GET /habit-logs` - Get habit logs
- `POST /habit-logs` - Create habit log
- `DELETE /habit-logs/:id` - Delete habit log

## 🔒 Security

- JWT-based authentication
- Password hashing using bcrypt
- CORS configuration for secure client-server communication
- SSL configuration for database connections
- Environment-based security settings

## 🔄 Database

- Uses Sequelize ORM for database operations
- Automatic database schema synchronization
- Support for both MySQL and PostgreSQL
- Data migration utilities for guest user conversion

## 🧪 Testing

Run tests using:

```bash
npm test
```

## 📦 Deployment

The backend is configured for deployment on Render with PostgreSQL database support.

## 🔗 Related Projects

- [OralCheckr Frontend](https://github.com/jvpatey/OralCheckr) - React frontend application

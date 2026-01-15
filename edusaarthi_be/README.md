# Edusaarthi Backend API

This is the backend API for Edusaarthi, built with Express, Mongoose, and JWT.

## Authentication API

### 1. Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "yourusername",
    "email": "user@example.com",
    "password": "yourpassword123"
  }
  ```
- **Response**: `201 Created` with JWT token and user data.

### 2. Login User
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword123"
  }
  ```
- **Response**: `200 OK` with JWT token and user data.

### 3. Get Current Profile
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**: `200 OK` with current user data.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` with your `MONGO_URI` and `JWT_SECRET`.
3. Start the server:
   ```bash
   npm start
   ```

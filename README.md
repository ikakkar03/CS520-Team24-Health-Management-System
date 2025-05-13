# Healthcare Management System  

## Overview  
The Healthcare Management System is a web-based system thoughtfully designed to improve healthcare processes and provide a secure and efficient way for managing patient information. It supports patient-physician communication and telehealth support. By merging modern tools like electronic health records, secure messaging, and artificial intelligence, the system supports better patient care in the healthcare industry. This project aims to transform traditional healthcare practices by leveraging digital solutions to enhance **efficiency, accessibility, and patient satisfaction**. By eliminating paperwork, reducing administrative overhead, and supporting real-time medical updates, the system improves the quality of care and ensures seamless coordination among healthcare stakeholders. Additionally, **AI-driven recommendations and telehealth services expand healthcare accessibility**, making medical assistance more efficient and widely available.  
  

## Objectives  
The objectives of the project are:  
- **Eliminate manual paperwork** and ensure real-time updates to patient health data.  
- **Enable secure messaging** between doctors, patients, and healthcare staff for efficient medical care coordination.  
- **Provide remote consultations** via video and chat to improve healthcare accessibility.  
- **Integrate pharmacy services** for seamless e-prescriptions and medication tracking.  
- **Implement robust authentication, encryption, and role-based access control** to protect sensitive patient information.  

## Intended Audience  
This project is intended towards the following stakeholders:  
- **Healthcare Providers** (Doctors, Nurses, Hospitals, Clinics) can streamline patient management, access medical records, and improve decision-making.  
- **Patients** can securely access their health data, communicate with doctors, schedule appointments, and receive prescriptions.  
- **Pharmacists** can process e-prescriptions efficiently and manage medication inventory.  
- **Administrators** can oversee system operations, ensure regulatory compliance, and manage user roles.  

## Backend Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm (Node Package Manager)

### Database Setup
1. Install PostgreSQL
2. During installation:
   - Set password for database superuser (postgres)
   - Keep the default port (5432)
3. Open pgAdmin
4. Create a new database:
   - Right-click on "Databases"
   - Select "Create" > "Database"
   - Enter database name: `healthcare_db`
   - Click "Save"
5. Initialize database schema:
   - Right-click on `healthcare_db`
   - Select "Query Tool"
   - Copy and paste the contents of `backend/src/db/schema.sql`
   - Click "Execute/Refresh"

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=healthcare_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=healthcare_system_secret_key_2024_secure_token_generation
   ```
   Replace `your_postgres_password` with the password you set during PostgreSQL installation.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The server should start and show:
   - "Successfully connected to PostgreSQL database"
   - "Server is running on port 5000"

### API Testing
You can test the API endpoints using Postman. Add the following requests:

   #### Authentication API
   - POST `http://localhost:5000/api/auth/register` - Register a new user
   - POST `http://localhost:5000/api/auth/login` - Login user

   Example Register request body:
   ```json
   {
       "email": "test@example.com",
       "password": "password123",
       "role": "patient",
       "firstName": "John",
       "lastName": "Doe"
   }
   ```

   Example Login request body:
   ```json
   {
       "email": "test@example.com",
       "password": "password123"
   }
   ```

   After successful login, you'll receive a JWT token. To use this token for authenticated requests:
   1. Copy the token from the login response
   2. In Postman, add an "Authorization" header to your requests:
      - Key: `Authorization`
      - Value: `Bearer your_token_here`
   

   #### Doctors API
   - GET `http://localhost:5000/api/doctors` - Get all doctors
   - GET `http://localhost:5000/api/doctors/:id` - Get single doctor
   - POST `http://localhost:5000/api/doctors` - Create doctor
   - PUT `http://localhost:5000/api/doctors/:id` - Update doctor
   - DELETE `http://localhost:5000/api/doctors/:id` - Delete doctor

   Example POST request body:
   ```json
   {
       "firstName": "John",
       "lastName": "Doe",
       "email": "john.doe@example.com",
       "specialization": "Cardiology",
       "phoneNumber": "123-456-7890"
   }
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The application will be available at `http://localhost:5173`

Note: Make sure the backend server is running before starting the frontend application.

### Troubleshooting
- If you get "Error: connect ECONNREFUSED 127.0.0.1:5000", make sure the backend server is running
- If you get database connection errors, verify your PostgreSQL credentials in the `.env` file
- Make sure PostgreSQL service is running on your system
- If the frontend can't connect to the backend, ensure both servers are running and the backend URL is correctly configured


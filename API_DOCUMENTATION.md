# API Documentation

## Base URL

Development: `http://localhost:3000/api`
Production: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@healthcenter.rw",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Appointments

#### List Appointments
```http
GET /api/appointments?healthCenterId=uuid&status=scheduled&page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `healthCenterId` (optional): Filter by health center
- `patientId` (optional): Filter by patient
- `status` (optional): Filter by status (scheduled, confirmed, completed, cancelled)
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

#### Get Appointment
```http
GET /api/appointments/:id
Authorization: Bearer <token>
```

#### Create Appointment
```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "uuid",
  "healthCenterId": "uuid",
  "appointmentDate": "2024-01-15",
  "appointmentTime": "10:00",
  "appointmentType": "general",
  "reason": "Regular checkup",
  "notes": "Patient requested morning appointment"
}
```

#### Update Appointment
```http
PUT /api/appointments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Updated notes"
}
```

#### Cancel Appointment
```http
DELETE /api/appointments/:id
Authorization: Bearer <token>
```

#### Get Available Time Slots
```http
GET /api/appointments/slots?healthCenterId=uuid&date=2024-01-15
Authorization: Bearer <token>
```

### Patients

#### List Patients
```http
GET /api/patients?search=john&district=Kigali&page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional): Search by name, national ID, or phone
- `district` (optional): Filter by district
- `page` (optional): Page number
- `limit` (optional): Items per page

#### Get Patient
```http
GET /api/patients/:id
Authorization: Bearer <token>
```

#### Get Patient by National ID
```http
GET /api/patients/national-id/:nationalId
Authorization: Bearer <token>
```

#### Create Patient
```http
POST /api/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "nationalId": "1199912345678901",
  "firstName": "Jean",
  "lastName": "Mukamana",
  "phoneNumber": "+250788111111",
  "dateOfBirth": "1985-05-15",
  "gender": "M",
  "district": "Kigali",
  "sector": "Nyarugenge",
  "preferredLanguage": "rw"
}
```

#### Update Patient
```http
PUT /api/patients/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+250788999999",
  "district": "Huye"
}
```

### Prescriptions

#### List Prescriptions
```http
GET /api/prescriptions?patientId=uuid&healthCenterId=uuid&page=1&limit=50
Authorization: Bearer <token>
```

#### Get Prescription
```http
GET /api/prescriptions/:id
Authorization: Bearer <token>
```

#### Create Prescription
```http
POST /api/prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "uuid",
  "healthCenterId": "uuid",
  "prescriptionDate": "2024-01-15",
  "diagnosis": "Hypertension",
  "notes": "Monitor blood pressure",
  "medications": [
    {
      "medicationName": "Amlodipine",
      "dosage": "5mg",
      "frequency": "once daily",
      "quantity": 30,
      "durationDays": 30,
      "startDate": "2024-01-15",
      "endDate": "2024-02-14",
      "instructions": "Take with food"
    }
  ]
}
```

#### Update Prescription
```http
PUT /api/prescriptions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "diagnosis": "Updated diagnosis",
  "isActive": false
}
```

### Health Centers

#### List Health Centers
```http
GET /api/health-centers
```

No authentication required for this endpoint.

### USSD

#### USSD Endpoint
```http
POST /ussd
Content-Type: application/x-www-form-urlencoded

sessionId=xxx&phoneNumber=+250788111111&text=1&serviceCode=*384*123#
```

This endpoint is called by Africa's Talking when a user dials the USSD code.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (development only)"
}
```

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP address.

USSD endpoint is not rate-limited as it's handled by the telecom provider.


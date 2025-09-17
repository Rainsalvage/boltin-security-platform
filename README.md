# 🛡️ BOLTIN Security Platform

**Ultimate Gadget Security & Protection System**

A comprehensive web application for device registration, tracking, and theft prevention with modern design and robust backend functionality.

## 🌟 Features

### 🔐 Core Security Features
- **Device Registration** - Secure device registration with photo uploads
- **Device Search** - Global database search for device verification
- **Lost/Stolen Reporting** - Immediate incident reporting system
- **Ownership Transfer** - Secure multi-step device ownership transfer
- **Real-time Monitoring** - Live activity feed and statistics

### 🎨 Modern UI/UX
- **Clean Design** - Black and yellow color scheme for security feel
- **Responsive Layout** - Mobile-first design for all devices
- **Interactive Elements** - Smooth animations and hover effects
- **Accessibility** - WCAG compliant with keyboard navigation
- **Professional Typography** - Inter font family for modern look

### 🔧 Technical Features
- **RESTful API** - Complete backend with Express.js
- **File Uploads** - Secure image upload with validation
- **Data Validation** - Comprehensive input validation and sanitization
- **Security Headers** - Helmet.js for enhanced security
- **Rate Limiting** - Protection against abuse
- **Error Handling** - Graceful error management
- **JSON Database** - File-based storage for easy deployment

## 🚀 Quick Start

### Prerequisites
- Node.js (v16.0.0 or higher)
- Modern web browser
- Git (optional, for cloning)

### Installation

1. **Download/Clone the repository**
   ```bash
   git clone https://github.com/adenlebobola/boltin-security-platform.git
   cd boltin-security-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   **Or use the Windows batch file:**
   ```bash
   ./start.bat
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The frontend and API are now running!

## 🌐 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints Overview

#### Device Management
- `GET /api/devices` - List all devices (paginated)
- `POST /api/devices` - Register new device
- `GET /api/devices/:id` - Get device by ID
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/devices/stats` - Get device statistics

#### Search & Lookup
- `GET /api/search/serial/:serial` - Search device by serial
- `GET /api/search` - Advanced search with filters
- `GET /api/search/statistics` - Search statistics

#### Reports (Lost/Stolen)
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get report by ID
- `PUT /api/reports/:id/status` - Update report status
- `GET /api/reports/device/:serial` - Get reports for device

#### Ownership Transfer
- `POST /api/transfer/verify` - Verify device ownership
- `POST /api/transfer` - Create transfer request
- `POST /api/transfer/:id/complete` - Complete transfer
- `GET /api/transfer/device/:serial` - Get transfer history

#### File Upload
- `POST /api/upload/device-images/:deviceId` - Upload device images
- `DELETE /api/upload/device-images/:deviceId/:filename` - Delete image

### Example API Calls

#### Register a Device
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "ownerName": "John Doe",
    "contact": "john@example.com",
    "deviceType": "smartphone",
    "brand": "Apple",
    "model": "iPhone 14",
    "serialNumber": "ABC123456",
    "description": "My primary phone"
  }'
```

#### Search for a Device
```bash
curl -X GET http://localhost:3000/api/search/serial/ABC123456
```

#### Report Lost Device
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "serialNumber": "ABC123456",
    "ownerContact": "john@example.com",
    "reportType": "lost",
    "incidentDate": "2025-01-15",
    "location": "Downtown Lagos",
    "description": "Lost my phone at the mall"
  }'
```

## 📁 Project Structure

```
boltin-security-platform/
├── frontend/                 # Frontend assets
│   ├── css/
│   │   └── styles.css       # Modern UI styles
│   ├── js/
│   │   └── main.js          # Frontend functionality
│   └── index.html           # Main HTML file
├── routes/                  # API routes
│   ├── devices.js           # Device management
│   ├── search.js            # Search functionality
│   ├── reports.js           # Lost/stolen reports
│   ├── transfer.js          # Ownership transfer
│   └── upload.js            # File uploads
├── utils/                   # Utilities
│   ├── database.js          # JSON database
│   ├── validators.js        # Input validation
│   └── middleware.js        # Express middleware
├── data/                    # JSON data files
│   ├── devices.json
│   ├── reports.json
│   └── transfers.json
├── uploads/                 # Uploaded files
│   └── images/
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env                     # Environment config
└── README.md                # This file
```

## 🎯 Key Features in Detail

### Device Registration
- Comprehensive device information capture
- Multi-image upload support
- Automatic serial number validation
- Owner verification system

### Security Search
- Public device lookup by serial number
- Status reporting (safe, lost, stolen)
- Anonymous search capabilities
- Real-time database queries

### Lost/Stolen Reporting
- Immediate incident reporting
- Police report number integration
- Location and timeline tracking
- Automatic device flagging

### Ownership Transfer
- 3-step verification process
- Legal agreement confirmation
- Transfer code generation
- Complete ownership history

### File Management
- Secure image uploads
- Multiple file support
- Automatic cleanup
- File validation and security

## 🛠️ Configuration

### Environment Variables
Create a `.env` file with:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

### Security Features
- Helmet.js security headers
- CORS protection
- Rate limiting
- Input validation and sanitization
- File upload restrictions
- XSS protection

## 📱 Frontend Features

### Modern UI Components
- Responsive navigation with mobile hamburger menu
- Interactive device registration form
- Real-time search with instant results
- Multi-step transfer wizard
- Modal dialogs for reports
- Toast notifications for feedback
- Live activity feed
- Animated statistics counters

### Form Validation
- Real-time input validation
- Visual feedback (valid/invalid states)
- Comprehensive error messages
- Client-side and server-side validation

### User Experience
- Smooth scroll behavior
- Loading states and animations
- Keyboard shortcuts support
- Accessibility features
- Mobile-optimized interface

## 🔒 Security Considerations

### Data Protection
- Input sanitization and validation
- SQL injection prevention (N/A - using JSON files)
- XSS protection
- CSRF protection headers
- Secure file upload handling

### Privacy
- Owner information protection in public searches
- Contact masking for security
- Secure transfer verification
- Anonymous reporting options

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Start with nodemon for auto-restart
```

### Production
```bash
npm start    # Start production server
```

### Hosting Options
- **Vercel** - Simple deployment with git integration
- **Heroku** - Full-stack hosting with add-ons
- **DigitalOcean** - VPS hosting for full control
- **Netlify** - Frontend hosting (requires separate backend)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**adenlebobola**
- GitHub: [@adenlebobola](https://github.com/adenlebobola)

## 🙏 Acknowledgments

- Express.js for the robust backend framework
- Multer for file upload handling
- Helmet.js for security headers
- Inter font family for modern typography
- Font Awesome for beautiful icons

## 📞 Support

For support, email security@boltin.com or create an issue on GitHub.

---

**Built with ❤️ for device security and theft prevention**
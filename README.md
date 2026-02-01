# Businezz - Smart Invoice Generator

A modern, cloud-powered invoice generator application designed for small businesses and freelancers. Create, manage, and share professional digital invoices with ease, synced seamlessly across all your devices.

![Version](https://img.shields.io/badge/version-1.0.0-teal) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🔐 Authentication & Security
- **Secure User Authentication**: Sign up and log in with email/password
- **Password Recovery**: Forgot password functionality with email reset
- **Row Level Security (RLS)**: Your data is completely isolated and secure
- **Multi-device Sync**: Access your invoices from anywhere

### 🏢 Business Profile Management
- **Comprehensive Business Information**: Store name, address, contact details, and tax ID
- **Business Logo Upload**: Upload and display your company logo on invoices
- **Multi-currency Support**: Choose from INR (₹), USD ($), EUR (€), GBP (£), JPY (¥)
- **Customizable Tax Settings**: Set default tax rates and labels (GST, VAT, etc.)

### 📝 Invoice Management
- **Professional Invoice Creation**: Build detailed invoices with multiple line items
- **Smart Invoice Numbering**: Automatic numbering with customizable prefixes (e.g., INV-2026-0001)
- **Status Tracking**: Track invoices through Draft, Pending, Paid, Overdue, and Cancelled states
- **Auto-save to Paid**: Invoices automatically marked as paid when shared
- **Edit & Update**: Modify existing invoices anytime
- **Search & Filter**: Find invoices by customer name, date, or status
- **Real-time Dashboard**: View revenue stats, pending amounts, and recent invoices at a glance

### 👥 Customer Management
- **Customer Database**: Store customer details including name, email, phone, and address
- **Quick Selection**: Auto-fill customer information when creating invoices
- **Customer History**: Track all invoices per customer
- **Easy Management**: Add, edit, or delete customers

### 📦 Product Catalog
- **Product Library**: Maintain a catalog of your products/services
- **Pricing Management**: Set and update product prices
- **Unit Support**: Configure different units (piece, kg, dozen, meter, hour, etc.)
- **Quick Add**: Instantly add products to invoices from your catalog

### 📤 Export & Sharing
- **PDF Generation**: Download professional PDF invoices with your branding
- **Print Support**: Direct printing from the browser
- **Native Sharing**: Share invoices via WhatsApp, Email, SMS, and more
- **Logo Display**: Optionally show/hide your business logo on invoices

### 🎨 Modern UI/UX
- **Beautiful Design**: Premium dark theme with glassmorphism effects
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Smooth Animations**: Delightful micro-interactions and transitions
- **Intuitive Navigation**: Easy-to-use interface with clear visual hierarchy

## 🚀 Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18 with TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **Backend** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Real-time Sync** | Supabase Realtime |
| **State Management** | React Query (TanStack Query) |
| **Routing** | React Router v6 |
| **PDF Generation** | jsPDF + jsPDF-AutoTable |
| **Icons** | Lucide React |
| **Date Handling** | date-fns |

## 🛠️ Setup & Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd invoice-generator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (takes ~2 minutes)

#### Run Database Schema
1. Navigate to the **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `database/schema.sql`
3. Paste and execute the SQL to create all tables, indexes, RLS policies, and triggers

#### Get API Credentials
1. Go to **Project Settings** > **API**
2. Copy your **Project URL** and **anon/public key**

### 4. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

## 📊 Database Schema

The application uses 5 main tables:

- **invoices**: Stores all invoice data with line items as JSONB
- **customers**: Customer contact information
- **products**: Product/service catalog
- **business_profile**: Business information and branding
- **settings**: User preferences and invoice defaults

All tables include:
- Row Level Security (RLS) policies
- Automatic `updated_at` timestamp triggers
- User-based data isolation
- Optimized indexes for performance

## 🔒 Security Features

- **Row Level Security (RLS)**: Every database query is automatically filtered by user ID
- **Secure Authentication**: Passwords are hashed using bcrypt
- **Email Verification**: Optional email confirmation on signup
- **Session Management**: Secure JWT-based sessions
- **HTTPS Only**: All API calls use encrypted connections

## 🎯 Usage Guide

### First Time Setup
1. **Sign Up**: Create an account with your email and password
2. **Business Profile**: Go to Settings > Business Profile and fill in your details
3. **Upload Logo**: Add your business logo for professional invoices
4. **Add Products**: Navigate to Products and create your product catalog
5. **Add Customers**: Go to Customers and add your client information

### Creating an Invoice
1. Click **New Invoice** from the dashboard or invoices page
2. Select a customer (or add a new one)
3. Add line items from your product catalog or create custom items
4. Adjust tax rate and discount if needed
5. Add optional notes
6. Save as Draft or mark as Pending
7. Share, print, or download as PDF

### Managing Invoices
- **View**: Click any invoice to see full details
- **Edit**: Click the edit icon to modify an invoice
- **Delete**: Remove unwanted invoices
- **Filter**: Use the search and filter options to find specific invoices
- **Track Status**: Monitor payment status on the dashboard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 💡 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with ❤️ for small businesses and freelancers**

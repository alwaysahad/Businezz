# Businezz - Smart Invoice Generator

A modern, cloud-powered invoice generator application designed for small businesses. Create, manage, and share professional digital invoices with ease, synced across all your devices.

## 🚀 Cloud-Powered Architecture

Businezz is now fully cloud-only, providing seamless synchronization and real-time updates across multiple devices. No more worries about losing data when clearing browser cache!

### Key Cloud Features:
- **Real-time Sync**: Changes on one device reflect instantly on all others.
- **Secure Authentication**: Your data is protected by the Supabase Auth system.
- **Automated Backups**: All your invoices, customers, and products are stored securely in the cloud.

## Features

### 📝 Invoice Management
- Create professional invoices with customizable items
- Edit and update existing invoices
- Track invoice status (Draft, Pending, Paid, Overdue)
- Search and filter invoices by customer, date, or status
- Automatic invoice numbering with customizable prefixes

### 👥 Customer Management
- Store customer information for quick access
- Auto-complete customer details when creating invoices
- View invoice history per customer

### 📦 Product Catalog
- Maintain a product catalog with prices
- Quick product selection when creating invoices
- Support for different units (piece, kg, dozen, etc.)

### 📤 Sharing & Export
- Download invoices as PDF
- Print invoices directly
- Share via Native Web Share (WhatsApp, Email, etc.)

## Tech Stack

- **React 18** - Frontend UI
- **Vite** - Build Tool
- **Tailwind CSS** - Modern Styling
- **Supabase** - Cloud Backend (Auth, Database, Real-time)
- **Lucide React** - Icon System
- **jsPDF** - PDF Generation

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- A Supabase account (Free tier)

### Setup & Installation

1. **Clone or download** this project.

2. **Supabase Configuration**:
   - Create a new project at [supabase.com](https://supabase.com).
   - Run the schema provided in `database/schema.sql` in the Supabase SQL Editor.
   - Go to **Project Settings > API** to get your `URL` and `anon key`.

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Add your credentials to .env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Start Development**:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready to be deployed to platforms like Vercel, Netlify, or GH Pages.

## 📦 Deployment Instructions

### Vercel / Netlify
1. Push your code to a GitHub repository.
2. Connect the repository to Vercel/Netlify.
3. Configure the environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the provider's dashboard.
4. Set the build command to `npm run build` and output directory to `dist`.

## Data Security

Businezz uses **Supabase Row Level Security (RLS)** to ensure that your data is only accessible to you. Each record is tagged with your unique `user_id`, preventing unauthorized access.

---

Made with ❤️ for small businesses

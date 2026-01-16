# InvoiceFlow - Smart Invoice Generator

A modern, beautiful invoice generator application designed for small businesses like stationery shops, grocery stores, bakeries, and more. Create, manage, and share professional digital invoices with ease.

## Features

### 📝 Invoice Management
- Create professional invoices with customizable items
- Edit and update existing invoices
- Track invoice status (Draft, Pending, Paid, Overdue)
- Search and filter invoices by customer, date, or status
- Automatic invoice numbering

### 👥 Customer Management
- Store customer information for quick access
- Auto-complete customer details when creating invoices
- View invoice history per customer

### 📦 Product Catalog
- Maintain a product/service catalog with prices
- Quick product selection when creating invoices
- Support for different units (piece, kg, dozen, etc.)

### 📤 Sharing & Export
- Download invoices as PDF
- Print invoices directly
- Share via WhatsApp
- Share via Email
- Copy invoice details to clipboard

### 💼 Business Profile
- Customize business name, address, and contact info
- Add your business logo
- Configure GSTIN/Tax ID
- Multiple currency support (₹, $, €, £, ¥)

### ⚙️ Settings
- Configurable tax rates
- Custom invoice prefix
- Default payment terms
- Toggle logo display on invoices

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Lightning fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **jsPDF** - PDF generation
- **Lucide React** - Beautiful icons
- **LocalStorage** - Data persistence

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone or download this project

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready to deploy.

## Usage Guide

### First Time Setup
1. Go to **Settings** and fill in your business details
2. Add your business logo (optional)
3. Configure your preferred currency and tax rate

### Creating an Invoice
1. Click **New Invoice** from the dashboard or sidebar
2. Enter customer details (auto-saved for future use)
3. Add items - select from your product catalog or enter manually
4. Adjust tax rate and discount if needed
5. Add notes or payment terms
6. Save as Draft or Save & Preview

### Managing Products
1. Go to **Products** page
2. Add your frequently sold items with prices
3. These will appear as suggestions when creating invoices

### Sharing Invoices
1. View any invoice
2. Click **Share** button
3. Choose WhatsApp, Email, or copy to clipboard
4. Download PDF for records

## Data Storage

All data is stored locally in your browser using LocalStorage. This means:
- ✅ No server required
- ✅ Works offline
- ✅ Your data stays private
- ⚠️ Clear browser data will delete invoices

For backup, regularly download PDFs of important invoices.

## License

MIT License - Feel free to use and modify for your business needs.

---

Made with ❤️ for small businesses

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Download,
  Printer,
  Share2,
  Check,
  MessageCircle,
  Mail,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { invoiceStorage, businessStorage, settingsStorage } from '../utils/storage';
import { formatCurrency, formatDate, calculateInvoiceTotals, numberToWords, getStatusColor, getStatusLabel, generateWhatsAppLink } from '../utils/helpers';
import { downloadInvoicePDF, openInvoicePDFInNewTab } from '../utils/pdfGenerator';

function ViewInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const printRef = useRef();

  const [invoice, setInvoice] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const business = businessStorage.get();
  const settings = settingsStorage.get();

  useEffect(() => {
    const inv = invoiceStorage.getById(id);
    if (inv) {
      setInvoice(inv);
    } else {
      navigate('/invoices');
    }
  }, [id, navigate]);

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);

  const handleDownloadPDF = () => {
    downloadInvoicePDF(invoice, business, settings);
  };

  const handlePrint = () => {
    openInvoicePDFInNewTab(invoice, business, settings);
  };

  const handleStatusChange = (newStatus) => {
    const updatedInvoice = { ...invoice, status: newStatus };
    invoiceStorage.save(updatedInvoice);
    setInvoice(updatedInvoice);
    setShowStatusMenu(false);
  };

  const generateShareMessage = () => {
    return `Invoice ${invoice.invoiceNumber}\n\nHi ${invoice.customerName},\n\nPlease find your invoice details:\n\nInvoice No: ${invoice.invoiceNumber}\nDate: ${formatDate(invoice.date)}\nAmount: ${formatCurrency(totals.total, business.currency)}\n\nThank you for your business!\n\n- ${business.name || 'Your Business'}`;
  };

  const handleWhatsAppShare = () => {
    if (invoice.customerPhone) {
      const message = generateShareMessage();
      const link = generateWhatsAppLink(invoice.customerPhone, message);
      window.open(link, '_blank');
    }
    setShowShareMenu(false);
  };

  const handleEmailShare = () => {
    const subject = `Invoice ${invoice.invoiceNumber} from ${business.name || 'Your Business'}`;
    const body = generateShareMessage();
    window.location.href = `mailto:${invoice.customerEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    const text = generateShareMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft', icon: Edit, color: 'text-midnight-400' },
    { value: 'pending', label: 'Pending', icon: Clock, color: 'text-gold-400' },
    { value: 'paid', label: 'Paid', icon: CheckCircle, color: 'text-teal-400' },
    { value: 'overdue', label: 'Overdue', icon: AlertCircle, color: 'text-coral-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 rounded-lg hover:bg-midnight-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-midnight-300" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-white">
                {invoice.invoiceNumber}
              </h1>
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)} hover:opacity-80 transition-opacity`}
                >
                  {getStatusLabel(invoice.status)}
                </button>
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute left-0 top-full mt-2 w-40 bg-midnight-800 border border-midnight-600 rounded-xl shadow-lg overflow-hidden z-20">
                      {statusOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleStatusChange(option.value)}
                            className={`flex items-center gap-3 px-4 py-3 w-full hover:bg-midnight-700 transition-colors ${
                              invoice.status === option.value ? 'bg-midnight-700' : ''
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${option.color}`} />
                            <span className="text-white">{option.label}</span>
                            {invoice.status === option.value && (
                              <Check className="w-4 h-4 text-teal-400 ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-midnight-400">{invoice.customerName}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/invoices/edit/${invoice.id}`} className="btn-secondary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button onClick={handleDownloadPDF} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <div className="relative">
            <button onClick={() => setShowShareMenu(!showShareMenu)} className="btn-primary flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-midnight-800 border border-midnight-600 rounded-xl shadow-lg overflow-hidden z-20">
                  {invoice.customerPhone && (
                    <button onClick={handleWhatsAppShare} className="flex items-center gap-3 px-4 py-3 w-full text-white hover:bg-midnight-700 transition-colors">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                      Share via WhatsApp
                    </button>
                  )}
                  <button onClick={handleEmailShare} className="flex items-center gap-3 px-4 py-3 w-full text-white hover:bg-midnight-700 transition-colors">
                    <Mail className="w-5 h-5 text-blue-400" />
                    Share via Email
                  </button>
                  <button onClick={handleCopyLink} className="flex items-center gap-3 px-4 py-3 w-full text-white hover:bg-midnight-700 transition-colors">
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 text-teal-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-midnight-400" />
                        Copy Invoice Details
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden" ref={printRef}>
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-6 text-white">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold">{business.name || 'Your Business Name'}</h2>
              {business.address && <p className="text-teal-100 mt-1 text-sm">{business.address}</p>}
              {business.city && <p className="text-teal-100 text-sm">{business.city}{business.state && `, ${business.state}`}{business.pincode && ` - ${business.pincode}`}</p>}
              {business.phone && <p className="text-teal-100 text-sm">Phone: {business.phone}</p>}
              {business.email && <p className="text-teal-100 text-sm">Email: {business.email}</p>}
              {business.taxId && <p className="text-teal-100 text-sm font-mono">{settings.taxLabel || 'Tax'} ID: {business.taxId}</p>}
            </div>
            <div className="text-right">
              <p className="text-teal-200 text-sm uppercase tracking-wide">Invoice</p>
              <p className="text-xl font-mono font-bold mt-1">{invoice.invoiceNumber}</p>
              <p className="text-teal-100 text-sm mt-2">Date: {formatDate(invoice.date)}</p>
              {invoice.dueDate && <p className="text-teal-100 text-sm">Due: {formatDate(invoice.dueDate)}</p>}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="px-8 py-6 border-b border-gray-100">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Bill To</p>
          <p className="text-gray-900 font-semibold text-lg">{invoice.customerName}</p>
          {invoice.customerAddress && <p className="text-gray-600 text-sm">{invoice.customerAddress}</p>}
          {invoice.customerPhone && <p className="text-gray-600 text-sm">Phone: {invoice.customerPhone}</p>}
          {invoice.customerEmail && <p className="text-gray-600 text-sm">Email: {invoice.customerEmail}</p>}
        </div>

        {/* Items Table */}
        <div className="px-8 py-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-gray-500 font-medium text-xs w-12">#</th>
                <th className="text-left py-3 text-gray-500 font-medium text-xs">Item</th>
                <th className="text-center py-3 text-gray-500 font-medium text-xs w-20">Qty</th>
                <th className="text-right py-3 text-gray-500 font-medium text-xs w-28">Price</th>
                <th className="text-right py-3 text-gray-500 font-medium text-xs w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 text-gray-400 text-sm">{index + 1}</td>
                  <td className="py-4 text-gray-900 font-medium">{item.name}</td>
                  <td className="py-4 text-gray-600 text-center">{item.quantity}</td>
                  <td className="py-4 text-gray-600 text-right font-mono text-sm">{formatCurrency(item.price, business.currency)}</td>
                  <td className="py-4 text-gray-900 text-right font-mono font-medium">{formatCurrency(item.quantity * item.price, business.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 bg-gray-50">
          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(totals.subtotal, business.currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount ({invoice.discount}%)</span>
                  <span className="font-mono text-red-500">-{formatCurrency(totals.discountAmount, business.currency)}</span>
                </div>
              )}
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>{settings.taxLabel || 'Tax'} ({invoice.taxRate}%)</span>
                  <span className="font-mono">{formatCurrency(totals.taxAmount, business.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="font-mono text-teal-600">{formatCurrency(totals.total, business.currency)}</span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Amount in Words</p>
            <p className="text-gray-700 font-medium">{numberToWords(Math.floor(totals.total))} Only</p>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-8 py-6 border-t border-gray-100">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Notes / Payment Terms</p>
            <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 text-center border-t border-gray-100">
          <p className="text-gray-400 text-sm">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}

export default ViewInvoice;

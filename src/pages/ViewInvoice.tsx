import { useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Download,
  Printer,
  Share2,
  Check,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { formatCurrency, formatDate, calculateInvoiceTotals, numberToWords, getStatusColor, getStatusLabel } from '../utils/helpers';
import { usePDFGenerator } from '../hooks/usePDFGenerator';
import type { Invoice, InvoiceStatus } from '../types';
import { useInvoice, useBusiness, useSettings } from '../hooks/useData';

interface StatusOption {
  value: InvoiceStatus;
  label: string;
  icon: LucideIcon;
  color: string;
}

function ViewInvoice() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { invoice, loading: invoiceLoading, saveInvoice } = useInvoice(id);
  const { business, loading: businessLoading } = useBusiness();
  const { settings, loading: settingsLoading } = useSettings();
  const { generatePDF, downloadPDF } = usePDFGenerator();

  const printRef = useRef<HTMLDivElement>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loading = invoiceLoading || businessLoading || settingsLoading;

  if (loading && !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="animate-spin w-8 h-8 text-teal-400" />
          <p className="text-midnight-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    if (!loading) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Invoice Not Found</h2>
          <Link to="/invoices" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Invoices
          </Link>
        </div>
      );
    }
    return null;
  }

  const totals = calculateInvoiceTotals(invoice.items, invoice.taxRate, invoice.discount);

  const handleDownloadPDF = async (): Promise<void> => {
    try {
      await downloadPDF(invoice, business, settings, `${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handlePrint = async (): Promise<void> => {
    try {
      const blob = await generatePDF(invoice, business, settings);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Cleanup URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Failed to open PDF:', error);
    }
  };

  const handleStatusChange = async (newStatus: InvoiceStatus): Promise<void> => {
    setIsUpdatingStatus(true);
    try {
      const updatedInvoice: Invoice = { ...invoice, status: newStatus };
      await saveInvoice(updatedInvoice);
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSharePDF = async (): Promise<void> => {
    setSharing(true);
    try {
      const pdfBlob = await generatePDF(invoice, business, settings);
      const pdfFile = new File([pdfBlob], `${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice for ${invoice.customerName} - ${formatCurrency(totals.total, business.currency)}`,
          files: [pdfFile],
        });

        if (invoice.status !== 'paid') {
          const updatedInvoice: Invoice = { ...invoice, status: 'paid' };
          await saveInvoice(updatedInvoice);
        }
      } else {
        await downloadPDF(invoice, business, settings, `${invoice.invoiceNumber}.pdf`);

        if (invoice.status !== 'paid') {
          const updatedInvoice: Invoice = { ...invoice, status: 'paid' };
          await saveInvoice(updatedInvoice);
        }
      }
    } catch (error) {
      const err = error as Error;
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', error);
        try {
          await downloadPDF(invoice, business, settings, `${invoice.invoiceNumber}.pdf`);

          if (invoice.status !== 'paid') {
            const updatedInvoice: Invoice = { ...invoice, status: 'paid' };
            await saveInvoice(updatedInvoice);
          }
        } catch (downloadError) {
          console.error('Failed to download PDF:', downloadError);
        }
      }
    }
    setSharing(false);
  };

  const statusOptions: StatusOption[] = [
    { value: 'draft', label: 'Draft', icon: Edit, color: 'text-midnight-400' },
    { value: 'pending', label: 'Pending', icon: Clock, color: 'text-gold-400' },
    { value: 'paid', label: 'Paid', icon: CheckCircle, color: 'text-teal-400' },
    { value: 'overdue', label: 'Overdue', icon: AlertCircle, color: 'text-coral-400' },
  ];

  // Calculate SGST and CGST (split tax equally)
  const sgstRate = invoice.taxRate / 2;
  const cgstRate = invoice.taxRate / 2;
  const sgstAmount = totals.taxAmount / 2;
  const cgstAmount = totals.taxAmount / 2;

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
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)} hover:opacity-80 transition-opacity flex items-center gap-2`}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : getStatusLabel(invoice.status)}
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
                            className={`flex items-center gap-3 px-4 py-3 w-full hover:bg-midnight-700 transition-colors ${invoice.status === option.value ? 'bg-midnight-700' : ''
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
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link to={`/invoices/edit/${invoice.id}`} className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <Edit className="w-4 h-4" />
            <span className="hidden xs:inline">Edit</span>
          </Link>
          <button onClick={handleDownloadPDF} className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <Download className="w-4 h-4" />
            <span className="hidden xs:inline">Download</span>
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <Printer className="w-4 h-4" />
            <span className="hidden xs:inline">Print</span>
          </button>
          <button
            onClick={handleSharePDF}
            disabled={sharing}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50"
          >
            <Share2 className={`w-4 h-4 ${sharing ? 'animate-pulse' : ''}`} />
            {sharing ? 'Sharing...' : 'Share PDF'}
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden" ref={printRef}>
        {/* Tax Invoice Title */}
        <div className="text-center py-4 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-900">Tax Invoice</h2>
        </div>

        {/* Invoice Header */}
        <div className="px-8 py-6 border-b-2 border-gray-900">
          <div className="flex justify-between items-start gap-6">
            {/* Business Logo */}
            <div className="flex-shrink-0">
              {settings.showLogo && business.logo ? (
                <img
                  src={business.logo}
                  alt={business.name || 'Business Logo'}
                  className="w-20 h-20 object-contain"
                />
              ) : (
                <div className="w-20 h-20"></div>
              )}
            </div>

            {/* Business Details - Right Aligned */}
            <div className="text-right flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{business.name || 'Your Business Name'}</h2>
              {business.address && <p className="text-gray-700 text-sm mt-1">{business.address}</p>}
              {business.city && <p className="text-gray-700 text-sm">{business.city}{business.state && `, ${business.state}`} {business.pincode}</p>}
              {business.phone && <p className="text-gray-700 text-sm">Phone no.: {business.phone}</p>}
              {business.email && <p className="text-gray-700 text-sm">Email: {business.email}</p>}
              {business.taxId && <p className="text-gray-700 text-sm">GSTIN: {business.taxId}, State: {business.state || '09-Uttar Pradesh'}</p>}
            </div>
          </div>
        </div>

        {/* Bill To & Invoice Details */}
        <div className="grid grid-cols-2 border-b-2 border-gray-900">
          <div className="px-6 py-4 border-r-2 border-gray-900">
            <p className="text-gray-900 font-bold mb-2">Bill To</p>
            <p className="text-gray-900 font-semibold text-base">{invoice.customerName}</p>
            {invoice.customerAddress && <p className="text-gray-700 text-sm mt-1">{invoice.customerAddress}</p>}
            <p className="text-gray-700 text-sm mt-1">State: {business.state || '09-Uttar Pradesh'}</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-gray-900 font-bold mb-2">Invoice Details</p>
            <p className="text-gray-700 text-sm">Invoice No.: {invoice.invoiceNumber}</p>
            <p className="text-gray-700 text-sm mt-1">Date: {formatDate(invoice.date)}</p>
            <p className="text-gray-700 text-sm mt-1">Place of Supply: {business.state || '09-Uttar Pradesh'}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-center py-3 px-2 text-gray-900 font-bold border-r border-gray-300 w-12">#</th>
                <th className="text-left py-3 px-3 text-gray-900 font-bold border-r border-gray-300">Item name</th>
                <th className="text-center py-3 px-2 text-gray-900 font-bold border-r border-gray-300 w-20">Quantity</th>
                <th className="text-center py-3 px-2 text-gray-900 font-bold border-r border-gray-300 w-16">Unit</th>
                <th className="text-right py-3 px-3 text-gray-900 font-bold border-r border-gray-300 w-24">Price/Unit</th>
                <th className="text-right py-3 px-3 text-gray-900 font-bold border-r border-gray-300 w-24">Discount</th>
                <th className="text-right py-3 px-3 text-gray-900 font-bold border-r border-gray-300 w-28">Taxable<br />amount</th>
                <th className="text-right py-3 px-3 text-gray-900 font-bold border-r border-gray-300 w-24">GST</th>
                <th className="text-right py-3 px-3 text-gray-900 font-bold w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const itemTotal = Number(item.quantity) * Number(item.price);
                const itemDiscount = (itemTotal * invoice.discount) / 100;
                const itemTaxable = itemTotal - itemDiscount;
                const itemGst = (itemTaxable * invoice.taxRate) / 100;
                const itemAmount = itemTaxable + itemGst;

                return (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="py-3 px-2 text-gray-900 text-center border-r border-gray-300">{index + 1}</td>
                    <td className="py-3 px-3 text-gray-900 font-medium border-r border-gray-300">{item.name}</td>
                    <td className="py-3 px-2 text-gray-900 text-center border-r border-gray-300">{item.quantity}</td>
                    <td className="py-3 px-2 text-gray-900 text-center border-r border-gray-300">{item.unit || 'PCS'}</td>
                    <td className="py-3 px-3 text-gray-900 text-right border-r border-gray-300">{formatCurrency(item.price, business.currency)}</td>
                    <td className="py-3 px-3 text-gray-900 text-right border-r border-gray-300">
                      {formatCurrency(itemDiscount, business.currency)}<br />
                      <span className="text-xs text-gray-600">({invoice.discount}%)</span>
                    </td>
                    <td className="py-3 px-3 text-gray-900 text-right border-r border-gray-300">{formatCurrency(itemTaxable, business.currency)}</td>
                    <td className="py-3 px-3 text-gray-900 text-right border-r border-gray-300">
                      {formatCurrency(itemGst, business.currency)}<br />
                      <span className="text-xs text-gray-600">({invoice.taxRate.toFixed(1)}%)</span>
                    </td>
                    <td className="py-3 px-3 text-gray-900 text-right font-medium">{formatCurrency(itemAmount, business.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tax Summary */}
        <div className="grid grid-cols-2 border-t-2 border-gray-900">
          <div className="px-6 py-4 border-r-2 border-gray-900">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-3 border-b border-gray-300 pb-2 mb-2 text-xs font-bold text-gray-900">
              <div className="col-span-2 text-left">Tax type</div>
              <div className="col-span-4 text-right">Taxable amount</div>
              <div className="col-span-2 text-center">Rate</div>
              <div className="col-span-4 text-right">Tax amount</div>
            </div>

            {/* SGST Row */}
            <div className="grid grid-cols-12 gap-3 border-b border-gray-300 py-2 text-xs text-gray-900">
              <div className="col-span-2 text-left">SGST</div>
              <div className="col-span-4 text-right">{formatCurrency(totals.taxableAmount, business.currency)}</div>
              <div className="col-span-2 text-center">{sgstRate.toFixed(1)}%</div>
              <div className="col-span-4 text-right">{formatCurrency(sgstAmount, business.currency)}</div>
            </div>

            {/* CGST Row */}
            <div className="grid grid-cols-12 gap-3 py-2 text-xs text-gray-900">
              <div className="col-span-2 text-left">CGST</div>
              <div className="col-span-4 text-right">{formatCurrency(totals.taxableAmount, business.currency)}</div>
              <div className="col-span-2 text-center">{cgstRate.toFixed(1)}%</div>
              <div className="col-span-4 text-right">{formatCurrency(cgstAmount, business.currency)}</div>
            </div>
          </div>
          <div className="px-6 py-4">
            <p className="text-gray-900 font-bold mb-3">Amounts</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Sub Total</span>
                <span className="text-gray-900 font-medium">{formatCurrency(totals.taxableAmount, business.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Round off</span>
                <span className="text-gray-900 font-medium">{totals.roundOff >= 0 ? '' : '- '}{formatCurrency(Math.abs(totals.roundOff), business.currency)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="text-gray-900 font-bold text-base">Total</span>
                <span className="text-gray-900 font-bold text-base">{formatCurrency(totals.total, business.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 border-t-2 border-gray-900">
          <div className="px-6 py-4 border-r-2 border-gray-900">
            {/* Amount in words */}
            <div className="mb-4 pb-4 border-b border-gray-300">
              <p className="text-gray-900 font-bold mb-1">Invoice Amount In Words</p>
              <p className="text-gray-700 text-sm">{numberToWords(Math.floor(totals.total))} Rupees only</p>
            </div>

            {/* Terms and conditions */}
            <div>
              <p className="text-gray-900 font-bold mb-2">Terms and conditions</p>

              {invoice.notes && (
                <div className="mt-3 text-sm text-gray-700">
                  <p className="whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-4 flex flex-col justify-between">
            <p className="text-gray-900 text-sm">For: {business.name || 'Your Business Name'}</p>
            <div className="text-center mt-auto pt-8">
              {business.signature && (
                <div className="mb-2">
                  <img src={business.signature} alt="Signature" className="h-16 mx-auto object-contain" />
                </div>
              )}
              <div className="inline-block border-t-2 border-gray-400 pt-2 min-w-[150px]">
                <p className="text-gray-900 font-bold text-sm">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewInvoice;

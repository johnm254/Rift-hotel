const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');

// GET /api/invoices/:bookingId — download PDF invoice
router.get('/:bookingId', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('bookings').doc(req.params.bookingId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Booking not found' });
    const booking = doc.data();

    if (booking.userId !== req.user.uid && !req.user.admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const pdf = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.bookingId}.pdf`);
    pdf.pipe(res);

    // Header
    pdf.fontSize(24).font('Helvetica-Bold').fillColor('#1B2A4A').text('AZURA HAVEN', { align: 'center' });
    pdf.fontSize(10).font('Helvetica').fillColor('#C9A96E').text('Luxury Hotel & Resort', { align: 'center' });
    pdf.moveDown(0.5);
    pdf.fontSize(8).fillColor('#6B7280').text('Nairobi, Kenya | reservations@azurahaven.com', { align: 'center' });
    pdf.moveDown(1);

    // Invoice title
    pdf.fontSize(16).font('Helvetica-Bold').fillColor('#1B2A4A').text('INVOICE', { align: 'center' });
    pdf.moveDown(0.5);
    pdf.fontSize(9).font('Helvetica').fillColor('#6B7280').text(`Invoice #: INV-${req.params.bookingId.slice(0, 8).toUpperCase()}`, { align: 'center' });
    pdf.text(`Date: ${new Date().toLocaleDateString('en-KE')}`, { align: 'center' });
    pdf.moveDown(1);

    // Divider
    pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).strokeColor('#C9A96E').stroke();
    pdf.moveDown(1);

    // Booking details
    pdf.fontSize(11).font('Helvetica-Bold').fillColor('#1B2A4A').text('Booking Details');
    pdf.moveDown(0.5);
    const details = [
      ['Guest Name', booking.userName],
      ['Email', booking.userEmail],
      ['Room', booking.roomName],
      ['Check-in', booking.checkIn],
      ['Check-out', booking.checkOut],
      ['Guests', booking.guests.toString()],
      ['Status', booking.status.toUpperCase()],
      ['Payment', (booking.paymentStatus || 'pending').toUpperCase()],
    ];
    details.forEach(([label, value]) => {
      pdf.fontSize(9).font('Helvetica').fillColor('#6B7280').text(label, 50, pdf.y, { continued: true, width: 150 });
      pdf.font('Helvetica-Bold').fillColor('#1B2A4A').text(value, { align: 'right' });
    });
    pdf.moveDown(1);

    // Divider
    pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).strokeColor('#C9A96E').stroke();
    pdf.moveDown(1);

    // Total
    pdf.fontSize(12).font('Helvetica-Bold').fillColor('#6B7280').text('TOTAL', 50, pdf.y, { continued: true, width: 400 });
    pdf.fontSize(16).fillColor('#C9A96E').text(`KES ${booking.totalPrice?.toLocaleString()}`, { align: 'right' });
    pdf.moveDown(2);

    // Footer
    pdf.fontSize(7).font('Helvetica').fillColor('#9CA3AF').text('Thank you for choosing Azura Haven. This is a computer-generated invoice.', { align: 'center' });
    pdf.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

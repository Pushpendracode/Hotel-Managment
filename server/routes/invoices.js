const express = require("express");
const router = express.Router();

const Invoice = require("../models/Invoice");
const Resident = require("../models/Resident");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const { sendEmail } = require("../utils/email");
const { verifyToken, checkRole } = require("../middleware/auth");

// ===============================
// GET ALL INVOICES
// ===============================
router.get("/", verifyToken, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "resident") {
      const resident = await Resident.findOne({
        email: req.user.email,
      });

      if (!resident) {
        return res.json([]);
      }

      filter.residentId = resident._id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const invoices = await Invoice.find(filter)
      .populate("residentId", "name email roomId")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// ===============================
// GENERATE INVOICE
// ===============================
router.post(
  "/generate",
  verifyToken,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const {
        residentId,
        lineItems,
        discount,
        lateFee,
        dueDate,
      } = req.body;

      const subtotal = lineItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );

      const total =
        subtotal -
        Number(discount || 0) +
        Number(lateFee || 0);

      const invoice = await Invoice.create({
        residentId,
        lineItems,
        discount,
        lateFee,
        total,
        dueDate,
        status: "pending",
      });

      const populated = await invoice.populate(
        "residentId",
        "name email"
      );
// Send response immediately
res.status(201).json(populated);

      // Send Email
      if (populated.residentId?.email) {
        try {
          await sendEmail({
            to: populated.residentId.email,
            subject: "New Invoice Generated - HostelPro",
            html: `
              <h2>Hello ${populated.residentId.name},</h2>

              <p>Your invoice has been generated successfully.</p>

              <p><strong>Total Amount:</strong> ₹${total}</p>

              <p><strong>Due Date:</strong> ${new Date(
                dueDate
              ).toLocaleDateString("en-IN")}</p>

              <p>Please login to HostelPro to view and pay your invoice.</p>

              <br>

              <p>Regards,<br>HostelPro Team</p>
            `,
          });

          console.log("Invoice email sent.");
        } catch (emailErr) {
          console.log("Email Error:", emailErr.message);
        }
      }

      res.status(201).json(populated);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// ===============================
// PAY INVOICE
// ===============================
router.post("/:id/pay", verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (req.user.role === "resident") {
      const resident = await Resident.findOne({
        email: req.user.email,
      });

      if (
        !resident ||
        invoice.residentId.toString() !== resident._id.toString()
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    }

    const { amount, method } = req.body;

    invoice.paymentHistory.push({
      amount,
      method,
      paidAt: new Date(),
    });

    const totalPaid = invoice.paymentHistory.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    invoice.status =
      totalPaid >= invoice.total ? "paid" : "partial";

    await invoice.save();

    res.json(invoice);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// ===============================
// DELETE INVOICE
// ===============================
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      await Invoice.findByIdAndDelete(req.params.id);

      res.json({
        message: "Invoice deleted successfully",
      });
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

// ===============================
// CREATE RAZORPAY ORDER
// ===============================
router.post("/:id/create-order", verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: invoice.total * 100,
      currency: "INR",
      receipt: `invoice_${invoice._id}`,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// ===============================
// VERIFY PAYMENT
// ===============================
router.post("/:id/verify-payment", verifyToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_order_id + "|" + razorpay_payment_id
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    invoice.paymentHistory.push({
      amount: invoice.total,
      method: "razorpay",
      paymentId: razorpay_payment_id,
      paidAt: new Date(),
    });

    invoice.status = "paid";

    await invoice.save();

    res.json({
      message: "Payment verified successfully",
      invoice,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;
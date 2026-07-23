const express = require("express");
const router = express.Router();

const Invoice = require("../models/Invoice");
const Resident = require("../models/Resident");
const User = require("../models/User");

const Razorpay = require("razorpay");
const crypto = require("crypto");

const { sendEmail } = require("../utils/email");
const { notify } = require("../utils/notify");
const { verifyToken, checkRole } = require("../middleware/auth");


// ==========================================
// Helper Function
// ==========================================
const buildInvoiceEmail = (name, total, dueDate) => {
  return `
      <h2>Hello ${name},</h2>

      <p>Your invoice has been generated successfully.</p>

      <p><strong>Total Amount:</strong> ₹${total}</p>

      <p><strong>Due Date:</strong> ${new Date(
        dueDate
      ).toLocaleDateString("en-IN")}</p>

      <br>

      <p>Please login to HostelPro to view and pay your invoice.</p>

      <br>

      <p>Regards,<br/>HostelPro Team</p>
    `;
};


// ==========================================
// GET ALL INVOICES
// ==========================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const filter = {};

    // Resident can only view their own invoices
    if (req.user.role === "resident") {

      const resident = await Resident.findOne({
        email: req.user.email,
      })
        .select("_id")
        .lean();

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
      .sort({ createdAt: -1 })
      .lean();

    res.json(invoices);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message,
    });

  }
});

// ==========================================
// GENERATE INVOICE
// ==========================================
router.post(
  "/generate",
  verifyToken,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const {
        residentId,
        lineItems = [],
        discount = 0,
        lateFee = 0,
        dueDate,
      } = req.body;

      // ===========================
      // Validation
      // ===========================
      if (!residentId) {
        return res.status(400).json({
          message: "Resident is required.",
        });
      }

      if (!lineItems.length) {
        return res.status(400).json({
          message: "Invoice must contain at least one item.",
        });
      }

      if (!dueDate) {
        return res.status(400).json({
          message: "Due date is required.",
        });
      }

      // Don't allow past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);

      if (due < today) {
        return res.status(400).json({
          message: "Due date cannot be in the past.",
        });
      }

      // ===========================
      // Resident
      // ===========================
      const resident = await Resident.findById(residentId)
        .select("name email")
        .lean();

      if (!resident) {
        return res.status(404).json({
          message: "Resident not found.",
        });
      }

      // ===========================
      // Prevent duplicate invoice
      // (same resident + same month)
      // ===========================
      const startMonth = new Date(due.getFullYear(), due.getMonth(), 1);

      const endMonth = new Date(
        due.getFullYear(),
        due.getMonth() + 1,
        1
      );

      const existing = await Invoice.findOne({
        residentId,
        dueDate: {
          $gte: startMonth,
          $lt: endMonth,
        },
      }).lean();

      if (existing) {
        return res.status(400).json({
          message: "Invoice already exists for this month.",
        });
      }

      // ===========================
      // Calculate Total
      // ===========================
      const subtotal = lineItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

      const total =
        subtotal -
        Number(discount) +
        Number(lateFee);

      // ===========================
      // Create Invoice
      // ===========================
      const invoice = await Invoice.create({
        residentId,
        lineItems,
        discount,
        lateFee,
        total,
        dueDate,
        status: "pending",
      });

      // Return response immediately
      res.status(201).json(invoice);

      // ======================================
      // Background Email (Doesn't slow API)
      // ======================================
      if (resident.email) {
        sendEmail({
          to: resident.email,
          subject: "New Invoice Generated - HostelPro",
          html: buildInvoiceEmail(
            resident.name,
            total,
            dueDate
          ),
        }).catch((err) => {
          console.log("Email Error:", err.message);
        });
      }

      // ======================================
      // Background Notification
      // ======================================
      User.findOne({
        email: resident.email,
      })
        .select("_id")
        .lean()
        .then((user) => {
          if (!user) return;

          return notify({
            title: "New Invoice Generated",
            message: `An invoice of ₹${total} has been generated and is due on ${new Date(
              dueDate
            ).toLocaleDateString("en-IN")}.`,
            type: "billing",
            userId: user._id,
            relatedId: invoice._id,
          });
        })
        .catch(console.error);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: err.message,
      });

    }
  }
);

// ==========================================
// PAY INVOICE
// ==========================================
router.post("/:id/pay", verifyToken, async (req, res) => {
  try {
    const { amount, method } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // Resident can only pay their own invoice
    if (req.user.role === "resident") {
      const resident = await Resident.findOne({
        email: req.user.email,
      })
        .select("_id")
        .lean();

      if (
        !resident ||
        invoice.residentId.toString() !== resident._id.toString()
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    }

    // Prevent overpayment
    const totalPaid = invoice.paymentHistory.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const remainingAmount = invoice.total - totalPaid;

    if (Number(amount) > remainingAmount) {
      return res.status(400).json({
        message: `Maximum payable amount is ₹${remainingAmount}`,
      });
    }

    invoice.paymentHistory.push({
      amount: Number(amount),
      method,
      paidAt: new Date(),
    });

    const updatedTotal = invoice.paymentHistory.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    if (updatedTotal >= invoice.total) {
      invoice.status = "paid";
    } else {
      invoice.status = "partial";
    }

    await invoice.save();

    res.json(invoice);

    // Background Notification
    Resident.findById(invoice.residentId)
      .select("name")
      .lean()
      .then((resident) => {
        return notify({
          title: "Payment Received",
          message: `₹${amount} received from ${
            resident?.name || "Resident"
          }. Invoice status: ${invoice.status}.`,
          type: "billing",
          roles: ["admin", "staff"],
          relatedId: invoice._id,
        });
      })
      .catch(console.error);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
});


// ==========================================
// DELETE INVOICE
// ==========================================
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {

      const invoice = await Invoice.findById(req.params.id);

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      await invoice.deleteOne();

      res.json({
        success: true,
        message: "Invoice deleted successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message: err.message,
      });

    }
  }
);

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================
router.post("/:id/create-order", verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    // Prevent creating order for paid invoice
    if (invoice.status === "paid") {
      return res.status(400).json({
        message: "Invoice already paid",
      });
    }

    const totalPaid = (invoice.paymentHistory || []).reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const remainingAmount = invoice.total - totalPaid;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        message: "Nothing left to pay",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: remainingAmount * 100,
      currency: "INR",
      receipt: `invoice_${invoice._id}`,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
});


// ==========================================
// VERIFY PAYMENT
// ==========================================
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

    // Prevent duplicate payment
    const alreadyPaid = invoice.paymentHistory.some(
      (payment) => payment.paymentId === razorpay_payment_id
    );

    if (alreadyPaid) {
      return res.status(400).json({
        message: "Payment already verified",
      });
    }

    const totalPaid = invoice.paymentHistory.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const remainingAmount = invoice.total - totalPaid;

    invoice.paymentHistory.push({
      amount: remainingAmount,
      method: "razorpay",
      paymentId: razorpay_payment_id,
      paidAt: new Date(),
    });

    invoice.status = "paid";

    await invoice.save();

    res.json({
      success: true,
      message: "Payment verified successfully",
      invoice,
    });

    // Background notification
    Resident.findById(invoice.residentId)
      .select("name")
      .lean()
      .then((resident) => {
        return notify({
          title: "Online Payment Received",
          message: `₹${remainingAmount} paid successfully by ${
            resident?.name || "Resident"
          }.`,
          type: "billing",
          roles: ["admin", "staff"],
          relatedId: invoice._id,
        });
      })
      .catch(console.error);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;
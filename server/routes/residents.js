const express = require("express");
const router = express.Router();

const Resident = require("../models/Resident");
const Room = require("../models/Room");
const User = require("../models/User");

const { verifyToken, checkRole } = require("../middleware/auth");
const { sendEmail } = require("../utils/email");


router.get(
  "/",
  verifyToken,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const residents = await Resident.find()
        .populate("roomId", "number floor type price")
        .sort({ createdAt: -1 });

      res.json(residents);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

router.get("/me", verifyToken, async (req, res) => {
  try {
    const resident = await Resident.findOne({
      email: req.user.email,
    }).populate("roomId", "number floor type price");

    if (!resident) {
      return res.status(404).json({
        message: "Resident not found",
      });
    }

    res.json(resident);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get(
  "/:id",
  verifyToken,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const resident = await Resident.findById(req.params.id)
        .populate("roomId", "number floor type price");

      if (!resident) {
        return res.status(404).json({
          message: "Resident not found",
        });
      }

      res.json(resident);
    } catch (err) {
      res.status(500).json({
        message: err.message,
      });
    }
  }
);

router.post(
  "/",
  verifyToken,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const {
        roomId,
        name,
        email,
        phone,
        gender,
        dob,
        address,
        guardianName,
        guardianPhone,
        emergencyContact,
        idProof,
        rent,
        deposit,
        checkIn,
      } = req.body;

      // Check Room
      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json({
          message: "Room not found",
        });
      }

      if (room.status === "occupied") {
        return res.status(400).json({
          message: "Room is already occupied",
        });
      }

      // Check User
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      // Default Password
      const defaultPassword = phone || "resident123";

      // Create Login User
      const user = new User({
        name,
        email,
        password: defaultPassword,
        phone,
        role: "resident",
      });

      await user.save();

      // Create Resident
      const resident = await Resident.create({
        userId: user._id,
        roomId,
        name,
        email,
        phone,
        gender,
        dob,
        address,
        guardianName,
        guardianPhone,
        emergencyContact,
        idProof,
        rent,
        deposit,
        checkIn,
        status: "active",
      });

      // Link User -> Resident
      user.residentId = resident._id;
      await user.save();

      // Update Room
      room.status = "occupied";
      room.residentId = resident._id;
      await room.save();

      // Send Welcome Email
      try {
        await sendEmail({
          to: email,
          subject: "Welcome to HostelPro",
          html: `
            <h2>Hello ${name},</h2>

            <p>Your HostelPro account has been created successfully.</p>

            <table border="1" cellpadding="8" cellspacing="0">
              <tr>
                <td><b>Name</b></td>
                <td>${name}</td>
              </tr>

              <tr>
                <td><b>Email</b></td>
                <td>${email}</td>
              </tr>

              <tr>
                <td><b>Password</b></td>
                <td>${defaultPassword}</td>
              </tr>

              <tr>
                <td><b>Room Number</b></td>
                <td>${room.number}</td>
              </tr>
            </table>

            <br>

            <p>Please change your password after your first login.</p>

            <br>

            <b>HostelPro Team</b>
          `,
        });

        console.log("Welcome Email Sent");
      } catch (emailErr) {
        console.log(emailErr.message);
      }

      res.status(201).json({
        success: true,
        message: "Resident Added Successfully",
        resident,
        login: {
          email,
          password: defaultPassword,
        },
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// UPDATE RESIDENT
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const resident = await Resident.findById(req.params.id);

      if (!resident) {
        return res.status(404).json({
          message: "Resident not found",
        });
      }

      const oldRoomId = resident.roomId?.toString();
      const newRoomId = req.body.roomId;

      // Change Room
      if (newRoomId && oldRoomId !== newRoomId) {

        const newRoom = await Room.findById(newRoomId);

        if (!newRoom) {
          return res.status(404).json({
            message: "New room not found",
          });
        }

        if (newRoom.status === "occupied") {
          return res.status(400).json({
            message: "Selected room is already occupied",
          });
        }

        // Free old room
        if (oldRoomId) {
          await Room.findByIdAndUpdate(oldRoomId, {
            status: "vacant",
            residentId: null,
          });
        }

        // Occupy new room
        newRoom.status = "occupied";
        newRoom.residentId = resident._id;
        await newRoom.save();
      }

      // Update Resident
      const updatedResident = await Resident.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      ).populate("roomId", "number floor type price");

      // Update User
      await User.findOneAndUpdate(
        { email: resident.email },
        {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
        }
      );

      res.json({
        success: true,
        message: "Resident updated successfully",
        resident: updatedResident,
      });

    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// CHECKOUT RESIDENT
router.put(
  "/:id/checkout",
  verifyToken,
  checkRole(["admin", "staff"]),
  async (req, res) => {
    try {
      const resident = await Resident.findById(req.params.id);

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: "Resident not found",
        });
      }

      // Free Room
      if (resident.roomId) {
        await Room.findByIdAndUpdate(resident.roomId, {
          status: "vacant",
          residentId: null,
        });
      }

      // Update Resident
      resident.status = "checkedout";
      resident.checkOut = new Date();
      resident.roomId = null;

      await resident.save();

      // Disable Login
      await User.findOneAndUpdate(
        { email: resident.email },
        {
          isActive: false,
        }
      );

      // Send Checkout Email
      try {
        await sendEmail({
          to: resident.email,
          subject: "Checkout Successful - HostelPro",
          html: `
            <h2>Hello ${resident.name},</h2>

            <p>Your checkout has been completed successfully.</p>

            <p>Thank you for staying with us.</p>

            <br>

            <b>HostelPro Team</b>
          `,
        });

        console.log("Checkout Email Sent");
      } catch (emailErr) {
        console.log(emailErr.message);
      }

      res.json({
        success: true,
        message: "Resident checked out successfully",
      });

    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// DELETE RESIDENT
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const resident = await Resident.findById(req.params.id);

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: "Resident not found",
        });
      }

      // Free Room
      if (resident.roomId) {
        await Room.findByIdAndUpdate(resident.roomId, {
          status: "vacant",
          residentId: null,
        });
      }

      // Delete Login User
      await User.findOneAndDelete({
        email: resident.email,
      });

      // Delete Resident
      await Resident.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Resident deleted successfully",
      });

    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

module.exports = router;
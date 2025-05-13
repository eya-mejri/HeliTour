const cron = require('node-cron');
const Reservation = require('../models/reservation');
const Voyageur = require('../models/voyageur');
const { sendEmail } = require('./emailService');

// Calculate payment deadline (72 hours after reservation)
function getPaymentDeadline(reservation) {
  const deadline = new Date(reservation.Date_Reservation);
  deadline.setHours(deadline.getHours() + 72);
  return deadline;
}

// Run the task every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    const now = new Date();

    // 1. Get all pending reservations and populate voyageurs
    const pendingReservations = await Reservation.find({ Status: "en attente" })
      .populate({ path: 'voyageurs', model: 'voyageur' });

    for (const reservation of pendingReservations) {
      const deadline = getPaymentDeadline(reservation);
      const reminderTime = new Date(deadline);
      reminderTime.setHours(reminderTime.getHours() - 24);

      const voyageur = Array.isArray(reservation.voyageurs) ? reservation.voyageurs[0] : null;
      if (!voyageur || !voyageur.email) continue;

      // 2. Send 24-hour reminder
      if (
        now >= reminderTime &&
        now < deadline &&
        !reservation.reminderSent
      ) {
        await sendEmail(
          voyageur.email,
          "Payment Reminder: 24 Hours Left!",
          `Your reservation (${reservation.Num_Reservation}) will expire on ${deadline.toLocaleString()}. Please complete your payment.`
        );
        reservation.reminderSent = true;
        await reservation.save();
      }

      // 3. Cancel reservation if past deadline
      if (now >= deadline && reservation.Status === "en attente") {
        reservation.Status = "annulé";
        await reservation.save();

        await sendEmail(
          voyageur.email,
          "Reservation Cancelled",
          `Your reservation (${reservation.Num_Reservation}) has been automatically cancelled due to non-payment.`
        );
      }
    }
  } catch (err) {
    console.error("Error in cron job:", err);
  }
});

import axios from 'axios'

const BASE_URL = 'https://graph.facebook.com/v18.0'

async function sendMessage(to, message) {
  if (process.env.WHATSAPP_ENABLED !== 'true') {
    console.log(`[WHATSAPP MOCK] To: ${to}\n${message}`)
    return true
  }

  try {
    const phone = to.startsWith('91') ? to : `91${to}`
    await axios.post(
      `${BASE_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log(`[WHATSAPP] Sent to ${phone}`)
    return true
  } catch (e) {
    console.error('[WHATSAPP ERROR]', e.response?.data || e.message)
    return false
  }
}

export async function sendOrderConfirmation(phone, order, tableId) {
  const items = order.orderItems?.map(oi =>
    `  • ${oi.menuItem?.name} × ${oi.quantity} — ₹${(Number(oi.price) * oi.quantity).toFixed(0)}`
  ).join('\n')

  const message = `🍛 *Spice Garden*
━━━━━━━━━━━━━━━
✅ *Order Confirmed!*

📋 Order ID: #${order.id?.slice(0, 8).toUpperCase()}
🪑 Table: ${tableId}
👤 Name: ${order.customerName}

*Your Order:*
${items}

━━━━━━━━━━━━━━━
💰 Subtotal: ₹${(Number(order.totalAmount) - Number(order.taxAmount)).toFixed(0)}
🧾 GST (5%): ₹${Number(order.taxAmount).toFixed(0)}
💳 *Total: ₹${Number(order.totalAmount).toFixed(0)}*
━━━━━━━━━━━━━━━

⏱️ Estimated wait: *15-20 mins*
Track your order: ${process.env.FRONTEND_URL}/track/${order.id}

Thank you for dining with us! 🙏`

  return sendMessage(phone, message)
}

export async function sendOrderReady(phone, order, tableId) {
  const message = `🍛 *Spice Garden*
━━━━━━━━━━━━━━━
🎉 *Your Order is Ready!*

📋 Order: #${order.id?.slice(0, 8).toUpperCase()}
🪑 Table: ${tableId}

Your food is ready to be served! 🍽️

Enjoy your meal! 😊`

  return sendMessage(phone, message)
}

export async function sendReservationConfirmation(phone, reservation) {
  const timeMap = {
    '12:00':'12:00 PM','12:30':'12:30 PM','13:00':'1:00 PM',
    '13:30':'1:30 PM','14:00':'2:00 PM','14:30':'2:30 PM',
    '19:00':'7:00 PM','19:30':'7:30 PM','20:00':'8:00 PM',
    '20:30':'8:30 PM','21:00':'9:00 PM'
  }

  const date = new Date(reservation.date + 'T00:00:00')
    .toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const message = `🍛 *Spice Garden*
━━━━━━━━━━━━━━━
📅 *Reservation Confirmed!*

👤 Name: ${reservation.name}
📅 Date: ${date}
⏰ Time: ${timeMap[reservation.time] || reservation.time}
👥 Guests: ${reservation.guests}
🪑 Table: ${reservation.tableId}
📋 Booking ID: #${reservation.id?.slice(0, 8).toUpperCase()}

${reservation.note ? `📝 Note: ${reservation.note}\n` : ''}
━━━━━━━━━━━━━━━
We look forward to seeing you! 🙏

_Spice Garden — AI-Powered Dining_`

  return sendMessage(phone, message)
}

export async function sendOrderCancellation(phone, order) {
  const message = `🍛 *Spice Garden*
━━━━━━━━━━━━━━━
❌ *Order Cancelled*

📋 Order: #${order.id?.slice(0, 8).toUpperCase()}
💰 Amount: ₹${Number(order.totalAmount).toFixed(0)}

Your order has been cancelled successfully.
We hope to serve you again soon! 🙏`

  return sendMessage(phone, message)
}
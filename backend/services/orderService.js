// Save customer profile for cross-session memory
try {
  const { updateProfile } = await import('./customerService.js')
  const session = await prisma.session.findUnique({ where: { id: sessionId } })
  await updateProfile(
    customerPhone,
    customerName,
    subtotal,
    session?.preferences || {}
  )
} catch (e) {
  console.error('Profile save error:', e)
}
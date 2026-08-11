import { prisma } from '../db/prisma.js'
import { createHash } from 'crypto'

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

export const PERMISSIONS = {
  owner:   ['dashboard', 'orders', 'tables', 'menu', 'inventory', 'coupons', 'reservations', 'analytics', 'forecast', 'staff', 'kitchen'],
  manager: ['dashboard', 'orders', 'tables', 'menu', 'inventory', 'coupons', 'reservations', 'analytics', 'forecast', 'kitchen'],
  cashier: ['dashboard', 'orders', 'tables', 'reservations', 'kitchen'],
  kitchen: ['kitchen', 'orders'],
}

export async function loginStaff(email, password) {
  const staff = await prisma.staff.findUnique({ where: { email } })
  if (!staff || !staff.active) throw new Error('Invalid credentials')
  if (staff.password !== hashPassword(password)) throw new Error('Invalid credentials')

  await prisma.staff.update({
    where: { id: staff.id },
    data: { lastLogin: new Date() }
  })

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    permissions: PERMISSIONS[staff.role] || []
  }
}

export async function createStaff(data) {
  return prisma.staff.create({
    data: { ...data, password: hashPassword(data.password) }
  })
}

export async function getAllStaff() {
  return prisma.staff.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, lastLogin: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateStaff(id, data) {
  if (data.password) data.password = hashPassword(data.password)
  return prisma.staff.update({ where: { id }, data })
}

export async function deleteStaff(id) {
  return prisma.staff.delete({ where: { id } })
}
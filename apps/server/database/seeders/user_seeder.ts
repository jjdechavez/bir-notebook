import Role from '#models/role'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const rawRoles = [{ name: 'Admin' }, { name: 'User' }]

    const roles = await Role.fetchOrCreateMany('name', rawRoles)

    const adminEmail = 'admin@acme.com'
    const admin = await User.findBy({
      email: adminEmail,
    })

    if (!admin) {
      await User.create({
        email: adminEmail,
        password: 'admin@Acme',
        firstName: 'Admin',
        lastName: 'Acme',
        roleId: roles.find((role) => role.name === 'Admin')!.id,
      })
    }

    const userEmail = 'user@acme.com'
    const user = await User.findBy({
      email: userEmail,
    })

    if (!user) {
      await User.create({
        email: userEmail,
        password: 'user@Acme',
        firstName: 'John',
        lastName: 'Acme',
        roleId: roles.find((role) => role.name === 'User')!.id,
      })
    }
  }
}

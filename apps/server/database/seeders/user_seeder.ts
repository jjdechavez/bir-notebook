import Role from '#models/role'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const rawRoles = [{ name: 'Admin' }, { name: 'User' }]

    const roles = await Role.fetchOrCreateMany('name', rawRoles)

    const email = 'admin@acme.com'
    const admin = await User.findBy({
      email,
    })

    if (!admin) {
      await User.create({
        email,
        password: 'admin@Acme',
        firstName: 'Admin',
        lastName: 'Acme',
        roleId: roles.find((role) => role.name === 'Admin')!.id,
      })
    }
  }
}

import Invite from '#models/invite'
import User from '#models/user'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { InviteCompleteResult, InviteConfirmResult } from '@acme/shared/models/invite'
import { DateTime } from 'luxon'

@inject()
export class InviteService {
  constructor(protected ctx: HttpContext) {}

  async create(payload: Partial<Invite>) {
    return await Invite.create(payload).catch((e) =>
      this.ctx.logger.error(e, `Failed to create invite with an ${payload.email} email`)
    )
  }

  async paginate(page = 1, limit = 10, qs: Record<string, any>) {
    const search = qs?.s ? qs.s : ''
    const status = typeof qs?.status === 'string' ? qs.status.split(',') : qs.status
    const invites = await Invite.query()
      .if(search, (query) => {
        query.whereILike('email', `%${search}%`)
      })
      .if(status?.length > 0, (query) => {
        query.whereIn('status', status)
      })
      .preload('invitedBy')
      .preload('role')
      .paginate(page, limit)

    return invites
  }

  async findById(id: number) {
    return await Invite.query().where('id', id).first()
  }

  async confirm(inviteId: number, validSignature: boolean): Promise<InviteConfirmResult> {
    const invite = await this.findById(inviteId)

    if (!invite) {
      const notFoundMessage = `Invite not found with ${inviteId} ID`
      this.ctx.logger.warn({ id: inviteId }, `Confirming Invite Failed: ${notFoundMessage}`)
      return { status: 'not_found', message: notFoundMessage }
    }

    if (invite.status === 'accepted') {
      const alreadyConfirmedMessage = `Invite has already been confirmed with ${inviteId} ID`
      this.ctx.logger.warn({ id: inviteId }, `Confirming Invite Failed: ${alreadyConfirmedMessage}`)
      return { status: 'already_confirmed', message: alreadyConfirmedMessage }
    }

    if (!validSignature) {
      const expiredMessage = `Invite has already expired with ${inviteId} ID`
      this.ctx.logger.warn({ id: inviteId }, `Confirming Invite Failed: ${expiredMessage}`)

      invite.status = 'expired'
      await invite.save()

      return { status: 'expired', message: expiredMessage }
    }

    await invite.save()

    return {
      status: 'confirmed',
      message: `Invite has been confirmed with ${inviteId} ID`,
    }
  }

  async complete(
    inviteId: number,
    payload: Omit<{ firstName: string; lastName: string }, 'password_confirmation'>
  ): Promise<InviteCompleteResult> {
    const invite = await this.findById(inviteId)

    if (!invite) {
      return {
        status: 'not_found',
        message: `Failed to complete invitation: Invite not found with ${inviteId} ID`,
      }
    }

    await User.create({
      ...payload,
      roleId: invite.roleId,
      email: invite.email,
    })

    invite.status = 'accepted'
    invite.acceptedAt = DateTime.now()
    await invite.save()

    return { status: 'completed', message: 'User has been created' }
  }

  async update(inviteId: number, updateWith: Partial<Invite>) {
    const invite = await this.findById(inviteId)

    if (invite) {
      await invite
        .merge(updateWith)
        .save()
        .catch((e) => this.ctx.logger.error(e, `Failed to update invite with ${inviteId} ID`))

      return {
        status: 'updated',
        message: `Invite successfully updated with ${inviteId} ID`,
        data: invite,
      } as const
    }

    return { status: 'not_found', message: `Invite not found with ${inviteId} ID` } as const
  }
}

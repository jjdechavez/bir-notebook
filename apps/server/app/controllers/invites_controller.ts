import { InviteDto } from '#dto/invite'
import { PaginateDto } from '#dto/paginate'
import InvitePolicy from '#policies/invite_policy'
import { InviteService } from '#services/invite_service'
import env from '#start/env'
import {
  completeInviteValidator,
  createInviteValidator,
  updateInviteValidator,
} from '#validators/invite'
import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'

@inject()
export default class InvitesController {
  constructor(protected inviteService: InviteService) {}

  async store({ request, auth, response, bouncer }: HttpContext) {
    if (await bouncer.with(InvitePolicy).denies('isAdmin')) {
      return response.forbidden({ message: 'Cannot create a invite' })
    }

    const payload = await request.validateUsing(createInviteValidator)
    const created = await this.inviteService.create({ ...payload, invitedById: auth!.user!.id })
    return response.created(new InviteDto(created!).toJson())
  }

  async index({ request, bouncer }: HttpContext) {
    await bouncer.with(InvitePolicy).authorize('isAdmin')

    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const qs = request.qs()
    const invites = await this.inviteService.paginate(page, limit, qs)

    return {
      data: invites.all().map((invite) => new InviteDto(invite).toJson()),
      meta: new PaginateDto(invites.getMeta()).metaToJson(),
    }
  }

  async generateLink({ params, request, response, bouncer }: HttpContext) {
    if (await bouncer.with(InvitePolicy).denies('isAdmin')) {
      return response.forbidden({ message: 'Cannot generate invite link' })
    }
    const host = request.hostname()! || env.get('HOST')
    const beURL =
      env.get('NODE_ENV') !== 'production'
        ? `${env.get('HOST')}:${env.get('PORT')}`
        : `https://${host}`
    const link = router
      .builder()
      .prefixUrl(beURL)
      .params({ id: params.id })
      .makeSigned('invites.confirm', { expiresIn: '3 days' })

    return { link }
  }

  async confirm({ request, params, response }: HttpContext) {
    const isValidSignature = request.hasValidSignature()
    const id = params.id
    const result = await this.inviteService.confirm(id, isValidSignature)

    if (result.status !== 'confirmed') {
      return response.badRequest(result)
    }

    const feConfirmRoute = router
      .builder()
      .prefixUrl(env.get('FE_URL'))
      .disableRouteLookup()
      .params({ id: id })
      .makeSigned('/invites/:id/confirm')

    return response.redirect().toPath(feConfirmRoute)
  }

  async show({ params, response }: HttpContext) {
    const invite = await this.inviteService.findById(params.id)

    if (!invite) {
      return response.notFound({ message: `Invite not found with ${params.id} ID` })
    }

    return new InviteDto(invite).toJson()
  }

  async complete({ request, params, response }: HttpContext) {
    const payload = await request.validateUsing(completeInviteValidator)
    const result = await this.inviteService.complete(params.id, payload)

    if (result.status === 'not_found') {
      return response.notFound({ message: `Invite not found with ${params.id} ID` })
    }

    return response.created()
  }

  async update({ request, params, response, bouncer }: HttpContext) {
    if (await bouncer.with(InvitePolicy).denies('isAdmin')) {
      return response.forbidden({ message: 'Cannot update invite' })
    }

    const payload = await request.validateUsing(updateInviteValidator, {
      meta: { inviteId: params.id },
    })
    const result = await this.inviteService.update(params.id, payload)

    if (result.status === 'not_found') {
      return response.notFound({ message: result.message })
    }

    return new InviteDto(result.data).toJson()
  }
}

export type PersonalInformationInput = {
	firstName: string
	lastName: string
	email: string
}

export type ChangePasswordInput = {
	currentPassword: string
	newPassword: string
	newPassword_confirmation: string
}

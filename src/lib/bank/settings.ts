export type BankSettingsInput = {
  bankName?: string
  contactEmail?: string
  country?: string
  tagline?: string
}

export function normalizeBankSettingsInput(input: BankSettingsInput) {
  const bankName = input.bankName?.trim() || ''
  const contactEmail = input.contactEmail?.trim() || ''
  const country = input.country?.trim() || ''
  const tagline = input.tagline?.trim() || ''

  return {
    bankName,
    contactEmail,
    country,
    tagline,
  }
}

export function validateBankSettingsInput(input: BankSettingsInput) {
  const normalized = normalizeBankSettingsInput(input)
  const isValid = Boolean(normalized.bankName && normalized.contactEmail && normalized.country)

  return {
    isValid,
    normalized,
  }
}

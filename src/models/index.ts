// src/models/index.ts
// All Mongoose schemas and models for BizReady

import mongoose, { Schema, model, models, Document } from 'mongoose'

// ── TENANT (BANK) ─────────────────────────────────────────
const ThemeSchema = new Schema({
  primary:      { type: String, required: true },
  primaryLight: { type: String, required: true },
  primaryDark:  { type: String, required: true },
  accent:       { type: String, required: true },
  fontFamily:   { type: String, default: 'Inter' },
  logoUrl:      { type: String },
  bankName:     { type: String, required: true },
  abbreviation: { type: String, required: true },
  tagline:      { type: String },
}, { _id: false })

const TenantSchema = new Schema({
  slug:                   { type: String, required: true, unique: true, lowercase: true },
  name:                   { type: String, required: true },
  theme:                  { type: ThemeSchema, required: true },
  plan:                   { type: String, enum: ['starter','growth','enterprise','owner'], default: 'starter' },
  clerkOrgId:             { type: String, sparse: true, unique: true },
  stripeCustomerId:       { type: String },
  stripeSubscriptionId:   { type: String },
  country:                { type: String, default: 'Sierra Leone' },
  region:                 { type: String, default: 'West Africa' },
  contactEmail:           { type: String, required: true },
  submissionsThisMonth:   { type: Number, default: 0 },
  totalSubmissions:       { type: Number, default: 0 },
  isActive:               { type: Boolean, default: true },
}, { timestamps: true })

// ── USER ──────────────────────────────────────────────────
const UserSchema = new Schema({
  clerkId:    { type: String, required: true, unique: true },
  email:      { type: String, required: true },
  name:       { type: String, required: true },
  role:       { type: String, enum: ['platform_admin','bank_admin','bank_staff','sme'], required: true },
  tenantId:   { type: Schema.Types.ObjectId, ref: 'Tenant' },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business' },
}, { timestamps: true })

// ── BUSINESS (SME) ────────────────────────────────────────
const BusinessSchema = new Schema({
  tenantId:                { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId:                  { type: String, required: true },  // Clerk ID
  name:                    { type: String, required: true },
  ceoName:                 { type: String, required: true },
  email:                   { type: String, required: true },
  phone:                   { type: String },
  sector:                  { type: String, required: true },
  yearsOperating:          { type: String },
  employeeCount:           { type: String },
  annualRevenue:           { type: String },
  loanPurpose:             { type: String },
  location:                { type: String },
  country:                 { type: String, default: 'Sierra Leone' },
  diagnostics:             [{ type: Schema.Types.ObjectId, ref: 'Diagnostic' }],
  latestScore:             { type: Number },
  latestClassification:    { type: String },
  taStatus:                { type: String, enum: ['none','active','completed'], default: 'none' },
  bankRelationshipManager: { type: String },
}, { timestamps: true })

// ── QUESTION BANK ─────────────────────────────────────────
const AnswerOptionSchema = new Schema({
  text:  { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 20 },
}, { _id: false })

const QuestionSchema = new Schema({
  sectionId:  { type: Schema.Types.ObjectId, required: true },
  text:       { type: String, required: true },
  hint:       { type: String },
  type:       { type: String, enum: ['mcq','scale','yesno','text'], required: true },
  options:    [AnswerOptionSchema],
  order:      { type: Number, required: true },
  isRequired: { type: Boolean, default: true },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

const DiagnosticSectionSchema = new Schema({
  name:          { type: String, required: true },
  description:   { type: String },
  capacityLevel: { type: String, enum: ['strategic','operational','support','info','final'], required: true },
  weight:        { type: Number, required: true, min: 0, max: 1 },  // e.g. 0.30
  maxPoints:     { type: Number, required: true },
  order:         { type: Number, required: true },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true })

// ── DIAGNOSTIC SUBMISSION ─────────────────────────────────
const DiagnosticResponseSchema = new Schema({
  questionId:     { type: String, required: true },
  questionText:   { type: String, required: true },
  selectedOption: { type: String, required: true },
  score:          { type: Number, required: true },
}, { _id: false })

const CapacityScoreSchema = new Schema({
  level:                { type: String, required: true },
  rawScore:             { type: Number, required: true },
  maxScore:             { type: Number, required: true },
  percentage:           { type: Number, required: true },
  weight:               { type: Number, required: true },
  weightedContribution: { type: Number, required: true },
}, { _id: false })

const TARecommendationSchema = new Schema({
  area:            { type: String, required: true },
  capacityLevel:   { type: String, required: true },
  currentScore:    { type: Number, required: true },
  targetScore:     { type: Number, required: true },
  recommendation:  { type: String, required: true },
  tools:           [String],
  timeframeWeeks:  { type: Number, required: true },
  priority:        { type: String, enum: ['critical','high','medium','low'], required: true },
}, { _id: false })

const LendabilityResultSchema = new Schema({
  lendabilityIndex:         { type: Number, required: true },
  classification:           { type: String, enum: ['investment_ready','conditionally_lendable','high_risk'], required: true },
  strategic:                { type: CapacityScoreSchema, required: true },
  operational:              { type: CapacityScoreSchema, required: true },
  support:                  { type: CapacityScoreSchema, required: true },
  bottleneck:               { type: String, required: true },
  projectedIndexAfterTA:    { type: Number },
  taRecommendations:        [TARecommendationSchema],
}, { _id: false })

const DiagnosticSchema = new Schema({
  tenantId:         { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  businessId:       { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  userId:           { type: String, required: true },
  period:           { type: String, required: true },  // e.g. 'Q2-2025'
  responses:        [DiagnosticResponseSchema],
  result:           { type: LendabilityResultSchema },
  status:           { type: String, enum: ['draft','submitted','scored','reported'], default: 'draft' },
  emailSent:        { type: Boolean, default: false },
  reportGenerated:  { type: Boolean, default: false },
  submittedAt:      { type: Date },
  scoredAt:         { type: Date },
}, { timestamps: true })

// ── TA PROGRAMME ──────────────────────────────────────────
const TAProgrammeSchema = new Schema({
  tenantId:        { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  businessId:      { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  diagnosticId:    { type: Schema.Types.ObjectId, ref: 'Diagnostic', required: true },
  area:            { type: String, required: true },
  capacityLevel:   { type: String, required: true },
  recommendation:  { type: String, required: true },
  tools:           [String],
  timeframeWeeks:  { type: Number, required: true },
  startDate:       { type: Date },
  completedDate:   { type: Date },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  status:          { type: String, enum: ['upcoming','active','completed','paused'], default: 'upcoming' },
  notes:           { type: String },
  assignedBy:      { type: String, required: true },
}, { timestamps: true })

// Index for tenant-scoped queries (critical for multi-tenancy)
DiagnosticSchema.index({ tenantId: 1, businessId: 1, createdAt: -1 })
DiagnosticSchema.index({ tenantId: 1, 'result.classification': 1 })
BusinessSchema.index({ tenantId: 1, email: 1 })
TAProgrammeSchema.index({ tenantId: 1, businessId: 1 })

// Export models (with singleton pattern for Next.js hot-reload)
export const Tenant           = models.Tenant           || model('Tenant', TenantSchema)
export const User             = models.User             || model('User', UserSchema)
export const Business         = models.Business         || model('Business', BusinessSchema)
export const Question         = models.Question         || model('Question', QuestionSchema)
export const DiagnosticSection = models.DiagnosticSection || model('DiagnosticSection', DiagnosticSectionSchema)
export const Diagnostic       = models.Diagnostic       || model('Diagnostic', DiagnosticSchema)
export const TAProgramme      = models.TAProgramme      || model('TAProgramme', TAProgrammeSchema)

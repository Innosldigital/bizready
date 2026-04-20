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

const ScoringWeightsSchema = new Schema({
  strategic: { type: Number, required: true, min: 0, max: 1, default: 0.30 },
  process:   { type: Number, required: true, min: 0, max: 1, default: 0.45 },
  support:   { type: Number, required: true, min: 0, max: 1, default: 0.25 },
}, { _id: false })

const TenantSchema = new Schema({
  slug:                   { type: String, required: true, unique: true, lowercase: true },
  name:                   { type: String, required: true },
  theme:                  { type: ThemeSchema, required: true },
  plan:                   { type: String, enum: ['starter','growth','enterprise','owner'], default: 'starter' },
  clerkOrgId:             { type: String },
  stripeCustomerId:       { type: String },
  stripeSubscriptionId:   { type: String },
  country:                { type: String, default: 'Sierra Leone' },
  region:                 { type: String, default: 'West Africa' },
  contactEmail:           { type: String, required: true },
  submissionsThisMonth:   { type: Number, default: 0 },
  totalSubmissions:       { type: Number, default: 0 },
  isActive:               { type: Boolean, default: true },
  scoringWeights:         { type: ScoringWeightsSchema, default: () => ({ strategic: 0.30, process: 0.45, support: 0.25 }) },
  customDomain:           { type: String },
  successManagerId:       { type: String },        // clerkId of the assigned platform_admin
  successManagerName:     { type: String },
  successManagerEmail:    { type: String },
  onboardingSteps:        { type: [String], default: [] },  // completed step keys
  taProvider:             { type: String, enum: ['innovation_sl', 'self'], default: 'self' },
}, { timestamps: true })

// ── USER ──────────────────────────────────────────────────
const UserSchema = new Schema({
  clerkId:      { type: String, required: true, unique: true },
  email:        { type: String, required: true },
  name:         { type: String, required: true },
  role:         {
    type: String,
    enum: [
      'platform_admin','innosl_admin','focal_person','project_manager','external_viewer',
      'bank_admin','bank_staff','sme',
    ],
    required: true,
  },
  tenantId:     { type: Schema.Types.ObjectId, ref: 'Tenant' },
  businessId:   { type: Schema.Types.ObjectId, ref: 'Business' },
  assignedSMEs: [{ type: Schema.Types.ObjectId, ref: 'Business' }],
  jobTitle:     { type: String },
  isActive:     { type: Boolean, default: true },
  isPending:    { type: Boolean, default: false },
}, { timestamps: true })

// ── BUSINESS (SME) ────────────────────────────────────────
const BusinessSchema = new Schema({
  tenantId:                { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId:                  { type: String, required: true },
  name:                    { type: String, required: true },
  ceoName:                 { type: String, required: true },
  email:                   { type: String, required: true },
  phone:                   { type: String },
  sector:                  { type: String, required: true },
  yearsOperating:          { type: String },
  employeeCount:           { type: String },
  femaleEmployeeCount:     { type: String },
  annualRevenue:           { type: String },
  loanPurpose:             { type: String },
  location:                { type: String },
  district:                { type: String },
  country:                 { type: String, default: 'Sierra Leone' },
  problemSolving:          { type: String },
  proposedSolution:        { type: String },
  foundingDate:            { type: String },
  registrationStatus:      { type: String },
  diagnostics:             [{ type: Schema.Types.ObjectId, ref: 'Diagnostic' }],
  latestScore:             { type: Number },
  latestClassification:    { type: String },
  taStatus:                { type: String, enum: ['none','active','completed'], default: 'none' },
  bankRelationshipManager: { type: String },
  focalPersonId:           { type: Schema.Types.ObjectId, ref: 'User', default: null },
  focalPersonName:         { type: String },
}, { timestamps: true })

// ── QUESTION BANK ─────────────────────────────────────────
const AnswerOptionSchema = new Schema({
  text:  { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 10 },
}, { _id: false })

const QuestionSchema = new Schema({
  sectionId:      { type: Schema.Types.ObjectId, required: true },
  text:           { type: String, required: true },
  hint:           { type: String },
  type:           { type: String, enum: ['mcq','scale','yesno','text'], required: true },
  options:        [AnswerOptionSchema],
  order:          { type: Number, required: true },
  isRequired:     { type: Boolean, default: true },
  isActive:       { type: Boolean, default: true },
  areaId:         { type: String },
  parameterId:    { type: String },
  source:         { type: String, enum: ['platform','tenant'], default: 'platform' },
  tenantId:       { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
  questionSetId:  { type: Schema.Types.ObjectId, ref: 'QuestionSet', default: null },
}, { timestamps: true })

const DiagnosticSectionSchema = new Schema({
  name:          { type: String, required: true },
  description:   { type: String },
  capacityLevel: {
    type: String,
    enum: ['strategic','process','operational','support','info','final'],
    required: true,
  },
  weight:        { type: Number, required: true, min: 0, max: 1 },
  maxPoints:     { type: Number, required: true },
  order:         { type: Number, required: true },
  isActive:      { type: Boolean, default: true },
  areaId:        { type: String },
  areaNumber:    { type: Number },
  source:        { type: String, enum: ['platform','tenant'], default: 'platform' },
  tenantId:      { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
}, { timestamps: true })

// ── QUESTION SET (admin-created groups assignable to tenants) ─
const QuestionSetSchema = new Schema({
  name:        { type: String, required: true },
  description: { type: String },
  tenantIds:   [{ type: Schema.Types.ObjectId, ref: 'Tenant' }],
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: String, required: true },
}, { timestamps: true })

// ── DIAGNOSTIC SUBMISSION ─────────────────────────────────
const DiagnosticResponseSchema = new Schema({
  questionId:     { type: String, required: true },
  questionText:   { type: String, required: true },
  selectedOption: { type: String, required: true },
  score:          { type: Number, required: true },
  areaId:         { type: String },
  parameterId:    { type: String },
}, { _id: false })

const ParameterScoreSchema = new Schema({
  parameterId:       { type: String, required: true },
  parameterName:     { type: String, required: true },
  score:             { type: Number, required: true },
  gapClassification: { type: String, required: true },
}, { _id: false })

const AreaScoreSchema = new Schema({
  areaKey:           { type: String, required: true },
  areaName:          { type: String, required: true },
  areaNumber:        { type: Number, required: true },
  level:             { type: String, required: true },
  rawScore:          { type: Number, required: true },
  maxScore:          { type: Number, required: true },
  percentage:        { type: Number, required: true },
  gapClassification: { type: String, required: true },
  parameterScores:   [ParameterScoreSchema],
}, { _id: false })

const CapacityScoreSchema = new Schema({
  level:                { type: String, required: true },
  rawScore:             { type: Number, required: true },
  maxScore:             { type: Number, required: true },
  percentage:           { type: Number, required: true },
  weight:               { type: Number, required: true },
  weightedContribution: { type: Number, required: true },
  gapClassification:    { type: String },
}, { _id: false })

const TARecommendationSchema = new Schema({
  area:           { type: String, required: true },
  parameterId:    { type: String },
  capacityLevel:  { type: String, required: true },
  currentScore:   { type: Number, required: true },
  targetScore:    { type: Number, required: true },
  recommendation: { type: String, required: true },
  tools:          [String],
  timeframeWeeks: { type: Number, required: true },
  priority:       { type: String, enum: ['critical','high','medium','low'], required: true },
}, { _id: false })

const LendabilityResultSchema = new Schema({
  lendabilityIndex:      { type: Number, required: true },
  classification:        { type: String, enum: ['investment_ready','conditionally_lendable','high_risk'], required: true },
  strategic:             { type: CapacityScoreSchema, required: true },
  process:               { type: CapacityScoreSchema },
  operational:           { type: CapacityScoreSchema },  // legacy alias
  support:               { type: CapacityScoreSchema, required: true },
  areaScores:            [AreaScoreSchema],
  bottleneck:            { type: String, required: true },
  projectedIndexAfterTA: { type: Number },
  taRecommendations:     [TARecommendationSchema],
}, { _id: false })

const DiagnosticSchema = new Schema({
  tenantId:         { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  businessId:       { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  userId:           { type: String, required: true },
  period:           { type: String, required: true },
  responses:        [DiagnosticResponseSchema],
  result:           { type: LendabilityResultSchema },
  taAnalysis:       { type: Schema.Types.Mixed },
  status:           { type: String, enum: ['draft','submitted','scored','reported'], default: 'draft' },
  emailSent:        { type: Boolean, default: false },
  reportGenerated:  { type: Boolean, default: false },
  submittedAt:      { type: Date },
  scoredAt:         { type: Date },
  assessorComments: {
    strategic: { type: String, default: '' },
    process:   { type: String, default: '' },
    support:   { type: String, default: '' },
  },
  nextDiagnosticAvailable: { type: Date },
}, { timestamps: true })

// ── TA PROGRAMME ──────────────────────────────────────────
const TAProgrammeSchema = new Schema({
  tenantId:        { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  businessId:      { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  diagnosticId:    { type: Schema.Types.ObjectId, ref: 'Diagnostic', required: true },
  area:            { type: String, required: true },
  parameterId:     { type: String },
  capacityLevel:   { type: String, required: true },
  recommendation:  { type: String, required: true },
  tools:           [String],
  timeframeWeeks:  { type: Number, required: true },
  startDate:       { type: Date },
  completedDate:   { type: Date },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  status:          { type: String, enum: ['upcoming','active','completed','paused'], default: 'upcoming' },
  notes:           { type: String },
  assignedBy:      { type: String },
  autoGenerated:   { type: Boolean, default: false },
}, { timestamps: true })

// Audit log
const AuditLogSchema = new Schema({
  actorClerkId: { type: String },
  actorRole:    { type: String },
  tenantId:     { type: Schema.Types.ObjectId, ref: 'Tenant' },
  action:       { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId:   { type: String },
  status:       { type: String, enum: ['success', 'rejected', 'failed'], default: 'success' },
  ipAddress:    { type: String },
  details:      { type: Schema.Types.Mixed },
}, { timestamps: true })

// ── API KEYS (Enterprise) ─────────────────────────────────
const ApiKeySchema = new Schema({
  tenantId:    { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name:        { type: String, required: true },
  keyPrefix:   { type: String, required: true },  // first 8 chars, shown in UI
  keyHash:     { type: String, required: true, unique: true },  // SHA-256 of full key
  lastUsedAt:  { type: Date },
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: String, required: true },  // clerkId
}, { timestamps: true })

ApiKeySchema.index({ tenantId: 1, isActive: 1 })

// Indexes
DiagnosticSchema.index({ tenantId: 1, businessId: 1, createdAt: -1 })
DiagnosticSchema.index({ tenantId: 1, 'result.classification': 1 })
BusinessSchema.index({ tenantId: 1, email: 1 })
TAProgrammeSchema.index({ tenantId: 1, businessId: 1 })
TAProgrammeSchema.index({ tenantId: 1, status: 1 })
AuditLogSchema.index({ createdAt: -1 })
AuditLogSchema.index({ tenantId: 1, createdAt: -1 })
AuditLogSchema.index({ actorClerkId: 1, createdAt: -1 })

export const Tenant            = models.Tenant            || model('Tenant',            TenantSchema)
export const User              = models.User              || model('User',              UserSchema)
export const Business          = models.Business          || model('Business',          BusinessSchema)
export const Question          = models.Question          || model('Question',          QuestionSchema)
export const DiagnosticSection = models.DiagnosticSection || model('DiagnosticSection', DiagnosticSectionSchema)
export const QuestionSet       = models.QuestionSet       || model('QuestionSet',       QuestionSetSchema)
export const Diagnostic        = models.Diagnostic        || model('Diagnostic',        DiagnosticSchema)
export const TAProgramme       = models.TAProgramme       || model('TAProgramme',       TAProgrammeSchema)
export const AuditLog          = models.AuditLog          || model('AuditLog',          AuditLogSchema)
export const ApiKey            = models.ApiKey            || model('ApiKey',            ApiKeySchema)

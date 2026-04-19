// src/lib/db/seed.ts
// Run with: npm run seed
// Seeds all tenants, 12 capacity area sections, and 115 diagnostic questions

import mongoose from 'mongoose'
import { Tenant, DiagnosticSection, Question } from '../../models/index.js'
import { BANK_PRESETS, CAPACITY_AREAS } from '../../types/index.js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI as string
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local')
  process.exit(1)
}

function yn() {
  return [
    { text: 'Yes', score: 10 },
    { text: 'Partially / Sometimes', score: 5 },
    { text: 'No', score: 0 },
  ]
}

function scale() {
  return [
    { text: '1 – Very Poor: No evidence of this capability', score: 0 },
    { text: '2 – Poor: Very limited capability with major gaps', score: 2.5 },
    { text: '3 – Moderate: Some capability but significant improvement needed', score: 5 },
    { text: '4 – Good: Capability exists with minor gaps', score: 7.5 },
    { text: '5 – Excellent: Strong, documented, consistently applied capability', score: 10 },
  ]
}

// All 115 questions keyed by parameterId
// Each entry: [{ text, hint, type, options }]
const QUESTIONS: Record<string, Array<{ text: string; hint?: string; type: 'yesno'|'mcq'|'scale'; options: {text:string;score:number}[] }>> = {

  // ── AREA 1: Strategic Management ──────────────────────────
  missionVision: [
    {
      text: 'Does your business have a clearly written mission and vision statement?',
      hint: 'A mission defines WHY you exist; a vision defines WHERE you are going.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How well is the mission and vision communicated to all staff?',
      hint: 'Consider whether employees can articulate the mission without prompting.',
      type: 'mcq', options: [
        { text: 'A – All staff know and can articulate the mission and vision', score: 10 },
        { text: 'B – Most senior staff are aware but junior staff are not', score: 7.5 },
        { text: 'C – Only the owner/founder knows the mission and vision', score: 5 },
        { text: 'D – Mission/vision exists on paper only and is not communicated', score: 2.5 },
        { text: 'E – No mission or vision statement exists', score: 0 },
      ],
    },
    {
      text: 'Are strategic goals reviewed and updated at least once per year?',
      hint: 'Regular reviews ensure goals remain relevant to the business environment.',
      type: 'yesno', options: yn(),
    },
  ],

  companyHistory: [
    {
      text: 'Can you clearly describe the reason your business was founded and the problem it was created to solve?',
      hint: 'A clear founding story builds investor confidence.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How would you describe your business growth over the past three years?',
      type: 'mcq', options: [
        { text: 'A – Strong, consistent growth with documented milestones', score: 10 },
        { text: 'B – Moderate growth with some records kept', score: 7.5 },
        { text: 'C – Slow but steady growth, limited documentation', score: 5 },
        { text: 'D – Growth has been inconsistent or stagnant', score: 2.5 },
        { text: 'E – Business has declined or has no growth history', score: 0 },
      ],
    },
    {
      text: 'Has your business successfully adapted its model in response to market changes or challenges?',
      hint: 'Adaptability is a key indicator of long-term resilience.',
      type: 'yesno', options: yn(),
    },
  ],

  strategicPlanning: [
    {
      text: 'Does your business have a written strategic or business plan covering at least the next 12 months?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How consistently do your day-to-day operations align with your stated strategic objectives?',
      type: 'scale', options: scale(),
    },
    {
      text: 'Does the organisational structure of your business support the achievement of your strategic objectives?',
      hint: 'Consider whether roles, departments, and reporting lines are designed to deliver your goals.',
      type: 'yesno', options: yn(),
    },
  ],

  // ── AREA 2: Management & Leadership ───────────────────────
  leadershipStyle: [
    {
      text: 'How would you describe the primary leadership style within your business?',
      type: 'mcq', options: [
        { text: 'A – Collaborative: staff are consulted and involved in decisions', score: 10 },
        { text: 'B – Delegative: key responsibilities are assigned to qualified managers', score: 7.5 },
        { text: 'C – Directive: the owner makes most decisions with limited delegation', score: 5 },
        { text: 'D – Reactive: decisions are made as problems arise, no clear style', score: 2.5 },
        { text: 'E – No clear leadership structure exists', score: 0 },
      ],
    },
    {
      text: 'Are responsibilities and roles clearly assigned and documented across your management team?',
      hint: 'Job descriptions and org charts are examples of formalised responsibility assignment.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your leadership team regularly evaluate performance against targets?',
      type: 'yesno', options: yn(),
    },
  ],

  autonomy: [
    {
      text: 'How dependent is the business on the owner for day-to-day decisions?',
      type: 'mcq', options: [
        { text: 'A – Business runs smoothly without the owner for weeks', score: 10 },
        { text: 'B – Business can operate for a few days without the owner', score: 7.5 },
        { text: 'C – Owner must be consulted for most operational decisions', score: 5 },
        { text: "D – Almost all decisions require the owner's direct involvement", score: 2.5 },
        { text: 'E – Business cannot function without the owner present', score: 0 },
      ],
    },
    {
      text: 'Are senior managers or executives empowered to make decisions within defined limits without owner approval?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Is there a succession plan or deputy who can lead if the owner is unavailable?',
      hint: 'Lenders assess key-person risk — this significantly affects lendability.',
      type: 'yesno', options: yn(),
    },
  ],

  managementTools: [
    {
      text: 'What management tools does your business use to track performance?',
      type: 'mcq', options: [
        { text: 'A – Dashboards, KPIs, and regular management reports', score: 10 },
        { text: 'B – Spreadsheets and periodic meetings to review figures', score: 7.5 },
        { text: 'C – Informal tracking through conversations and observation', score: 5 },
        { text: 'D – Performance is not formally tracked', score: 2.5 },
        { text: 'E – No management tools or tracking mechanisms used', score: 0 },
      ],
    },
    {
      text: 'Does your business use financial or operational data to make management decisions?',
      hint: 'Data-driven decisions include reviewing sales reports, cost analyses, or cash flow statements.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How frequently does your management team meet to review business performance?',
      type: 'mcq', options: [
        { text: 'A – Weekly or more frequently with documented minutes', score: 10 },
        { text: 'B – Monthly with some records kept', score: 7.5 },
        { text: 'C – Quarterly or on an ad-hoc basis', score: 5 },
        { text: 'D – Rarely, only during crises', score: 2.5 },
        { text: 'E – Never', score: 0 },
      ],
    },
  ],

  // ── AREA 3: Business Environment ──────────────────────────
  regulationInstitution: [
    {
      text: 'Is your business formally registered with the relevant government authorities (e.g. Corporate Affairs Commission, tax authority)?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business maintain up-to-date licences, permits, and regulatory certifications required for your sector?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How well does your management team understand the regulations and compliance requirements that apply to your business?',
      type: 'scale', options: scale(),
    },
  ],

  sectorUnderstanding: [
    {
      text: 'Does your business regularly monitor trends, competitors, and macroeconomic factors in your sector?',
      hint: 'Examples include reading sector reports, attending trade shows, or reviewing competitor pricing.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How would you rate your management team\'s knowledge of the industry and competitive landscape?',
      type: 'scale', options: scale(),
    },
    {
      text: 'Does your business have a process to incorporate market intelligence into its strategic planning?',
      type: 'yesno', options: yn(),
    },
  ],

  alliances: [
    {
      text: 'Does your business have formal partnerships, joint ventures, or strategic alliances with other organisations?',
      hint: 'Examples: supplier agreements, distribution partnerships, co-marketing arrangements.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How effectively do your current partnerships contribute to business growth?',
      type: 'mcq', options: [
        { text: 'A – Partnerships are strategic, documented, and contribute measurably to revenue', score: 10 },
        { text: 'B – Partnerships exist and provide some benefit but are not formalised', score: 7.5 },
        { text: 'C – Partnerships are informal, with limited measurable impact', score: 5 },
        { text: 'D – Partnerships exist but provide no clear benefit', score: 2.5 },
        { text: 'E – No partnerships or alliances exist', score: 0 },
      ],
    },
    {
      text: 'Does your business actively seek new business opportunities through its network of partners or associations?',
      type: 'yesno', options: yn(),
    },
  ],

  // ── AREA 4: Production & Operations ───────────────────────
  suppliers: [
    {
      text: 'Does your business have a documented process for selecting and evaluating suppliers?',
      hint: 'Criteria may include quality, price, reliability, lead time, and sustainability.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How reliable are your suppliers in delivering materials or inputs on time and to the required standard?',
      type: 'mcq', options: [
        { text: 'A – Highly reliable: suppliers consistently meet quality and time requirements', score: 10 },
        { text: 'B – Mostly reliable with occasional minor delays or quality issues', score: 7.5 },
        { text: 'C – Reliability is inconsistent; occasional significant disruptions', score: 5 },
        { text: 'D – Suppliers are frequently unreliable, causing production disruptions', score: 2.5 },
        { text: 'E – Major supply issues that regularly halt operations', score: 0 },
      ],
    },
  ],

  inventoryHandling: [
    {
      text: 'Does your business use a system (manual or software) to track inventory levels?',
      hint: 'Examples: stock cards, spreadsheets, inventory management software.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How well does your inventory management prevent stockouts or excess stock?',
      type: 'scale', options: scale(),
    },
  ],

  productPlanning: [
    {
      text: 'Does your business forecast demand and prepare a production or service delivery plan in advance?',
      hint: 'A production plan can be weekly, monthly, or quarterly depending on your sector.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How proficient is your team at developing new products or services to meet evolving customer needs?',
      type: 'scale', options: scale(),
    },
  ],

  plantLayout: [
    {
      text: 'Is your production space, workshop, or office layout designed to maximise efficiency and workflow?',
      hint: 'Consider whether materials, equipment, and staff are positioned to minimise delays and movement.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business have adequate physical space to accommodate planned growth over the next 2 years?',
      type: 'yesno', options: yn(),
    },
  ],

  technologicalLevel: [
    {
      text: 'How would you describe the condition and age of the main equipment or technology used in your operations?',
      type: 'mcq', options: [
        { text: 'A – Modern, well-maintained equipment in excellent condition', score: 10 },
        { text: 'B – Relatively modern with minor wear; adequate for current needs', score: 7.5 },
        { text: 'C – Older equipment, functional but limiting capacity', score: 5 },
        { text: 'D – Ageing equipment that frequently breaks down', score: 2.5 },
        { text: 'E – Equipment is obsolete and severely limits production', score: 0 },
      ],
    },
    {
      text: 'Are equipment manuals, maintenance records, and operating procedures documented and accessible?',
      type: 'yesno', options: yn(),
    },
  ],

  machineryMaintenance: [
    {
      text: 'Does your business follow a preventive maintenance schedule for key equipment or machinery?',
      hint: 'Preventive maintenance occurs on a schedule, not just when equipment breaks down.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How frequently do equipment breakdowns disrupt your production or service delivery?',
      type: 'mcq', options: [
        { text: 'A – Rarely or never; maintenance is proactive and well-managed', score: 10 },
        { text: 'B – Occasionally, with minor impact on output', score: 7.5 },
        { text: 'C – Sometimes, causing noticeable delays', score: 5 },
        { text: 'D – Frequently, causing significant output loss', score: 2.5 },
        { text: 'E – Very frequently; breakdowns are a constant operational problem', score: 0 },
      ],
    },
  ],

  // ── AREA 5: Marketing & Sales ──────────────────────────────
  clientRelationship: [
    {
      text: 'Does your business have a formal process for handling customer complaints and feedback?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How would you rate overall customer satisfaction with your product or service?',
      type: 'scale', options: scale(),
    },
  ],

  strategicSegmentation: [
    {
      text: 'Has your business clearly identified and documented its target customer segments?',
      hint: 'Segments can be defined by geography, income, gender, age, industry, or other criteria.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How clearly differentiated is your product or service from competitors in the eyes of your target customers?',
      type: 'scale', options: scale(),
    },
  ],

  productsServices: [
    {
      text: 'Is there a structured coordination process between your production/operations team and your sales/marketing team?',
      hint: 'This ensures products available match what is being sold or promoted.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business regularly introduce new products or services based on customer feedback and market demand?',
      type: 'yesno', options: yn(),
    },
  ],

  price: [
    {
      text: 'Is your pricing based on a clear understanding of your cost structure, including all direct and indirect costs?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How regularly does your business review and adjust pricing in response to market conditions and competitor pricing?',
      type: 'mcq', options: [
        { text: 'A – Quarterly or more frequently with documented competitive analysis', score: 10 },
        { text: 'B – Annually, with some market data considered', score: 7.5 },
        { text: 'C – Occasionally, triggered by major cost changes only', score: 5 },
        { text: 'D – Rarely; pricing has not changed significantly in years', score: 2.5 },
        { text: 'E – Never formally reviewed; prices are set arbitrarily', score: 0 },
      ],
    },
  ],

  salesManagement: [
    {
      text: 'Does your business have a dedicated sales team or individual responsible for driving revenue?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business track sales targets, pipeline, and conversion rates?',
      hint: 'Examples: CRM system, sales register, weekly sales reports.',
      type: 'yesno', options: yn(),
    },
  ],

  communications: [
    {
      text: 'Does your business have a marketing or communications plan that guides your promotional activities?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How consistent is your brand messaging across all channels (social media, signage, packaging, sales materials)?',
      type: 'scale', options: scale(),
    },
  ],

  distribution: [
    {
      text: 'Does your business have clearly defined distribution channels for getting products or services to customers?',
      hint: 'Channels include direct sales, retailers, agents, online platforms, or wholesale.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Where applicable, do you have written agreements with distributors, agents, or retail partners?',
      type: 'yesno', options: yn(),
    },
  ],

  exports: [
    {
      text: 'Does your business currently export or have plans to export its products or services?',
      type: 'mcq', options: [
        { text: 'A – Currently exporting with a documented export strategy', score: 10 },
        { text: 'B – Currently exporting informally without a strategy', score: 7.5 },
        { text: 'C – Actively planning to export within the next 12 months', score: 5 },
        { text: 'D – Export is considered but no concrete plans exist', score: 2.5 },
        { text: 'E – No interest or capacity for exports at this time', score: 0 },
      ],
    },
    {
      text: 'Does your business have access to information about export markets, certifications, and trade opportunities?',
      type: 'yesno', options: yn(),
    },
  ],

  // ── AREA 6: Environmental Management ──────────────────────
  envRegulations: [
    {
      text: 'Is your business aware of and compliant with the environmental regulations applicable to your sector?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business have a written environmental policy or sustainability commitment?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Has your business received any environmental citations, fines, or community complaints in the past 3 years?',
      type: 'mcq', options: [
        { text: 'A – No citations, fines, or complaints; actively monitored', score: 10 },
        { text: 'B – No formal citations but minor community concerns raised', score: 7.5 },
        { text: 'C – One minor citation resolved satisfactorily', score: 5 },
        { text: 'D – Multiple citations or unresolved community complaints', score: 2.5 },
        { text: 'E – Significant ongoing environmental violations', score: 0 },
      ],
    },
  ],

  wasteManagement: [
    {
      text: 'Does your business have a documented waste management plan covering types, volumes, and disposal methods?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business take active measures to reduce, reuse, or recycle waste generated in operations?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How would you rate your business\'s waste treatment and pollution prevention practices?',
      type: 'scale', options: scale(),
    },
  ],

  occupationalRisk: [
    {
      text: 'Does your business have a documented health and safety policy and risk assessment?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Are all employees provided with appropriate personal protective equipment (PPE) and safety training?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How frequently are health and safety drills, inspections, or risk reviews conducted?',
      type: 'mcq', options: [
        { text: 'A – Regularly scheduled (monthly or quarterly) with records', score: 10 },
        { text: 'B – Annually or upon new equipment/staff', score: 7.5 },
        { text: 'C – Occasionally, triggered by incidents', score: 5 },
        { text: 'D – Rarely; safety is addressed informally', score: 2.5 },
        { text: 'E – Never; no health and safety practices in place', score: 0 },
      ],
    },
  ],

  // ── AREA 7: Organizational Structure ──────────────────────
  divisionOfLabor: [
    {
      text: 'Does your business have a documented organisational chart showing roles, departments, and reporting lines?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Are all staff roles and responsibilities formally documented in job descriptions?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How clearly are responsibilities divided to avoid duplication or confusion among staff?',
      type: 'scale', options: scale(),
    },
  ],

  decisionMakingPower: [
    {
      text: 'Are decision-making processes documented so that staff understand who approves what at each level?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Are staff at all levels given the opportunity to contribute ideas and participate in relevant decisions?',
      hint: 'Staff participation can include team meetings, suggestion boxes, or performance reviews.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How effective is your current decision-making structure in enabling timely and quality decisions?',
      type: 'scale', options: scale(),
    },
  ],

  // ── AREA 8: Finance ────────────────────────────────────────
  legalTaxLegislation: [
    {
      text: 'Is your business registered for all applicable taxes (income tax, PAYE, GST/VAT, business levy)?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business file tax returns accurately and on time?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business engage a qualified accountant or tax professional to manage tax compliance?',
      type: 'yesno', options: yn(),
    },
  ],

  accountingRecords: [
    {
      text: 'Does your business maintain up-to-date accounting records (income, expenses, assets, liabilities)?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Who is responsible for maintaining your accounting records?',
      type: 'mcq', options: [
        { text: 'A – A qualified in-house accountant with current records available', score: 10 },
        { text: 'B – An external accountant who prepares regular reports', score: 7.5 },
        { text: 'C – The owner or a non-accountant staff member', score: 5 },
        { text: 'D – Records are kept informally and are not always current', score: 2.5 },
        { text: 'E – No accounting records are maintained', score: 0 },
      ],
    },
    {
      text: 'Can you produce a cash flow statement for the past 12 months on request?',
      hint: 'Cash flow statements show all money coming in and going out of the business.',
      type: 'yesno', options: yn(),
    },
  ],

  costs: [
    {
      text: 'Does your business track all costs — direct (materials, labour) and indirect (rent, utilities, admin)?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business calculate the cost of producing each product or delivering each service?',
      hint: 'Unit cost calculation is essential for accurate pricing and profitability analysis.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How regularly does management review cost reports to identify savings or inefficiencies?',
      type: 'mcq', options: [
        { text: 'A – Monthly with documented cost analysis and action plans', score: 10 },
        { text: 'B – Quarterly with some record of review', score: 7.5 },
        { text: 'C – Annually at year-end', score: 5 },
        { text: 'D – Rarely; costs are only reviewed when there is a problem', score: 2.5 },
        { text: 'E – Never; no cost tracking or review process exists', score: 0 },
      ],
    },
  ],

  financialAdmin: [
    {
      text: 'Does your business prepare an annual budget and compare actual results against it?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business have a documented investment or capital expenditure policy?',
      hint: 'This covers how decisions are made about purchasing equipment, expanding, or acquiring assets.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How would you rate your management team\'s ability to interpret and act on key financial figures (revenue, profit margins, debt ratios)?',
      type: 'scale', options: scale(),
    },
  ],

  // ── AREA 9: Human Resources ────────────────────────────────
  staffPerformance: [
    {
      text: 'How would you rate the overall technical competence of your workforce relative to your business needs?',
      type: 'scale', options: scale(),
    },
    {
      text: 'Does your business have systems to identify and leverage the specific skills and strengths of each employee?',
      hint: 'Examples: skills matrices, performance reviews, role-specific training.',
      type: 'yesno', options: yn(),
    },
  ],

  personnelPolicy: [
    {
      text: 'Does your business have a documented HR policy covering recruitment, onboarding, and termination?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business have a structured staff training and development programme?',
      hint: 'Training can be on-the-job, external, or online, but should be planned and tracked.',
      type: 'yesno', options: yn(),
    },
  ],

  personnelBenefits: [
    {
      text: 'Does your business offer staff benefits or incentive programmes beyond basic salary (e.g. bonuses, health support, allowances)?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How would you describe the level of staff motivation and morale in your business?',
      type: 'scale', options: scale(),
    },
  ],

  corporateClimate: [
    {
      text: 'How would you rate employee satisfaction and sense of belonging in your business?',
      hint: 'Consider staff retention, attitude at work, and willingness to go beyond their job description.',
      type: 'scale', options: scale(),
    },
    {
      text: 'What is your approximate annual staff turnover rate?',
      type: 'mcq', options: [
        { text: 'A – Less than 10%: most staff stay for multiple years', score: 10 },
        { text: 'B – 10–20%: moderate turnover, manageable', score: 7.5 },
        { text: 'C – 21–35%: noticeable turnover affecting continuity', score: 5 },
        { text: 'D – 36–50%: high turnover with recruitment burden', score: 2.5 },
        { text: 'E – Over 50%: very high turnover causing significant operational challenges', score: 0 },
      ],
    },
  ],

  // ── AREA 10: Information Management ───────────────────────
  information: [
    {
      text: 'Does your business collect and store key business information (customer data, sales records, supplier information) in an organised system?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Is business information processed and presented in a format that managers can use for decision-making?',
      hint: 'Examples: monthly reports, dashboards, summarised financial statements.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How effective is your current information management in supporting coordination across departments?',
      type: 'scale', options: scale(),
    },
  ],

  communication: [
    {
      text: 'Are internal communications (instructions, updates, policies) shared with all relevant staff in a timely manner?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business use any digital communication tools (e.g. email, WhatsApp Business, Slack, intranet) for internal coordination?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How would you rate the overall effectiveness of communication between departments or teams in your business?',
      type: 'scale', options: scale(),
    },
  ],

  // ── AREA 11: Quality Management ───────────────────────────
  qualityControl: [
    {
      text: 'Does your business have a documented quality control policy and designated person(s) responsible for quality?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'What percentage of your output typically fails quality checks or requires rework?',
      type: 'mcq', options: [
        { text: 'A – Less than 2%: excellent quality control', score: 10 },
        { text: 'B – 2–5%: good quality control with minor rejection rate', score: 7.5 },
        { text: 'C – 6–10%: moderate rejection rate, areas for improvement', score: 5 },
        { text: 'D – 11–20%: high rejection rate causing cost and time losses', score: 2.5 },
        { text: 'E – Over 20%: very high rejection rate or no tracking', score: 0 },
      ],
    },
    {
      text: 'Does your business have a defined procedure for handling and disposing of rejected or substandard products?',
      type: 'yesno', options: yn(),
    },
  ],

  procedures: [
    {
      text: 'Are standard operating procedures (SOPs) documented for key production or service delivery processes?',
      hint: 'SOPs ensure consistent quality regardless of which staff member performs the task.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business use calibrated measurement instruments or tools to verify quality at key stages?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How systematically does your business conduct quality checks throughout the production or service process?',
      type: 'scale', options: scale(),
    },
  ],

  productQuality: [
    {
      text: 'Does your business conduct final quality checks on products or services before they reach the customer?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Are product specifications and quality standards documented and consistently applied?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business offer any form of warranty, guarantee, or after-sales support to customers?',
      hint: 'A guarantee reduces customer risk and increases willingness to pay.',
      type: 'yesno', options: yn(),
    },
  ],

  // ── AREA 12: Technological Innovation ─────────────────────
  technologicalStrategy: [
    {
      text: 'Is technology adoption and innovation explicitly included in your business strategy or annual plan?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business have a roadmap for developing new or improved products and services using technology?',
      type: 'yesno', options: yn(),
    },
  ],

  innovationCulture: [
    {
      text: 'Does your business actively seek customer feedback to improve products, services, or processes?',
      hint: 'Methods include surveys, focus groups, complaint tracking, or direct interviews.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Are employees encouraged and recognised for suggesting process improvements or innovative ideas?',
      type: 'yesno', options: yn(),
    },
  ],

  systemInfrastructure: [
    {
      text: 'Does your business have a dedicated unit, team, or individual responsible for research, development, or innovation?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'Does your business collaborate with universities, research institutions, or industry bodies on technology or product development?',
      type: 'yesno', options: yn(),
    },
  ],

  innovationExecution: [
    {
      text: 'Does your business have a budget allocated specifically for innovation or technology improvement projects?',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How well does your business manage the execution of innovation or improvement projects (on time, within budget)?',
      type: 'scale', options: scale(),
    },
  ],

  informationTech: [
    {
      text: 'Does your business use software or digital systems for core operations (accounting, inventory, sales, HR, or customer management)?',
      hint: 'Examples: QuickBooks, Zoho, Wave, ERPNext, point-of-sale systems.',
      type: 'yesno', options: yn(),
    },
    {
      text: 'How would you rate the overall level of digital adoption in your business compared to best practice in your sector?',
      type: 'scale', options: scale(),
    },
  ],
}

async function seed() {
  console.log('🌱 Seeding BizReady database...')
  await mongoose.connect(MONGODB_URI, { dbName: process.env.DB_NAME || 'bizready' })

  // Drop old unique index if present
  try {
    await Tenant.collection.dropIndex('clerkOrgId_1')
    console.log('✓ Dropped old clerkOrgId_1 unique index')
  } catch (err: any) {
    if (err.code !== 27) throw err
  }

  // ── TENANTS ────────────────────────────────────────────
  console.log('\nCreating tenants...')
  const tenants = [
    { slug: 'uba-sl',  name: 'UBA Sierra Leone',              theme: BANK_PRESETS.uba,    plan: 'growth',    contactEmail: 'diagnostics@uba.sl' },
    { slug: 'slcb',    name: 'Sierra Leone Commercial Bank',  theme: BANK_PRESETS.slcb,   plan: 'growth',    contactEmail: 'info@slcb.sl' },
    { slug: 'rokel',   name: 'Rokel Commercial Bank',         theme: BANK_PRESETS.rokel,  plan: 'starter',   contactEmail: 'info@rokelbank.sl' },
    { slug: 'innosl',  name: 'BizReady Platform',             theme: BANK_PRESETS.innosl, plan: 'owner',     contactEmail: 'fsg@innosl.com' },
  ]

  for (const t of tenants) {
    await Tenant.findOneAndUpdate({ slug: t.slug }, t, { upsert: true, new: true })
    console.log(`  ✓ Tenant: ${t.name}`)
  }

  // ── SECTIONS & QUESTIONS ────────────────────────────────
  console.log('\nClearing existing sections and questions...')
  await DiagnosticSection.deleteMany({ source: { $in: ['platform', null] }, tenantId: null })
  await Question.deleteMany({ source: { $in: ['platform', null] }, tenantId: null })

  let totalSections = 0
  let totalQuestions = 0

  for (const area of CAPACITY_AREAS) {
    const levelWeight = area.level === 'strategic' ? 0.30 : area.level === 'process' ? 0.45 : 0.25

    const section = await DiagnosticSection.create({
      name:          area.name,
      description:   `Capacity Area ${area.number} — ${area.level.charAt(0).toUpperCase() + area.level.slice(1)} Level`,
      capacityLevel: area.level,
      weight:        levelWeight,
      maxPoints:     area.maxPoints,
      order:         area.number,
      isActive:      true,
      areaId:        area.key,
      areaNumber:    area.number,
      source:        'platform',
      tenantId:      null,
    })

    totalSections++
    let qOrder = 1

    for (const param of area.parameters) {
      const questionDefs = QUESTIONS[param.id] ?? []

      if (questionDefs.length === 0) {
        console.warn(`  ⚠ No questions defined for parameter: ${param.id}`)
      }

      for (const def of questionDefs) {
        await Question.create({
          sectionId:   section._id,
          areaId:      area.key,
          parameterId: param.id,
          text:        def.text,
          hint:        def.hint,
          type:        def.type,
          options:     def.options,
          order:       qOrder++,
          isRequired:  true,
          isActive:    true,
          source:      'platform',
          tenantId:    null,
        })
        totalQuestions++
      }
    }

    console.log(`  ✓ Area ${area.number}: ${area.name} — ${qOrder - 1} questions`)
  }

  console.log(`\n✅ Seed complete!`)
  console.log(`   Tenants:   4`)
  console.log(`   Sections:  ${totalSections} (12 capacity areas)`)
  console.log(`   Questions: ${totalQuestions} platform questions`)
  console.log('\nFormula: Lendability Index = (Strategic/90 × 30%) + (Process/170 × 45%) + (Support/200 × 25%)')

  await mongoose.disconnect()
}

seed().catch(console.error)

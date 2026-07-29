const onboardingTracks = [
  {
    title: 'W-2 Employee Onboarding',
    description: 'Payroll employee setup with federal employment verification, withholding, and Texas new-hire reporting.',
    items: [
      'Offer letter or employment agreement',
      'Form I-9 identity and employment authorization verification',
      'Form W-4 federal income-tax withholding election',
      'Legal name, Social Security number, address, phone, and emergency contact',
      'Direct-deposit authorization and payroll schedule acknowledgement',
      'Compensation, department, manager, hire date, and employment status',
      'Texas new-hire report due within 20 calendar days',
      'Workers’ compensation coverage or Texas non-subscriber acknowledgement',
      'Employee handbook, safety policies, confidentiality, and equipment acknowledgements',
      'Benefits eligibility and required notices, when applicable',
      'W-2 year-end tax reporting status',
    ],
  },
  {
    title: '1099 Contractor Onboarding',
    description: 'Independent individual contractor setup without employee payroll deductions.',
    items: [
      'Independent-contractor agreement and documented worker-classification review',
      'Completed Form W-9 with legal name, business name, entity type, address, and TIN',
      'Payment method and accounts-payable details',
      'Department, service description, rate, start date, and contract term',
      'Certificate of insurance and required licenses, when applicable',
      'Confidentiality, data access, safety, and equipment agreements',
      'Track reportable nonemployee compensation for Form 1099-NEC',
      'Backup-withholding status and TIN validation exceptions',
      'No employee payroll withholding unless classification changes',
    ],
  },
  {
    title: 'Subcontractor Onboarding',
    description: 'Trade-company and crew onboarding for production work, compliance, insurance, and payment controls.',
    items: [
      'Executed subcontractor or master service agreement',
      'Completed Form W-9 and verified legal business information',
      'Certificate of general liability insurance',
      'Workers’ compensation certificate or documented coverage status',
      'Auto liability coverage when vehicles are used for company work',
      'Trade licenses, registrations, permits, and competency documents when required',
      'Scope, pricing, payment terms, change-order rules, and lien-waiver requirements',
      'Crew roster, authorized contacts, background or site-access requirements',
      'Safety orientation, incident reporting, and jobsite conduct acknowledgements',
      'Track reportable payments for Form 1099-NEC and year-end filing',
    ],
  },
];

export default function HumanResourcesPage() {
  return <>
    <div className="top dashboard-heading">
      <div><h1>Human Resources</h1><p>Onboard employees, contractors, and subcontractors for payroll, tax reporting, insurance, and company access.</p></div>
      <button type="button">Add Worker</button>
    </div>

    <section className="grid">
      <div className="card metric"><span>Pending onboarding</span><strong>0</strong></div>
      <div className="card metric"><span>Missing tax forms</span><strong>0</strong></div>
      <div className="card metric"><span>Insurance expiring</span><strong>0</strong></div>
      <div className="card metric"><span>Ready for payroll/payment</span><strong>0</strong></div>
    </section>

    <section className="module-grid section">
      {onboardingTracks.map(track => <article className="card" key={track.title}>
        <h2>{track.title}</h2>
        <p>{track.description}</p>
        <ul>{track.items.map(item => <li key={item}>{item}</li>)}</ul>
      </article>)}
    </section>

    <section className="card section">
      <h2>Worker Record Requirements</h2>
      <p>Each record should store worker type, department, access level, payroll or payment status, tax-document status, insurance expiration dates, onboarding owner, and a complete audit trail. Sensitive tax and identity documents must be restricted to authorized HR, accounting, administrator, and super-user roles.</p>
    </section>
  </>;
}

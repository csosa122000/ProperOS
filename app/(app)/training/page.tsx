const tracks = [
  { title: 'Sales Training', description: 'Consultative selling, inspections, estimate presentation, financing, follow-up, and closing.' },
  { title: 'Canvassing Training', description: 'Territory planning, door approach, scripts, lead capture, safety, and field standards.' },
  { title: 'Telemarketing Training', description: 'Call flow, objection handling, appointment setting, compliance, and quality review.' },
];

export default function Training(){
  return <>
    <div className="top">
      <div><h1>Proper University</h1><p>New-hire onboarding and ongoing development for every revenue team.</p></div>
      <button className="primary button-auto">Upload Training</button>
    </div>
    <section className="grid">
      <div className="card metric"><span>Published modules</span><strong>0</strong></div>
      <div className="card metric"><span>Team completion</span><strong>0%</strong></div>
      <div className="card metric"><span>Assignments due</span><strong>0</strong></div>
      <div className="card metric"><span>Certifications</span><strong>0</strong></div>
    </section>
    <section className="module-grid section">
      {tracks.map((track)=><div className="card" key={track.title}>
        <h3>{track.title}</h3><p>{track.description}</p>
        <button className="secondary">Open Track</button>
      </div>)}
    </section>
    <section className="card section">
      <h2>Training Library</h2>
      <p>Import videos, illustrations, documents, quizzes, scripts, and step-by-step modules. Assign content by role and track completion.</p>
    </section>
  </>
}
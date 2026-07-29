const estimateCategories = [
  { name: 'Exterior', description: 'Siding, roofing, windows, paint, gutters, decks, fences, and concrete.' },
  { name: 'Interior', description: 'Kitchens, bathrooms, flooring, trim, doors, drywall, and paint.' },
  { name: 'Outdoor Living', description: 'Patio covers, screen rooms, sunrooms, pergolas, and additions.' },
];

export default function Estimates(){
  return <>
    <div className="top estimate-heading">
      <div><h1>Estimate Builder</h1><p>Build projects from the Proper Remodeling master pricing book.</p></div>
      <button className="primary button-auto">Create Estimate</button>
    </div>

    <section className="card compact-estimate-panel">
      <label className="field compact-field">
        <span>Customer or lead</span>
        <select defaultValue=""><option value="" disabled>Select customer</option></select>
      </label>
      <label className="field compact-field">
        <span>Project category</span>
        <select defaultValue=""><option value="" disabled>Select category</option>{estimateCategories.map((category)=><option key={category.name}>{category.name}</option>)}</select>
      </label>
      <label className="field compact-field">
        <span>Project type</span>
        <select defaultValue=""><option value="" disabled>Select project type</option></select>
      </label>
      <button className="primary">Start Pricing</button>
    </section>

    <section className="estimate-accordions section">
      {estimateCategories.map((category)=><details className="card estimate-category" key={category.name}>
        <summary><span><strong>{category.name}</strong><small>{category.description}</small></span><span aria-hidden="true">⌄</span></summary>
        <div className="estimate-category-body">
          <p>Select this category to load its approved pricing, miscellaneous fee, allowances, and scope templates.</p>
          <button className="secondary">Use {category.name}</button>
        </div>
      </details>)}
    </section>

    <section className="card section pricing-workflow">
      <h2>Standard pricing workflow</h2>
      <div className="workflow-steps">
        <span>1. Master pricing</span><span>2. Category miscellaneous fee</span><span>3. 25% markup</span><span>4. 90-day price</span><span>5. 15% Today discount</span>
      </div>
    </section>
  </>
}
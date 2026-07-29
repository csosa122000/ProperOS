const departments = ['Sales', 'Canvassing', 'Production', 'Marketing', 'Accounting', 'Administration'];
const accessLevels = ['Team Member', 'Manager', 'Administrator', 'Super User'];

export default function PeoplePage() {
  return <>
    <div className="top dashboard-heading">
      <div><h1>Employees & Contractors</h1><p>Add personnel, assign their department, and define the menu access they receive.</p></div>
    </div>

    <section className="card section">
      <h2>Add Person</h2>
      <div className="form-grid">
        <label>Worker type<select defaultValue="employee"><option value="employee">Employee</option><option value="contractor">Contractor</option></select></label>
        <label>Department<select defaultValue=""><option value="" disabled>Select department</option>{departments.map((department) => <option key={department}>{department}</option>)}</select></label>
        <label>Access level<select defaultValue="Team Member">{accessLevels.map((level) => <option key={level}>{level}</option>)}</select></label>
        <label>Full name<input type="text" placeholder="Employee or contractor name" /></label>
        <label>Email<input type="email" placeholder="name@example.com" /></label>
        <label>Phone<input type="tel" placeholder="(512) 555-0000" /></label>
      </div>
      <p style={{ color: '#6b7280' }}>Team Members see Company Posts and only their assigned department workspace. Managers, Administrators, and Super Users can receive broader menu access.</p>
      <button type="button">Add Person</button>
    </section>

    <section className="card section">
      <h2>Directory</h2>
      <table className="table"><thead><tr><th>Name</th><th>Type</th><th>Department</th><th>Access</th><th>Status</th></tr></thead><tbody><tr><td colSpan={5}>No employees or contractors have been added yet.</td></tr></tbody></table>
    </section>
  </>;
}
'use client';

import { FormEvent, useState } from 'react';

const jobTitles = [
  'Owner',
  'General Manager',
  'Sales Manager',
  'Sales Representative',
  'Production Manager',
  'Project Manager',
  'Canvassing Manager',
  'Canvasser',
  'Marketing Manager',
  'Telemarketer',
  'Accounting',
  'Office Administrator',
  'Contractor',
];

const departments = ['Executive', 'Sales', 'Production', 'Canvassing', 'Marketing', 'Accounting', 'Human Resources'];
const branches = ['Austin'];
const accessOptions = ['Company Pulse', 'CRM', 'Estimates', 'Proposals', 'Contracts', 'Production', 'Canvassing', 'Marketing', 'Accounting', 'Proper University', 'Reports', 'Settings'];

export default function HumanResources() {
  const [message, setMessage] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Team member profile is ready to save once the HR database migration is connected.');
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>Human Resources</h1>
          <p>Add employees and contractors, assign their role and branch, and control Proper OS access.</p>
        </div>
      </div>

      <form className="card" onSubmit={submit}>
        <div className="form-section" style={{borderTop:0,marginTop:0,paddingTop:0}}>
          <h3>Team member</h3>
          <div className="form-grid">
            <label className="field">First name<input name="firstName" required /></label>
            <label className="field">Last name<input name="lastName" required /></label>
            <label className="field">Email<input name="email" type="email" required /></label>
            <label className="field">Worker type<select name="workerType" defaultValue="employee"><option value="employee">Employee</option><option value="contractor">Contractor</option></select></label>
            <label className="field">Job title<select name="jobTitle" defaultValue="Sales Representative">{jobTitles.map(title=><option key={title}>{title}</option>)}</select></label>
            <label className="field">Branch<select name="branch">{branches.map(branch=><option key={branch}>{branch}</option>)}</select></label>
            <label className="field">Department<select name="department">{departments.map(department=><option key={department}>{department}</option>)}</select></label>
            <label className="field">Status<select name="status" defaultValue="active"><option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option></select></label>
          </div>
        </div>

        <div className="form-section">
          <h3>Assigned access</h3>
          <p>Select the areas this person can access.</p>
          <div className="module-grid">
            {accessOptions.map(option => (
              <label className="card" style={{padding:'14px',boxShadow:'none'}} key={option}>
                <input type="checkbox" name="access" value={option} /> {option}
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Onboarding</h3>
          <div className="form-grid">
            <label className="field">Job offer<input name="jobOffer" type="file" accept=".pdf,.doc,.docx" /></label>
            <label className="field">Welcome letter<input name="welcomeLetter" type="file" accept=".pdf,.doc,.docx" /></label>
            <label className="field"><span>Invite options</span><select name="inviteOption" defaultValue="invite"><option value="invite">Invite to Proper OS</option><option value="welcome">Email welcome letter + invite</option><option value="none">Save without sending invite</option></select></label>
          </div>
        </div>

        {message && <p>{message}</p>}
        <div className="modal-actions">
          <button className="secondary" type="reset">Clear</button>
          <button className="primary button-auto" type="submit">Add team member</button>
        </div>
      </form>
    </>
  );
}

create table if not exists public.service_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_checklist_templates_service_id_idx
  on public.service_checklist_templates(service_id);

alter table public.service_checklist_templates enable row level security;

drop policy if exists "Authenticated users can read checklist templates" on public.service_checklist_templates;
create policy "Authenticated users can read checklist templates"
  on public.service_checklist_templates for select
  to authenticated
  using (true);

-- Master templates are intentionally read-only to normal users. Seed rows are
-- inserted only when their authoritative public.services row already exists.
with template_data(service_name, position, title, description) as (
  values
    ('Smart ID Card', 1, 'Confirm eligibility for a Smart ID', 'Confirm that the Smart ID service fits your situation.'),
    ('Smart ID Card', 2, 'Prepare required documents', 'Gather the documents listed by Home Affairs.'),
    ('Smart ID Card', 3, 'Complete the Smart ID application', 'Complete the official application process.'),
    ('Smart ID Card', 4, 'Check whether an appointment is required', 'Confirm appointment requirements before visiting.'),
    ('Smart ID Card', 5, 'Attend the Home Affairs appointment', 'Attend the confirmed appointment if one is required.'),
    ('Smart ID Card', 6, 'Submit biometric information', 'Complete the required biometric capture.'),
    ('Smart ID Card', 7, 'Track the application', 'Keep the reference and check the application status.'),
    ('Smart ID Card', 8, 'Collect the Smart ID when notified', 'Collect the document through the confirmed channel.'),
    ('South African Passport', 1, 'Confirm passport requirements', 'Confirm the passport type and current requirements.'),
    ('South African Passport', 2, 'Prepare required documents', 'Gather the documents listed by Home Affairs.'),
    ('South African Passport', 3, 'Complete the passport application', 'Complete the official application process.'),
    ('South African Passport', 4, 'Check appointment requirements', 'Confirm whether an appointment is required.'),
    ('South African Passport', 5, 'Attend the required appointment', 'Attend the confirmed appointment.'),
    ('South African Passport', 6, 'Submit biometric information', 'Complete the required biometric capture.'),
    ('South African Passport', 7, 'Track the application', 'Keep the reference and check the application status.'),
    ('South African Passport', 8, 'Collect the passport when notified', 'Collect through the confirmed channel.'),
    ('Learner’s Licence', 1, 'Confirm learner’s licence eligibility', 'Confirm eligibility and the correct process.'),
    ('Learner’s Licence', 2, 'Identify the correct licence category', 'Choose the category that matches your needs.'),
    ('Learner’s Licence', 3, 'Prepare required documents', 'Gather the current required documents.'),
    ('Learner’s Licence', 4, 'Complete the application', 'Complete the official application.'),
    ('Learner’s Licence', 5, 'Book the learner’s licence test', 'Book through the appropriate testing centre.'),
    ('Learner’s Licence', 6, 'Pay applicable fees', 'Verify and pay the applicable current fee.'),
    ('Learner’s Licence', 7, 'Attend the test', 'Attend the booked test appointment.'),
    ('Learner’s Licence', 8, 'Receive the learner’s licence if successful', 'Follow the collection instructions after passing.'),
    ('Driving Licence', 1, 'Confirm driving licence eligibility', 'Confirm eligibility and prerequisites.'),
    ('Driving Licence', 2, 'Confirm the correct licence category', 'Choose the category that matches your needs.'),
    ('Driving Licence', 3, 'Prepare required documents', 'Gather the current required documents.'),
    ('Driving Licence', 4, 'Complete the application', 'Complete the official application.'),
    ('Driving Licence', 5, 'Book the driving licence test', 'Book through the appropriate testing centre.'),
    ('Driving Licence', 6, 'Pay applicable fees', 'Verify and pay the applicable current fee.'),
    ('Driving Licence', 7, 'Complete the required testing process', 'Complete the yard and road tests.'),
    ('Driving Licence', 8, 'Receive or collect the driving licence if successful', 'Follow the collection instructions after passing.'),
    ('Motor Vehicle Licence Renewal', 1, 'Check the vehicle licence expiry date', 'Confirm the renewal deadline.'),
    ('Motor Vehicle Licence Renewal', 2, 'Confirm renewal requirements', 'Verify current provincial requirements.'),
    ('Motor Vehicle Licence Renewal', 3, 'Prepare required documentation', 'Gather the documents required for renewal.'),
    ('Motor Vehicle Licence Renewal', 4, 'Check for outstanding requirements or penalties', 'Resolve any outstanding items before renewal.'),
    ('Motor Vehicle Licence Renewal', 5, 'Complete the renewal application', 'Complete the official renewal process.'),
    ('Motor Vehicle Licence Renewal', 6, 'Pay applicable renewal fees', 'Verify and pay the current fee.'),
    ('Motor Vehicle Licence Renewal', 7, 'Submit the renewal', 'Submit through an approved channel.'),
    ('Motor Vehicle Licence Renewal', 8, 'Keep the renewed licence documentation', 'Store the renewed disc and receipt.'),
    ('Social Grants', 1, 'Identify the appropriate grant', 'Choose the grant type relevant to your situation.'),
    ('Social Grants', 2, 'Check eligibility', 'Confirm current eligibility requirements.'),
    ('Social Grants', 3, 'Prepare supporting documents', 'Gather current supporting documents.'),
    ('Social Grants', 4, 'Complete the application', 'Complete the official application.'),
    ('Social Grants', 5, 'Submit the application', 'Submit through an approved SASSA channel.'),
    ('Social Grants', 6, 'Track the application', 'Keep the reference and check progress.'),
    ('Social Grants', 7, 'Respond to requests for additional information', 'Provide any requested information through the official channel.'),
    ('Social Grants', 8, 'Check the application outcome', 'Review the official outcome.'),
    ('UIF Benefits', 1, 'Identify the appropriate UIF benefit', 'Choose the benefit relevant to your situation.'),
    ('UIF Benefits', 2, 'Confirm eligibility', 'Confirm current UIF eligibility requirements.'),
    ('UIF Benefits', 3, 'Gather employment information', 'Collect the required employment details.'),
    ('UIF Benefits', 4, 'Prepare supporting documents', 'Gather current supporting documents.'),
    ('UIF Benefits', 5, 'Complete the UIF application', 'Complete the official application.'),
    ('UIF Benefits', 6, 'Submit the required documents', 'Submit through an approved channel.'),
    ('UIF Benefits', 7, 'Track the claim', 'Keep the reference and check progress.'),
    ('UIF Benefits', 8, 'Respond to requests for additional information', 'Provide any requested information.'),
    ('UIF Benefits', 9, 'Confirm the outcome', 'Review the official claim outcome.'),
    ('Business (Company) Registration', 1, 'Decide on the company structure', 'Choose the appropriate structure.'),
    ('Business (Company) Registration', 2, 'Choose potential company names', 'Prepare and check suitable names.'),
    ('Business (Company) Registration', 3, 'Prepare company information', 'Gather the required company details.'),
    ('Business (Company) Registration', 4, 'Reserve a company name if required', 'Confirm whether name reservation is needed.'),
    ('Business (Company) Registration', 5, 'Prepare director/member information', 'Gather current director or member information.'),
    ('Business (Company) Registration', 6, 'Prepare supporting documents', 'Gather the documents requested by CIPC.'),
    ('Business (Company) Registration', 7, 'Complete the CIPC registration application', 'Complete the official application.'),
    ('Business (Company) Registration', 8, 'Pay applicable registration fees', 'Verify and pay the current fee.'),
    ('Business (Company) Registration', 9, 'Submit the application', 'Submit through an approved CIPC channel.'),
    ('Business (Company) Registration', 10, 'Track the registration', 'Keep the reference and check progress.'),
    ('Business (Company) Registration', 11, 'Store the registration documents', 'Keep the registration confirmation and documents.')
)
insert into public.service_checklist_templates (service_id, title, description, position)
select s.id, t.title, t.description, t.position
from template_data t
join public.services s on regexp_replace(lower(s.name), '[^a-z0-9]+', '', 'g') = regexp_replace(lower(t.service_name), '[^a-z0-9]+', '', 'g')
where not exists (
  select 1 from public.service_checklist_templates existing
  where existing.service_id = s.id and existing.position = t.position
);

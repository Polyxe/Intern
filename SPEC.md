# spec.md — Internship Management System

---

## Overview

The Internship Management System is a web-based platform for collecting, managing, and maintaining student internship data. It integrates with CMU Entra ID and supports email/password authentication.

The system enforces structured data collection, secure access control, and centralized record management.

---

## Goals

- Centralize internship data collection
- Ensure data accuracy and completeness
- Provide secure authentication (Entra ID + Email/Password)
- Enable administrative control over student and system data
- Deliver a responsive, user-friendly interface


## WORKFLOWS

### Universal Workflow and speculations
- The profile icon in the nav bar should take the user to view their profile information. There shouldn't be additional profile info button on the navbar
- The profile viewing page should also contain the edit profile button.
- Saving after editting profile should route them to their profile page to see the changes.
- The student profile viewing page should be the same in the student profile view and manage student profile view.
- The student intern form edit page should be the same in the student intern form edit and manage student intern form edit.
- The attachment files shouldn't be executable on the web app. They could only be downloadable.
- Deleting files on the front end should delete the exact file in the database too.
- Logging in using CMU OAuth should fill up some profile info.

### Super Admin Workflow and speculations

- an already seeded account in the database
- can't be created using web app UI
- logging in would route them into manage user page
- can choose to see between student accounts and admin accounts list. can be accessable through the nav bar.
- the super admin shouldn't see themselve on the list.
- if the super admin choose to see student list, there would be student status filter cards [all, not applicated, pending, rejected, on-going, intern-finished]
- the user list contains a filter search bar. The filter selection can be toggled using a select field button. The student list filter should be sectioned into user info [name, email, institution], education info[faculty, year level, guiding teacher name], intern info[position, company, supervisor]. For the admin list filter should be only user info[name, email, institution].
- The users card in the list would have 2 buttons: view button represented by an eye icon to view their information and delete account button represented by a trash can icon to delete that account from the database.
- clicking on a view button on a student user in the student user list should route them into the student intern form viewing page. The page should display all the student's intern form information they submitted. The page will have an edit info button to edit the student's intern form info. The page would also contain the student's status changing buttons[Reject, [Approve, Intern Finish]] if the user is a student.
- clicking on a view button on an admin user in the admin user list should route them into the user info viewing page. The page should display all the basic user information. The page will have an edit account info button to edit the user's info. 
- Rejecting a student should have the admin submit a form of the reason why they rejected the student. The reason on the form would be displaying on the student's intern form view page, which will persist until the student re0submit the intern form.
- Can choose to create user account. Assigning Email and Role is crucial for the user creation.

### Admin Workflow and speculations
- Can log in only if the account was created by super admin.
- They would be filling their profile form before being able to manage the students.
- They can't edit their email.
- The rest of workflow is the same as super admin except the admin can't create admin account.


### Student and speculations
- Can log in only if the account was created by super admin or admin.
- They can't edit their email.
- First time log in should greet the student with Terms Of Service approval page. The student needs to give consent in order to move on.
- After TOS approval, the student would be routed into filling their profile and intern form. They are not allowed to go anywhere else except logging out.
- Step 1: fill profile information and upload profile picture [max 5 MB, PNG/JPG only] > click save, go to the next step > Step 2: fill education information > click save, go to next step > Step 3: fill internship information and attachments [max 5 files, maximum size 5 MB each, PDF/PNG/JPG only] > click save, finished intern form, route them to view their own intern form page.
- Upon finishing the form, the student intern status change to pending.
- The intern form viewing page should be accessable through the nav bar.
- The profile should display the intern approval status, intern progression using time based on the intern form, and all the information on the form, sectioned by the steps accordingly.
- If the intern form was rejected by the super admin or admin, the student submit the form again and change their intern status to pending.
- If the student editted their profile or intern form when their status was 'on-going', they would be flagged 'editted after approval' (only viewable by the super admin and admin) and change their status back to pending. The super admin and admin would also get the notification that this student change the info after intern form approval (notification on app and Telegram).

---

## Data Model (Functional)

### Personal Info

- Title, First Name, Last Name
- Gender, DOB
- Phone, Email
- Address, Parent Phone

### Education

- Level, Institution, Major
- Faculty (optional)
- Advisor (optional)

### Internship

- Status, Position
- Start/End Date
- Department, Supervisor
- Additional notes (optional)

### Files

- Max 5 files
- Max 5MB each
- PDF/PNG/JPG
- Download/Delete (no viewing)

---

## UI/UX

- Responsive (mobile-first)
- Clean, minimal UI
- Fonts: Prompt / Kanit / Sarabun

---

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma 7
- PostgreSQL
- Zod Validation
- Docker + Docker Compose

---

## Base Path

App MUST run under:

/intern

```ts
export default {
  basePath: "/intern",
};
```

---

## Additional Speculations Based on the Present Application

- Authentication in the present application is OAuth-only for pre-provisioned accounts. The login UI exposes CMU Entra ID and Google OAuth, while account creation remains restricted to admin and superadmin workflows.
- The avatar/profile chip in the header is the single primary entry point to a signed-in user's profile page. The navbar exposes workflow destinations such as the internship form and user management, rather than duplicating profile navigation.
- After a student submits an internship form, `/intern/application` should behave as a review page by default. Editing should be an explicit action from that page or from the profile page.
- Rejecting a student's internship form should require a rejection reason from the reviewer. That reason should remain visible to the student until the student submits updated information again.
- Admin accounts should complete their own profile details before opening the user-management workspace. Superadmin accounts remain the seeded administrative entry point.
- CMU OAuth should backfill available profile information from the provider payload for already provisioned users, including name and institution data and, when available, a compatible profile image.
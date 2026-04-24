[x] Feature 000: Setup Database

[x] Feature 001: Implement CMU entra ID OAUTH: with the variable in the .env file, implement the OAUTH accordingly, and determine the CALLBACK_URL so my professor can generate the OAuth accordingly. 

[x] Feature 002: Student Features
- Accept TOS on first login
- View/edit profile
- Submit internship form
- Upload attachments

[x] Feature 003: Superadmin account management:
- The superadmin shouldn't see themselve in the management list.
- The superadmin should be able to perform CRUD on every account(including admins)'s data: Creating user accounts (admins, students), Viewing user accounts' details, Deleting user account from the database, Editting the user data (except for password).
- The superadmin should be able to edit their name, email, password, and profile picture.

[x] Feature 004: Admin account management:
- The admin shouldn't see themselve in the management list.
- The admin should be able to perform CRUD on every student account's data: Creating student user accounts, Viewing student accounts' details, Deleting student account from the database, Editting the student data (except for password).
- The admin should be able to edit their name, email, password, and profile picture.

[x] Feature 005: Student Profile Management:
- The student should have some of the profile datas pre populated if they use CMU entra ID OAuth, replacing the initial values from the Superadmin and Admin when they created the user email.
- If the OAuth provided a profile picture, use it as the student profile pictur, editable, and visible on the nav bar and profile page.
- The initial profile is not completed, take the student to edit the profile with their personal info and educational info.
- Once saved, the profile page presents the student a portal for the student to the intern form to fill the Internship Details \n Position, Dates, Dept, Supervisor. Upload Attachments\nMax 5 files · 5MB each · PDF/PNG/JPG. Make sure to pre populate the form with the datas in the student profile if the data field exist in the form. (Carefully refer to the datafields in the intern_from.png and make sure no datafields are missing)
- If validation failed Show Validation Errors\nRequired fields, email domain,\ndate logic, file limits.
- If successful take the student to their profile where they will have an option to view the submitted form, waiting for approval. The viewable form should look the same as the superadmin and admin views for the student to understand that the supderadmin/admins are viewing the data as the student intended.
- The student should have the ability to edit their profile as they wish before the internship ends. If they edited after the form was approved by one of the superadmin/admins, notify all the superadmin/admins that the approved form was editted.
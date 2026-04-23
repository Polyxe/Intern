# CMU Entra ID OAuth Data Reference

This file describes the data that this app retrieves during the CMU Entra ID sign-in flow and how that data is used in the internship form.

The behavior documented here is based on the current implementation in `src/lib/cmu-oauth.ts`, `src/app/intern/login/cmu/route.ts`, `src/app/intern/login/callback/route.ts`, and `src/app/intern/application/application-form.tsx`.

## 1. OAuth flow used by this app

1. The student clicks `เข้าสู่ระบบด้วย CMU Entra ID`.
2. The app redirects the browser to the CMU authorization endpoint.
3. After login, CMU redirects back to `/intern/api/auth/callback` with an authorization code.
4. The app exchanges that code for an access token.
5. The app calls the CMU basic info endpoint with that access token.
6. The app normalizes the CMU payload into a small internal profile object.
7. The app creates or updates the local student account.
8. The internship form reads the saved local user profile and prefills the student identity fields.

## 2. Environment variables used by the OAuth integration

The CMU OAuth integration is considered enabled only when all of these environment variables are present:

- `AUTH_URL`
- `TOKEN_URL`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `SCOPE`
- `BASICINFO_URL`

Optional related variables:

- `CALLBACK_URL`
- `LOGOUT_URL`

## 3. Data retrieved from CMU APIs

### 3.1 Token response

The app posts to `TOKEN_URL` with:

- `client_id`
- `client_secret`
- `code`
- `grant_type=authorization_code`
- `redirect_uri`
- `scope`

The app only requires one field from the token response:

```json
{
  "access_token": "..."
}
```

Notes:

- If `access_token` is missing, login fails.
- Other token fields may exist, but the current app does not read or store them.

### 3.2 Basic info response

The app then sends:

```http
Authorization: Bearer <access_token>
```

to `BASICINFO_URL`.

The basic info payload is treated as flexible JSON. The app does not require one rigid response shape. Instead, it searches the payload recursively for recognized keys.

That means the CMU response can be nested and can still work, as long as one of the expected keys is present somewhere in the JSON.

## 4. Fields extracted from the CMU basic info payload

The app normalizes the CMU payload into this internal shape:

```ts
type CmuBasicInfo = {
  email: string;
  title: string;
  firstName: string;
  lastName: string;
  institution: string | null;
  profileImageSource: string | null;
};
```

### 4.1 Email

The app searches for the first non-empty string under any of these keys:

- `email`
- `mail`
- `cmuMail`
- `cmuitaccount`
- `itaccount`
- `account`

Rules:

- Email is required. If no email-like field is found, login fails.
- The email is normalized to lowercase using the app's email normalization logic.
- If the value does not include `@`, the app appends `@cmu.ac.th`.

Examples:

- `student@cmu.ac.th` stays `student@cmu.ac.th`
- `student` becomes `student@cmu.ac.th`

### 4.2 Full name

The app first tries to find a full display name from:

- `displayname`
- `displayName`
- `fullname`
- `fullName`
- `name`

If found, the name is split on whitespace:

- first token becomes `firstName`
- remaining tokens are joined into `lastName`

### 4.3 First name

The app searches for the first non-empty string under:

- `firstname_en`
- `firstname_th`
- `firstname`
- `firstName`
- `given_name`

Fallbacks:

- If none of the keys above are found, it uses the first token from the full name.
- If that is still unavailable, it uses the email local part.
- If even that is unavailable, it falls back to `student`.

### 4.4 Last name

The app searches for the first non-empty string under:

- `lastname_en`
- `lastname_th`
- `lastname`
- `lastName`
- `family_name`
- `surname`

Fallback:

- If none of the keys above are found, it uses the remainder of the full name after the first token.

### 4.5 Title

The app searches for the first non-empty string under:

- `title_en`
- `title_th`
- `title`
- `prefix`

Fallback:

- If no title is found, the app uses `คุณ`.

### 4.6 Institution

The app searches for the first non-empty string under:

- `organizationname`
- `organizationName`
- `organization`
- `faculty`
- `division`

Fallback:

- If no institution-like value is found, the app stores `null`.

### 4.7 Profile image

The app also looks for an OAuth profile picture from keys such as:

- `picture`
- `pictureUrl`
- `photo`
- `photoUrl`
- `avatar`
- `avatarUrl`
- `profileImage`
- `profileImageUrl`
- `thumbnailPhoto`

Rules:

- Only `http`, `https`, or `data:image/...` values are accepted.
- The imported image must be an image file and no larger than 5 MB.
- Supported image formats are PNG, JPEG/JPG, and WebP.

## 5. Example of a CMU payload that this app can consume

This is only an example. The actual CMU response may include more fields.

```json
{
  "account": "student01",
  "displayName": "Somchai Jaidee",
  "firstname_en": "Somchai",
  "lastname_en": "Jaidee",
  "title_th": "นาย",
  "organizationName": "Chiang Mai University"
}
```

The app would normalize that into:

```json
{
  "email": "student01@cmu.ac.th",
  "title": "นาย",
  "firstName": "Somchai",
  "lastName": "Jaidee",
  "institution": "Chiang Mai University"
}
```

## 6. How the normalized data is stored locally

On first login, the app creates a local student user with:

- `title`
- `firstname`
- `lastname`
- `institution`
- `email`
- generated password hash
- `role = Student`

On later CMU logins, the app looks up the user by normalized email and only backfills missing profile fields when the local record is incomplete.

If the student account exists but the student has not submitted a profile/application yet, the CMU login now replaces the seeded title, first name, last name, institution, and profile picture with the CMU profile values.

Once a student has already completed the application, the CMU login stops overwriting those profile values aggressively.

## 7. How this data is used in the internship form

The internship form reads the current local user record and uses these CMU-derived fields as the initial values for the student profile section:

- `title`
- `firstname`
- `lastname`
- `institution`
- `email`
- `profileImagePath`

### 7.1 Fields prefilled from CMU-derived user data

In the student profile section of the internship form:

- `คำนำหน้า` comes from `title`
- `ชื่อ` comes from `firstname`
- `นามสกุล` comes from `lastname`
- `สถาบัน` comes from `institution`
- `อีเมล` comes from `email`

### 7.2 Editable vs read-only behavior

- `email` is displayed as read-only in the internship form.
- `profileImagePath` is shown in the navigation bar, the profile page, and the internship form header.
- `title`, `firstname`, `lastname`, and `institution` are prefilled but still editable by the student.

### 7.3 Fields not provided by CMU OAuth

The following internship form fields are not populated by the CMU OAuth integration and must be completed manually by the student:

- `sex`
- `birthDate`
- `address`
- `studentId`
- `phoneNumber`
- `faculty`
- `program`
- `yearLevel`
- `internshipPosition`
- `companyName`
- `companyAddress`
- `guidingProfessorFirstname`
- `guidingProfessorLastname`
- `guidingProfessorPhoneNumber`
- `companySupervisorName`
- `companySupervisorRole`
- `companySupervisorEmail`
- `companySupervisorPhoneNumber`
- `internshipStartDate`
- `internshipEndDate`
- `emergencyContactName`
- `emergencyContactRelationship`
- `emergencyContactPhoneNumber`
- `notes`
- `attachments`

## 8. Recommended wording for the intern form description

You can describe the behavior like this:

> When a student signs in with CMU Entra ID, the system retrieves the student's basic university profile from CMU and automatically prefills the internship form with email, title, first name, last name, and institution. The student must still complete the rest of the internship-specific information manually before submitting the form.

If you want more implementation-focused wording:

> The CMU Entra ID flow in this project uses the OAuth authorization code flow, exchanges the returned code for an access token, fetches a CMU basic-info payload, normalizes the profile into email, title, first name, last name, and institution, then uses those values to create or update the local student account that drives the internship form defaults.

## 9. Source of truth in the codebase

- `src/lib/cmu-oauth.ts`: OAuth config, token exchange, basic info fetch, field extraction, user upsert
- `src/app/intern/login/cmu/route.ts`: start OAuth login
- `src/app/intern/login/callback/route.ts`: receive OAuth callback
- `src/app/intern/application/application-form.tsx`: internship form fields and which values are prefilled

# Solution Documentation

## Approach

As a junior developer, I started this project without a rich prior experience in NestJS, Prisma, Docker or React-admin. Given only a week to deliver a working solution, I adopted a hastened learning approach using official documentation, video tutorials, and AI tools to quickly familiarize myself with these tools. My goal was to build a functional loans management system, prioritizing clear data flow between the frontend and backend and reliable database operations. Throughout development, I'd frequently test my code in order to thoroughly debug it, as well as consult the documentation since a lot of boilerplate or AI-generated code didn’t work out of the box.

Generally, I made use of AI suggestions for both understanding concepts and generating starter code, but always made sure I could understand and explain the generated output. I spent significant time troubleshooting runtime errors and adapting code to fit project requirements. For instance, Prisma 7 was released during the past week, and using it in my Docker setup would break the backend container. A quick look into Prisma's Github repo issues page made it clear that I had to downgrade. The final result isn’t perfect, but it provides the essential features required, and I gained confidence working with this tech stack.

## Key Technical Decisions

- **AI Usage:** I used AI to draft initial scaffolding, documentation, and code snippets, but debugging and integration required hands-on effort. Using AI allowed me to move faster but also led to some buggy code.
- **Logging Interceptor:** I enabled a backend logging interceptor for standardized logging of requests, errors, and events.
- **Error Handling:** Implemented basic error handling throughout APIs to prevent crashes and expose informative feedback.
- **Modularization:** Components and services were separated logically into modules in both the backend and frontend for ease of maintenance and future scalability.

## Rollback System Implementation

To handle rollbacks, I applied Prisma’s transaction API. Database changes that required rollback, such as updating loan status or recording payments, were wrapped in the `prisma.$transaction` block to ensure that all changes succeed or else it will rollback and fail to perform the operation. This structure helped maintain data consistency. If an error occurred, Prisma automatically reverted the changes made in that transaction.

## Logging Strategy

I extended NestJS’s default logging to cover key actions such as user authentication, loan creation, payment updates, and error events. Logs are output to the console and included errors for failed operations which was essential step in the debugging process. For sensitive actions, logs omit or anonymize user details to avoid leaking information.

## Security

### Security Threats Identified

- **Unauthorized Access:** Risk of users accessing loan or payment records they shouldn’t.
- **Data Tampering:** Potential for malicious users to edit deposit/loan amounts or statuses.
- **Injection Attacks:** Possibility of SQL injection or other code injection in user inputs.
- **Sensitive Data Exposure:** Log files or error messages leaking confidential data.
- **Lack of Authentication:** Possibility of insecure user accounts.

### Security Measures Implemented

- **Prisma Safety Defaults:** Prisma escapes inputs by default, reducing SQL injection risk.
- **Minimal Sensitive Logging:** Avoided logging sensitive personal information.

### Why These Measures

These choices were made because they are the recommended defaults and allowed for the most ease when it comes to development. Given the time constraint and my experience level, this approach balanced security with rapid delivery.

### Security Trade-offs

- **No Authentication/Authorization:** The code does not implement JWT or session login. Every controller is publicly exposed and there are no guards or permission checks.
- **No Input Validation:** Code does not validate inputs (body, query, etc.) using decorators or validators.
- **No Rate Limiting:** No code for throttling or limiting requests per user/IP.
- **No Secret Management / Environment Separation:** No handling of API keys, secrets, or sensitive config beyond using environment variables.
- **No CORS Restrictions:** CORS is set to allow all origins. Anyone can call the API from anywhere.
- **No Logging/Monitoring for Incident Response:** There’s some logging of errors, but no security-specific event auditing, alerting, or log rotation.
- **No Data Encryption:** There’s no encryption or field encryption at the database level.

### Future Security Enhancements

If I had more time I'd implement:
- **JWT Authentication:** Secure endpoints so that only logged in users can access protected data.
- **Backend Validation:** Use libraries like `class-validator` in NestJS to ensure that only safe input is accepted for all API endpoints.
- **Sanitize/escape input:** Prevent injection attacks by sanitizing and validating both backend and frontend inputs.
- **Restrict Origins:** Update CORS policy to only allow requests from trusted domains.
- **API Throttling:** Limit the number of requests per IP/user to prevent abuse and basic denial of service attacks.

## Challenges Faced and Solutions

- **Learning Curve:** Rapidly learning NestJS, Prisma, and React-admin. Solved via documentation, YouTube, and trial/error.
- **AI Code Bugs:** Many auto-generated snippets didn’t work, requiring manual debugging via consulting documentations.
- **Database Migrations:** Prisma migration errors slowed development; resolved by double-checking schema changes and resetting migration history. Additionally required that I downgrade from the new Prisma 7 to Prisma 6.19.
- **Frontend/Backend Integration:** React-admin sometimes expected different API formats; fixed by customizing backend responses.

## Future Improvements

- Refactor code for better maintainability.
- Enhance user management.
- Add more robust validation and security features.
- Improve error handling with standardized API error responses.
- Improve the Frontend UI.

## Time Breakdown by Feature

- **Backend API & Data Models:** 2 days
- **Frontend Admin (React-admin):** 2 days
- **Database Schema & Migrations:** 1 day
- **Testing & Debugging:** 1 day
- **Documentation:** 0.5 days
- **Security Implementation:** 0.5 days

## Assumptions Made

- All admins/users access via a trusted network or VPN.
- No external integrations required (e.g., payments, notifications).
- Small user base; scalability not an immediate priority.
- Only core loan management features needed in this version.
- No need for separate roles, the dashboard is accessible by anyone.

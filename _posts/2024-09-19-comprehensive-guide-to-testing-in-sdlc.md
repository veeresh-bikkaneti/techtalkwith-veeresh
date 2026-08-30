---
layout: post
title: "Comprehensive Guide to Testing in SDLC"
date: 2024-09-19
categories: [best-practices, frameworks]
tags: [sdlc, test-strategy, performance-testing, security-testing, regression-testing, load-testing]
excerpt: "Testing isn't one phase in the SDLC — it's the thread running through all of them. A map of what to test, when, and why it matters."
reading_time: 6
---

## A Testing Strategy That Doesn't Wait Until The End

> *"Your team shipped 'move fast and break things' — and broke the production database. Testing day of release? That's not testing, that's hope."*

Testing isn't something you do at the end, after developers ship code and it's too late to change anything. That's reactive. **Testing is a thread running through every phase** — from the moment someone sketches a requirement to the minute you shut down a server years later.

This guide maps out what gets tested when, why it matters, and which tools do the job. Think of it like layers of a cake: each layer catches different kinds of problems, and you need all of them for a solid product.

Here's the structure:

**Early** (Requirements & Design): Define what "done" looks like, plan the test strategy.
**During** (Development): Catch bugs before they multiply, scan for security holes in the code.
**Mid-release** (Testing phase): Load test, security test, performance test the full system.
**Launch** (Deployment): UAT — the customer says "yes, ship it."
**After** (Maintenance): Regression test every change, keep monitoring for sneaky problems.

Let's walk through each.

---

## Stages in SDLC

### Requirement Analysis — Define "Done" Before You Build
- **Acceptance Criteria**: Conditions that a software product must satisfy to be accepted by a user or customer.
- **Use Case**: A description of how users will interact with the system.

### Design — Plan the Assault

Write down *how* you'll test. What scenarios? What tools? How many people? When?

- **Test Plan**: A document describing the scope, approach, resources, and schedule of intended test activities.
- **Test Case**: A set of conditions under which a tester will determine whether an application is working correctly.

### Development — Catch Bugs While They're Cheap

The sooner a bug dies, the cheaper it is to fix. Unit tests, code scanners, mocks — get them running as developers commit.


- **Unit Testing**: Testing individual components of the software.
- **SAST (Static Application Security Testing)**: Analyzing source code for security vulnerabilities.
- **Testing with Mock**: Using mock objects to simulate the behavior of real objects in controlled ways.

### Testing — The Full Assault

Now the pieces come together. Does everything work? Does it perform? Can you hack it? Test all of it.

- **Integration Testing**: Testing combined parts of an application to determine if they function together correctly.
- **System Testing**: Testing the complete and integrated software to evaluate the system's compliance with its specified requirements.
- **Load Testing**: Testing the application's ability to perform under expected user loads.
- **Stress Testing**: Testing the application's behavior under extreme conditions.
- **Performance Testing**: Testing to determine the speed, responsiveness, and stability of the application.
- **Penetration Testing**: Simulating attacks on the application to identify security vulnerabilities.
- **OWASP Testing**: Comprehensive security testing based on OWASP guidelines.

### Deployment — Customer Approval

The humans who will *actually use* this software sign off. Do they agree it works?

- **User Acceptance Testing (UAT)**: Testing conducted to determine if the system satisfies the acceptance criteria and is ready for production.
- **Health Checks**: Regular checks to ensure the application is running as expected.

### Maintenance — Keep It From Rotting

After launch, testing doesn't stop. Every change is a potential bug. Every day is a data point.

- **Regression Testing**: Testing existing software applications to ensure that a change or addition hasn't broken any existing functionality.
- **Security Testing**: Ensuring that the application is secure from external threats.
- **Application Monitoring**: Continuous monitoring of the application to ensure it is performing as expected and to detect any issues.


---

## Why All These Types Matter (and How They Connect)

Here's the honest truth: you need *all* of these. None of them are optional. They catch different things — and when you skip one, something slips through.

**Load Testing, Stress Testing, Performance Testing, SAST, Penetration Testing, and OWASP Testing** together form a defense-in-depth strategy. Here's what each catches:



- **Load Testing**: Determines how the application behaves under expected user loads. It helps identify performance bottlenecks and ensures the application can handle the expected traffic.
- **Stress Testing**: Evaluates the application's behavior under extreme conditions, such as high traffic or limited resources, to identify breaking points and ensure stability under stress.
- **Performance Testing**: Measures the application's responsiveness, speed, and stability under various conditions. It includes load and stress testing as subsets.
- **SAST (Static Application Security Testing)**: Identifies security vulnerabilities in the source code early in the development process.
- **Penetration Testing**: Simulates real-world attacks on a running application to identify vulnerabilities that could be exploited by attackers.
- **OWASP Testing**: Provides a comprehensive framework for testing the security of web applications, covering various aspects such as configuration, authentication, and input validation.

### Relationship

- **Load, Stress, and Performance Testing**: Focus on the application's performance and stability under different conditions.
- **SAST and Penetration Testing**: Focus on identifying security vulnerabilities from different perspectives (code analysis vs. real-world attacks).
- **OWASP Testing**: Encompasses a broad range of security testing practices, including aspects covered by both SAST and penetration testing.
- **Combined Approach**: Using all these methods together provides a comprehensive assessment of the application's performance, stability, and security.

## Tools Used

- **Load Testing Tools**:
  - **Apache JMeter**
  - **LoadRunner**
  - **Gatling**

- **Stress Testing Tools**:
  - **Apache JMeter**
  - **LoadRunner**
  - **StressStimulus**

- **Performance Testing Tools**:
  - **Apache JMeter**
  - **LoadRunner**
  - **New Relic**

- **SAST Tools**:
  - **SonarQube**
  - **Checkmarx**
  - **Fortify Static Code Analyzer**

- **Penetration Testing Tools**:
  - **Metasploit**
  - **Burp Suite**
  - **OWASP ZAP**

- **OWASP Testing Tools**:
  - **OWASP ZAP**
  - **Burp Suite**
  - **Nessus**



### Requirement Analysis Phase
```mermaid
sequenceDiagram
    participant Analyst
    participant Requirement_Doc
    Analyst->>Requirement_Doc: Define acceptance criteria and use cases
```



### Design Phase
```mermaid
sequenceDiagram
    participant Tester
    participant Test_Plan
    participant Test_Case
    Tester->>Test_Plan: Create test plan
    Tester->>Test_Case: Create test cases
```


### Development Phase
```mermaid
sequenceDiagram
    participant Developer
    participant SAST_Tool
    participant Mock_Tool
    participant Application

    Developer->>SAST_Tool: Run SAST during coding
    SAST_Tool-->>Developer: Report vulnerabilities
    Developer->>Application: Fix vulnerabilities

    Developer->>Mock_Tool: Use mocks for testing
    Mock_Tool-->>Developer: Simulate real objects
```

### Testing Phase
```mermaid
sequenceDiagram
    participant Tester
    participant Load_Test_Tool
    participant Stress_Test_Tool
    participant Perf_Test_Tool
    participant Pen_Test_Tool
    participant OWASP_Tool
    participant Application

    Load_Test_Tool->>Application: Conduct load testing
    Load_Test_Tool-->>Tester: Report performance issues

    Stress_Test_Tool->>Application: Conduct stress testing
    Stress_Test_Tool-->>Tester: Report stability issues

    Perf_Test_Tool->>Application: Conduct performance testing
    Perf_Test_Tool-->>Tester: Report performance metrics

    Pen_Test_Tool->>Application: Conduct penetration testing
    Pen_Test_Tool-->>Tester: Report vulnerabilities

    OWASP_Tool->>Application: Conduct OWASP testing
    OWASP_Tool-->>Tester: Report security issues
```

### Deployment Phase
```mermaid
sequenceDiagram
    participant Tester
    participant UAT_Tool
    participant Health_Check_Tool
    participant Application

    UAT_Tool->>Application: Conduct user acceptance testing
    UAT_Tool-->>Tester: Report acceptance results

    Health_Check_Tool->>Application: Perform health checks
    Health_Check_Tool-->>Tester: Report health status
```

### Maintenance Phase
```mermaid
sequenceDiagram
    participant Tester
    participant Regression_Test_Tool
    participant Security_Test_Tool
    participant Monitoring_Tool
    participant Application

    Regression_Test_Tool->>Application: Conduct regression testing
    Regression_Test_Tool-->>Tester: Report regression issues

    Security_Test_Tool->>Application: Conduct security testing
    Security_Test_Tool-->>Tester: Report security issues

    Monitoring_Tool->>Application: Monitor application
    Monitoring_Tool-->>Tester: Report performance and issues
```

### Consolidated Diagram
```mermaid
sequenceDiagram
    participant Analyst
    participant Developer
    participant Tester
    participant SAST_Tool
    participant Load_Test_Tool
    participant Stress_Test_Tool
    participant Perf_Test_Tool
    participant Pen_Test_Tool
    participant OWASP_Tool
    participant Mock_Tool
    participant UAT_Tool
    participant Health_Check_Tool
    participant Regression_Test_Tool
    participant Security_Test_Tool
    participant Monitoring_Tool
    participant Application

    Analyst->>Requirement_Doc: Define acceptance criteria and use cases

    Developer->>SAST_Tool: Run SAST during coding
    SAST_Tool-->>Developer: Report vulnerabilities
    Developer->>Application: Fix vulnerabilities

    Developer->>Mock_Tool: Use mocks for testing
    Mock_Tool-->>Developer: Simulate real objects

    Load_Test_Tool->>Application: Conduct load testing
    Load_Test_Tool-->>Tester: Report performance issues

    Stress_Test_Tool->>Application: Conduct stress testing
    Stress_Test_Tool-->>Tester: Report stability issues

    Perf_Test_Tool->>Application: Conduct performance testing
    Perf_Test_Tool-->>Tester: Report performance metrics

    Pen_Test_Tool->>Application: Conduct penetration testing
    Pen_Test_Tool-->>Tester: Report vulnerabilities

    OWASP_Tool->>Application: Conduct OWASP testing
    OWASP_Tool-->>Tester: Report security issues

    UAT_Tool->>Application: Conduct user acceptance testing
    UAT_Tool-->>Tester: Report acceptance results

    Health_Check_Tool->>Application: Perform health checks
    Health_Check_Tool-->>Tester: Report health status

    Regression_Test_Tool->>Application: Conduct regression testing
    Regression_Test_Tool-->>Tester: Report regression issues

    Security_Test_Tool->>Application: Conduct security testing
    Security_Test_Tool-->>Tester: Report security issues

    Monitoring_Tool->>Application: Monitor application
    Monitoring_Tool-->>Tester: Report performance and issues

```

# Reference: Glossary of Testing Terms in SDLC

## Requirement Analysis
- **Acceptance Criteria**: Conditions that a software product must satisfy to be accepted by a user or customer.
- **Use Case**: A description of how users will interact with the system.

## Design
- **Test Plan**: A document describing the scope, approach, resources, and schedule of intended test activities.
- **Test Case**: A set of conditions under which a tester will determine whether an application is working correctly.

## Development
- **Unit Testing**: Testing individual components of the software to ensure they work as intended.
- **SAST (Static Application Security Testing)**: Analyzing source code for security vulnerabilities without executing the program.
- **Testing with Mock**: Using mock objects to simulate the behavior of real objects in controlled ways, often used in unit testing.
- **Bounded Context**: A design pattern in domain-driven design where a particular model is defined and applicable within a specific boundary.
- **Microservice**: An architectural style that structures an application as a collection of loosely coupled services.

## Testing
- **Integration Testing**: Testing combined parts of an application to determine if they function together correctly.
- **System Testing**: Testing the complete and integrated software to evaluate the system's compliance with its specified requirements.
- **Load Testing**: Testing the application's ability to perform under expected user loads.
- **Stress Testing**: Testing the application's behavior under extreme conditions, such as high traffic or limited resources.
- **Performance Testing**: Testing to determine the speed, responsiveness, and stability of the application.
- **Penetration Testing**: Simulating attacks on the application to identify security vulnerabilities.
- **OWASP Testing**: Comprehensive security testing based on OWASP guidelines, covering various aspects such as configuration, authentication, and input validation.

## Deployment
- **User Acceptance Testing (UAT)**: Testing conducted to determine if the system satisfies the acceptance criteria and is ready for production.
- **Health Checks**: Regular checks to ensure the application is running as expected and to detect any issues early.

## Maintenance
- **Regression Testing**: Testing existing software applications to ensure that a change or addition hasn't broken any existing functionality.
- **Security Testing**: Ensuring that the application is secure from external threats.
- **Application Monitoring**: Continuous monitoring of the application to ensure it is performing as expected and to detect any issues.

## Additional Terms
- **Mock Object**: An object that mimics the behavior of real objects in controlled ways, used in testing.
- **Bounded Context**: A design pattern in domain-driven design where a particular model is defined and applicable within a specific boundary.
- **Microservice**: An architectural style that structures an application as a collection of loosely coupled services.
- **Health Check**: A process to verify that a system is operating as expected.
- **Application Monitoring**: The process of continuously observing the performance and health of an application.

---

## The Pattern: Test Early, Test Often, Test Everything

I've seen teams ship without load testing. The app melted under traffic on day one. I've seen teams skip penetration testing and got breached two months later. I've seen teams ignore regression testing and broke a feature they thought was stable, shipping it to production with the bug.

The pattern that works: **start testing requirements in week one**. Write test cases *during design*. Run unit tests as developers commit. Start integration tests the day features are functional. Load test before launch. Keep testing after shipping.

Each layer catches something the previous layer missed. You don't get to skip any.

---

## Sources & Further Reading

1. [ISTQB — Software Testing Fundamentals](https://istqb.org/certifications/certified-tester-foundation-level)
2. [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
3. [Microsoft — Performance testing guidance](https://learn.microsoft.com/en-us/azure/well-architected/performance-efficiency/performance-test)
4. [Shift-left testing — Wikipedia (solid overview)](https://en.wikipedia.org/wiki/Shift-left_testing)

*See also:* [Shift Left Using a Regression Suite (Sep 2024)]({{ site.baseurl }}{% link _posts/2024-09-23-shift-left-using-regression-suite.md %}) — run that regression pack earlier, not after the release train leaves. · [Functional Testers in the Secure SDLC (Mar 2025)]({{ site.baseurl }}{% link _posts/2025-03-05-functional-tester-secure-development-lifecycle.md %}) — where security testing actually slots in.



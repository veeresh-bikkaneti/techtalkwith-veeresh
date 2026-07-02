---
layout: post
title: "Framework Development Guide for Selenium C#"
date: 2024-09-09
categories: [automation, frameworks]
tags: [selenium, dotnet, csharp, framework-design, page-object-model, bdd]
excerpt: "I've rebuilt Selenium C# frameworks more times than I'd like to admit. Here's the xUnit + SpecFlow + DI setup that actually survives production."
reading_time: 11
---

<img src="https://github.com/user-attachments/assets/3de0636d-322a-4ad1-a0c7-8f674d35a7c8" alt="Selenium C# framework layered architecture diagram" class="float-right" width="300">

- [Framework Development Guide for Selenium C#](#framework-development-guide-for-selenium-c)
  - [1. Introduction](#1-introduction)
  - [2. Concepts and Comparisons](#2-concepts-and-comparisons)
      - [OOP, OOD, and CLEAN Architecture Principles](#oop-ood-and-clean-architecture-principles)
      - [Comparison Table for OOP, OOD, and CLEAN Architecture](#comparison-table-for-oop-ood-and-clean-architecture)
  - [| CLEAN         | Separation of Concerns, Dependency Inversion | Highly Modular and Testable Code | Overall framework architecture |](#-clean----------separation-of-concerns-dependency-inversion--highly-modular-and-testable-code--overall-framework-architecture-)
      - [Layered Architecture \& CLEAN Principles](#layered-architecture--clean-principles)
  - [Comprehensive Guide to Developing a Selenium C# Framework with xUnit, SpecFlow, and Dependency Injection](#comprehensive-guide-to-developing-a-selenium-c-framework-with-xunit-specflow-and-dependency-injection)
      - [1. **Framework Architecture**](#1-framework-architecture)
    - [**Comparison Table:**](#comparison-table)
    - [OOP, OOD, and CLEAN Architecture Comparison](#oop-ood-and-clean-architecture-comparison)
    - [xUnit vs. Other Testing Frameworks](#xunit-vs-other-testing-frameworks)
    - [SpecFlow BDD Advantages](#specflow-bdd-advantages)
    - [Importance of Dependency Injection](#importance-of-dependency-injection)
- [Enhanced Selenium C# Framework Development Guide](#enhanced-selenium-c-framework-development-guide)
  - [1. Introduction](#1-introduction-1)
  - [2. Core Concepts and Comparisons](#2-core-concepts-and-comparisons)
    - [2.1 OOP, OOD, and CLEAN Architecture Comparison](#21-oop-ood-and-clean-architecture-comparison)
    - [2.2 Framework Components](#22-framework-components)
  - [3. Framework Setup and Structure](#3-framework-setup-and-structure)
    - [3.1 Project Initialization](#31-project-initialization)
    - [3.2 Folder Structure](#32-folder-structure)
  - [4. Core Components Implementation](#4-core-components-implementation)
    - [4.1 WebDriverFactory.cs](#41-webdriverfactorycs)
    - [4.2 BasePage.cs](#42-basepagecs)
    - [4.3 BaseTest.cs](#43-basetestcs)
  - [5. Page Objects](#5-page-objects)
    - [5.1 LoginPage.cs](#51-loginpagecs)
  - [6. SpecFlow Features and Steps](#6-specflow-features-and-steps)
    - [6.1 Login.feature](#61-loginfeature)
    - [6.2 LoginSteps.cs](#62-loginstepscs)
  - [7. Database Helpers](#7-database-helpers)
    - [7.1 SqlDatabaseHelper.cs](#71-sqldatabasehelpercs)
    - [7.2 CosmosDbHelper.cs](#72-cosmosdbhelpercs)
    - [7.3 MongoDbHelper.cs](#73-mongodbhelpercs)
  - [8. API Helpers](#8-api-helpers)
    - [8.1 RestApiHelper.cs](#81-restapihelpercs)
    - [8.2 GraphQlHelper.cs](#82-graphqlhelpercs)
  - [9. Dependency Injection Setup](#9-dependency-injection-setup)
    - [9.1 Startup.cs](#91-startupcs)
  - [10. Reporting Integration](#10-reporting-integration)
    - [10.1 Allure Reporting](#101-allure-reporting)
  - [11. Best Practices and CLEAN Architecture](#11-best-practices-and-clean-architecture)
  - [12. Conclusion](#12-conclusion)


# Framework Development Guide for Selenium C#

I've torn down and rebuilt more Selenium C# frameworks than I care to count. This is the architecture that finally stuck — layered, boring on purpose, and maintainable when the team turns over:

1. Framework Architecture and Design:
The layered architecture approach is crucial for maintaining separation of concerns. The implementation of design patterns like Page Object Model and Factory Pattern will significantly improve code reusability and maintainability.

2. Technology Stack and Setup:
The choice of xUnit, SpecFlow, and Dependency Injection is well-justified. These technologies provide a solid foundation for building a flexible and powerful framework.

3. Core Framework Features:
The custom WebDriver wrapper and Configuration Manager are excellent additions that will enhance the framework's usability and adaptability across different environments.

4. Advanced Testing Capabilities:
The inclusion of asynchronous testing, API testing, and database testing capabilities makes this framework versatile and suitable for comprehensive application testing.

5. Reporting and Documentation:
The integration of Allure Framework and SpecFlow+ LivingDoc will greatly improve test result analysis and documentation, which is often overlooked in many frameworks.

6. Best Practices and Optimization:
The emphasis on code organization, performance optimization, and error handling is crucial for creating a robust and efficient framework.

7. CI/CD Integration:
Providing guidance on CI/CD integration is essential in today's DevOps-oriented development environments.

The conceptual deep dive into OOP, OOD, and CLEAN Architecture provides valuable context for understanding the design principles behind the framework. The comparison of xUnit with other testing frameworks and the explanation of SpecFlow's BDD advantages offer clear justifications for the technology choices.

The inclusion of diagrams (class diagram and workflow diagram) greatly enhances the understanding of the framework's structure and execution flow.

## 1. Introduction

This guide will walk you through creating a comprehensive Selenium C# framework using xUnit, SpecFlow BDD, and Dependency Injection. We'll adhere to OOP, OOD, and CLEAN Architecture principles, enabling testing at each level of the test pyramid, supporting async calls, network interceptions, API testing, database testing, and producing comprehensive reports.

## 2. Concepts and Comparisons
#### **OOP, OOD, and CLEAN Architecture Principles**

- **Object-Oriented Programming (OOP):** Encapsulation, Inheritance, Polymorphism, Abstraction.
- **Object-Oriented Design (OOD):** SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion).
- **CLEAN Architecture:** Separation of concerns, Dependency Rule, Entities, Use Cases, Interface Adapters, Frameworks & Drivers.
#### Comparison Table for OOP, OOD, and CLEAN Architecture

| Concept       | Principles        | Benefits                                  | Application                   |
|---------------|-------------------|-------------------------------------------|-------------------------------|
| OOP           | Encapsulation, Inheritance, Polymorphism | Code Reusability, Modularity | Throughout the framework      |
| OOD           | SOLID principles  | Scalable, Maintainable Software Design    | Class and module design       |
| CLEAN         | Separation of Concerns, Dependency Inversion | Highly Modular and Testable Code | Overall framework architecture |
---

| Principle       | OOP | OOD                  | CLEAN Architecture                         |
|-----------------|-----|----------------------|--------------------------------------------|
| Key Concepts    | Encapsulation, Inheritance, Polymorphism, Abstraction | SOLID Principles | Separation of Concerns, Dependency Rule  |
| Benefits        | Reusability, Modularity | Maintainability, Extensibility | Scalability, Testability, Flexibility    |
| Application     | Class Design            | System Design             | System Architecture and Dependency Management |

#### Layered Architecture & CLEAN Principles
- **Presentation Layer**: Handles the UI interactions.
- **Application Layer**: Coordinates the flow of data between the presentation and domain layers.
- **Domain Layer**: Contains business logic and rules.
- **Infrastructure Layer**: Handles external systems like databases and web services.

---
## Comprehensive Guide to Developing a Selenium C# Framework with xUnit, SpecFlow, and Dependency Injection

#### 1. **Framework Architecture**

**CLEAN Architecture Principles:**
- **Layers:** Separate concerns into layers (Entities, Use Cases, Interface Adapters, Frameworks and Drivers, and Presenters/Controllers).
- **Dependencies:** Ensure inner layers do not depend on outer layers; instead, use interfaces to define interactions.
- **Entities:** Business logic resides here.
- **Use Cases:** Define actions the application can perform.
- **Interface Adapters:** Define how the application interacts with the outside world.
- **Frameworks and Drivers:** External libraries and frameworks.
- **Presenters/Controllers:** Handle input and output.


### **Comparison Table:**

| Principle/Concept        | OOP                           | OOD                             | CLEAN Architecture         |
|---------------------------|-------------------------------|--------------------------------|----------------------------|
| **Layers**                | -                             | -                              | Entities, Use Cases, etc.  |
| **Dependencies**          | Limited                        | Limited                        | Unidirectional             |
| **Business Logic**       | Scattered                      | Scattered                      | Entities                   |
| **Modularity**           | Classes                       | Classes                        | Layers                     |
| **Reusability**          | Inheritance, Polymorphism     | Abstraction, Encapsulation      | Interfaces, Abstract Classes|
| **Testability**          | Harder                         | Easier                         | Easier                     |
| **Scalability**          | Limited                        | Better                         | Highly Scalable            |

---

Let's start by defining and comparing key concepts:

### OOP, OOD, and CLEAN Architecture Comparison

| Concept | Definition | Key Principles | Benefits |
|---------|------------|----------------|----------|
| OOP (Object-Oriented Programming) | A programming paradigm based on the concept of "objects" | Encapsulation, Inheritance, Polymorphism, Abstraction | Code reusability, modularity, easier maintenance |
| OOD (Object-Oriented Design) | A design approach focusing on objects and their interactions | Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion | Improved code organization, scalability, and flexibility |
| CLEAN Architecture | An architectural pattern that separates concerns into distinct layers | Dependency Rule, Independent of Frameworks, Testable, Independent of UI, Independent of Database | Highly maintainable, testable, and adaptable codebase |

**OOP, OOD, CLEAN Comparison:**

| Feature | OOP | OOD | CLEAN Architecture |
|---|---|---|---|
| **Focus** | Objects and their interactions | Design principles and patterns | Separation of concerns |
| **Benefits** | Code reusability, maintainability | Flexibility, scalability | Testability, maintainability |
| **Application in Framework** | Page Objects, Test Classes | Strategy pattern for browser selection, Factory for WebDriver creation | Layered architecture, Dependency Injection |

### xUnit vs. Other Testing Frameworks

xUnit is a popular testing framework for .NET applications. Here's how it compares to other frameworks:

| Feature | xUnit | NUnit | MSTest |
|---------|-------|-------|--------|
| Attribute names | [Fact], [Theory] | [Test], [TestCase] | [TestMethod] |
| Setup/Teardown | Constructor/IDisposable | [SetUp], [TearDown] | [TestInitialize], [TestCleanup] |
| Parameterized tests | [Theory] with [InlineData] | [TestCase] | [DataTestMethod] with [DataRow] |
| Parallel execution | Built-in | Requires configuration | Requires configuration |
| .NET Core support | Native | Supported | Supported |

xUnit is often preferred for its simplicity, built-in parallel test execution, and native .NET Core support.

### SpecFlow BDD Advantages

SpecFlow is a Behavior-Driven Development (BDD) framework for .NET. Its advantages include:

1. Human-readable specifications (Gherkin syntax)
2. Bridging communication between technical and non-technical team members
3. Living documentation that's always up-to-date
4. Easier test maintenance and reusability of step definitions
5. Integration with various testing frameworks, including xUnit

### Importance of Dependency Injection

Dependency Injection (DI) is crucial for:

1. Decoupling code and reducing tight dependencies
2. Improving testability by allowing easy mocking of dependencies
3. Enhancing modularity and flexibility of the codebase
4. Facilitating easier maintenance and updates
5. Supporting the Dependency Inversion principle of SOLID
# Enhanced Selenium C# Framework Development Guide

## 1. Introduction

This comprehensive guide outlines the development of an advanced Selenium C# framework using xUnit, SpecFlow BDD, and Dependency Injection. The framework adheres to OOP, OOD, and CLEAN Architecture principles, supporting multi-level testing, asynchronous operations, network interceptions, API testing (REST and GraphQL), multi-database testing (SQL Server, Cosmos DB, and MongoDB), and detailed reporting.

## 2. Core Concepts and Comparisons

### 2.1 OOP, OOD, and CLEAN Architecture Comparison

| Concept | Definition | Key Principles | Benefits | Application in Framework |
|---------|------------|----------------|----------|--------------------------|
| OOP | Programming paradigm based on "objects" | Encapsulation, Inheritance, Polymorphism, Abstraction | Code reusability, modularity, easier maintenance | Used throughout the framework, especially in Page Objects and Test Classes |
| OOD | Design approach focusing on objects and their interactions | SOLID Principles | Improved code organization, scalability, and flexibility | Applied in the overall structure of the framework and interaction between components |
| CLEAN Architecture | Architectural pattern separating concerns into distinct layers | Dependency Rule, Independence (Frameworks, UI, Database), Testability | Highly maintainable, testable, and adaptable codebase | Implemented in the layered structure of the framework |

### 2.2 Framework Components

- xUnit: Testing framework for .NET
- SpecFlow: BDD framework for .NET
- Dependency Injection: Design pattern for decoupling components
- Selenium WebDriver: Web browser automation tool
- Dapper: Micro ORM for database operations
- RestSharp: HTTP client library for REST API testing
- GraphQL.Client: Library for GraphQL API testing
- Allure: Reporting tool for test results

## 3. Framework Setup and Structure

### 3.1 Project Initialization

1. Create a new xUnit Test Project in Visual Studio.
2. Install necessary NuGet packages:

```
Install-Package Selenium.WebDriver
Install-Package Selenium.Support
Install-Package xunit
Install-Package SpecFlow.xUnit
Install-Package Microsoft.Extensions.DependencyInjection
Install-Package Microsoft.Extensions.Configuration.Json
Install-Package Newtonsoft.Json
Install-Package Dapper
Install-Package Microsoft.Azure.Cosmos
Install-Package MongoDB.Driver
Install-Package RestSharp
Install-Package GraphQL.Client
Install-Package GraphQL.Client.Serializer.Newtonsoft
Install-Package Allure.XUnit
```

### 3.2 Folder Structure

```
SeleniumFramework/
├── Config/
│   └── appsettings.json
├── Core/
│   ├── WebDriverFactory.cs
│   ├── BasePage.cs
│   └── BaseTest.cs
├── Pages/
│   └── LoginPage.cs
├── Tests/
│   ├── Features/
│   │   └── Login.feature
│   └── Steps/
│       └── LoginSteps.cs
├── Helpers/
│   ├── ConfigurationHelper.cs
│   ├── SqlDatabaseHelper.cs
│   ├── CosmosDbHelper.cs
│   ├── MongoDbHelper.cs
│   ├── RestApiHelper.cs
│   └── GraphQlHelper.cs
├── Models/
│   └── User.cs
├── Interfaces/
│   ├── IDataRepository.cs
│   └── IApiClient.cs
└── Startup.cs
```

## 4. Core Components Implementation

### 4.1 WebDriverFactory.cs

```csharp
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Firefox;

public class WebDriverFactory
{
    public IWebDriver CreateDriver(string browserType)
    {
        return browserType.ToLower() switch
        {
            "chrome" => new ChromeDriver(),
            "firefox" => new FirefoxDriver(),
            _ => throw new ArgumentException($"Unsupported browser type: {browserType}")
        };
    }
}
```

### 4.2 BasePage.cs

```csharp
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

public abstract class BasePage
{
    protected IWebDriver Driver;
    protected WebDriverWait Wait;

    protected BasePage(IWebDriver driver)
    {
        Driver = driver;
        Wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
    }

    protected async Task<IWebElement> FindElementAsync(By locator)
    {
        return await Task.Run(() => Wait.Until(d => d.FindElement(locator)));
    }

    protected async Task EnterTextAsync(By locator, string text)
    {
        var element = await FindElementAsync(locator);
        await Task.Run(() => element.SendKeys(text));
    }

    protected async Task ClickElementAsync(By locator)
    {
        var element = await FindElementAsync(locator);
        await Task.Run(() => element.Click());
    }
}
```

### 4.3 BaseTest.cs

```csharp
using Xunit;

public abstract class BaseTest : IAsyncLifetime
{
    protected IWebDriver Driver;
    protected readonly WebDriverFactory DriverFactory;

    protected BaseTest(WebDriverFactory driverFactory)
    {
        DriverFactory = driverFactory;
    }

    public Task InitializeAsync()
    {
        Driver = DriverFactory.CreateDriver("chrome");
        return Task.CompletedTask;
    }

    public Task DisposeAsync()
    {
        Driver?.Quit();
        return Task.CompletedTask;
    }
}
```

## 5. Page Objects

### 5.1 LoginPage.cs

```csharp
public class LoginPage : BasePage
{
    private readonly By _usernameField = By.Id("username");
    private readonly By _passwordField = By.Id("password");
    private readonly By _loginButton = By.Id("login-button");

    public LoginPage(IWebDriver driver) : base(driver) { }

    public async Task EnterUsernameAsync(string username)
    {
        await EnterTextAsync(_usernameField, username);
    }

    public async Task EnterPasswordAsync(string password)
    {
        await EnterTextAsync(_passwordField, password);
    }

    public async Task ClickLoginAsync()
    {
        await ClickElementAsync(_loginButton);
    }

    public async Task LoginAsync(string username, string password)
    {
        await EnterUsernameAsync(username);
        await EnterPasswordAsync(password);
        await ClickLoginAsync();
    }
}
```

## 6. SpecFlow Features and Steps

### 6.1 Login.feature

```gherkin
Feature: Login Functionality

Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter username "validuser" and password "validpass"
    And I click the login button
    Then I should be logged in successfully
```

### 6.2 LoginSteps.cs

```csharp
using TechTalk.SpecFlow;
using Xunit;

[Binding]
public class LoginSteps
{
    private readonly LoginPage _loginPage;

    public LoginSteps(LoginPage loginPage)
    {
        _loginPage = loginPage;
    }

    [Given(@"I am on the login page")]
    public void GivenIAmOnTheLoginPage()
    {
        // Navigate to login page
    }

    [When(@"I enter username ""(.*)"" and password ""(.*)""")]
    public async Task WhenIEnterUsernameAndPassword(string username, string password)
    {
        await _loginPage.EnterUsernameAsync(username);
        await _loginPage.EnterPasswordAsync(password);
    }

    [When(@"I click the login button")]
    public async Task WhenIClickTheLoginButton()
    {
        await _loginPage.ClickLoginAsync();
    }

    [Then(@"I should be logged in successfully")]
    public void ThenIShouldBeLoggedInSuccessfully()
    {
        // Assert successful login
    }
}
```

## 7. Database Helpers

### 7.1 SqlDatabaseHelper.cs

```csharp
using System.Data.SqlClient;
using Dapper;

public class SqlDatabaseHelper
{
    private readonly string _connectionString;

    public SqlDatabaseHelper(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("SqlConnection");
    }

    public async Task<IEnumerable<T>> QueryAsync<T>(string sql, object param = null)
    {
        using var connection = new SqlConnection(_connectionString);
        return await connection.QueryAsync<T>(sql, param);
    }

    public async Task<int> ExecuteAsync(string sql, object param = null)
    {
        using var connection = new SqlConnection(_connectionString);
        return await connection.ExecuteAsync(sql, param);
    }
}
```

### 7.2 CosmosDbHelper.cs

```csharp
using Microsoft.Azure.Cosmos;

public class CosmosDbHelper
{
    private readonly CosmosClient _client;
    private readonly string _databaseId;

    public CosmosDbHelper(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("CosmosDbConnection");
        _databaseId = configuration["CosmosDb:DatabaseId"];
        _client = new CosmosClient(connectionString);
    }

    public async Task<T> GetItemAsync<T>(string containerId, string id, string partitionKey)
    {
        var container = _client.GetContainer(_databaseId, containerId);
        var response = await container.ReadItemAsync<T>(id, new PartitionKey(partitionKey));
        return response.Resource;
    }

    public async Task<T> CreateItemAsync<T>(string containerId, T item, string partitionKey)
    {
        var container = _client.GetContainer(_databaseId, containerId);
        var response = await container.CreateItemAsync(item, new PartitionKey(partitionKey));
        return response.Resource;
    }
}
```

### 7.3 MongoDbHelper.cs

```csharp
using MongoDB.Driver;

public class MongoDbHelper
{
    private readonly IMongoDatabase _database;

    public MongoDbHelper(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("MongoDbConnection");
        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(configuration["MongoDb:DatabaseName"]);
    }

    public async Task<T> GetDocumentAsync<T>(string collectionName, FilterDefinition<T> filter)
    {
        var collection = _database.GetCollection<T>(collectionName);
        return await collection.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<T> InsertDocumentAsync<T>(string collectionName, T document)
    {
        var collection = _database.GetCollection<T>(collectionName);
        await collection.InsertOneAsync(document);
        return document;
    }
}
```

## 8. API Helpers

### 8.1 RestApiHelper.cs

```csharp
using RestSharp;
using Newtonsoft.Json;

public class RestApiHelper
{
    private readonly RestClient _client;

    public RestApiHelper(IConfiguration configuration)
    {
        var baseUrl = configuration["Api:BaseUrl"];
        _client = new RestClient(baseUrl);
    }

    public async Task<T> GetAsync<T>(string resource)
    {
        var request = new RestRequest(resource);
        var response = await _client.ExecuteAsync(request);
        return JsonConvert.DeserializeObject<T>(response.Content);
    }

    public async Task<T> PostAsync<T>(string resource, object payload)
    {
        var request = new RestRequest(resource).AddJsonBody(payload);
        var response = await _client.ExecutePostAsync(request);
        return JsonConvert.DeserializeObject<T>(response.Content);
    }
}
```

### 8.2 GraphQlHelper.cs

```csharp
using GraphQL;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.Newtonsoft;

public class GraphQlHelper
{
    private readonly GraphQLHttpClient _client;

    public GraphQlHelper(IConfiguration configuration)
    {
        var graphQlUrl = configuration["Api:GraphQlUrl"];
        _client = new GraphQLHttpClient(graphQlUrl, new NewtonsoftJsonSerializer());
    }

    public async Task<T> ExecuteQueryAsync<T>(string query, object variables = null)
    {
        var request = new GraphQLRequest
        {
            Query = query,
            Variables = variables
        };

        var response = await _client.SendQueryAsync<T>(request);
        return response.Data;
    }
}
```

## 9. Dependency Injection Setup

### 9.1 Startup.cs

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton<IConfiguration>(sp =>
        {
            return new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("Config/appsettings.json")
                .Build();
        });

        services.AddScoped<WebDriverFactory>();
        services.AddScoped<IWebDriver>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var factory = sp.GetRequiredService<WebDriverFactory>();
            return factory.CreateDriver(config["BrowserType"]);
        });

        services.AddScoped<LoginPage>();
        services.AddScoped<SqlDatabaseHelper>();
        services.AddScoped<CosmosDbHelper>();
        services.AddScoped<MongoDbHelper>();
        services.AddScoped<RestApiHelper>();
        services.AddScoped<GraphQlHelper>();

        services.AddAllureXunit();
    }
}
```

## 10. Reporting Integration

### 10.1 Allure Reporting

Add Allure attributes to your test methods:

```csharp
[AllureXunit]
[AllureFeature("Login")]
public class LoginTests : BaseTest
{
    private readonly LoginPage _loginPage;

    public LoginTests(WebDriverFactory driverFactory, LoginPage loginPage) : base(driverFactory)
    {
        _loginPage = loginPage;
    }

    [AllureStory("Successful Login")]
    [Fact]
    public async Task SuccessfulLogin()
    {
        await _loginPage.LoginAsync("validuser", "validpass");
        // Assert successful login
    }
}
```

## 11. Best Practices and CLEAN Architecture

To adhere to CLEAN Architecture principles:

1. **Entities**: Define core business objects (e.g., User, Product) in the Models folder.
2. **Use Cases**: Implement application-specific business rules in separate classes.
3. **Interface Adapters**: Create interfaces for repositories and API clients in the Interfaces folder.
4. **Frameworks and Drivers**: Keep external framework interactions (Selenium, databases, APIs) in separate helper classes.

To adhere to CLEAN Architecture principles:

1. **Entities**: Define core business objects (e.g., User, Product) in the Models folder.
2. **Use Cases**: Implement application-specific business rules in separate classes.
3. **Interface Adapters**: Create interfaces for repositories and API clients in the Interfaces folder.
4. **Frameworks and Drivers**: Keep external framework interactions (Selenium, databases, APIs) in separate helper classes.

Example of a Use Case:

```csharp
public interface ILoginUseCase
{
    Task<bool> ExecuteAsync(string username, string password);
}

public class LoginUseCase : ILoginUseCase
{
    private readonly IUserRepository _userRepository;
    private readonly LoginPage _loginPage;

    public LoginUseCase(IUserRepository userRepository, LoginPage loginPage)
    {
        _userRepository = userRepository;
        _loginPage = loginPage;
    }

    public async Task<bool> ExecuteAsync(string username, string password)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null || !user.VerifyPassword(password))
        {
            return false;
        }

        await _loginPage.LoginAsync(username, password);
        return true;
    }
}
```
![mermaid-diagram-2024-09-09-070100](https://github.com/user-attachments/assets/2ae13f3e-9f67-4c93-802c-b2ae15c7d02a)
This Use Case example demonstrates how to combine business logic (user verification) with UI interactions (login page) while adhering to the Dependency Inversion principle. The `IUserRepository` interface allows for easy substitution of different data sources (e.g., SQL, Cosmos DB, or MongoDB) without changing the Use Case implementation.

## 12. Conclusion

This enhanced Selenium C# framework guide provides a comprehensive approach to building a robust, scalable, and maintainable test automation solution. Key features include:

1. Asynchronous programming for improved performance
2. Support for multiple databases (SQL Server, Cosmos DB, and MongoDB)
3. REST API and GraphQL testing capabilities
4. BDD support with SpecFlow
5. Dependency Injection for improved modularity and testability
6. Adherence to CLEAN Architecture principles
7. Integrated reporting with Allure

By following this guide, you can create a powerful test automation framework that supports a wide range of testing scenarios, from UI testing to API and database testing, all while maintaining a clean and extensible codebase.

## Sources & Further Reading

1. [Selenium with C# — official docs](https://www.selenium.dev/documentation/webdriver/getting_started/install_library/#c)
2. [SpecFlow documentation](https://specflow.org/docs/)
3. [xUnit.net — getting started](https://xunit.net/docs/getting-started/v2/getting-started)
4. [Page Object Model — Selenium design pattern](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)

*See also:* [Selenium in 2026: A Beginner's Guide (Jul 2026)]({% link _posts/2026-07-01-selenium-2026-beginners-guide.md %}) — the 2026 refresh with MCP server integration as a new project dependency.

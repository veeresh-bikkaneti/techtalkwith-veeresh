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

I've torn down and rebuilt more Selenium C# frameworks than I care to count. This is the architecture that finally stuck — layered, boring on purpose, and maintainable when the team turns over.

What you need:

- **WebDriver layer** — abstracts browser setup so you can swap Chrome for Firefox without touching a test
- **Page Objects** — each page is one class; change the HTML, fix one place
- **SpecFlow for BDD** — write tests in English; developers and testers speak the same language
- **Dependency Injection** — no tight coupling; database, API, UI layers are swappable
- **Database + API helpers** — SQL, Cosmos, MongoDB, REST, GraphQL all supported
- **Allure reports** — traces that tell the *why* when a test fails

This isn't a toy. This is the architecture I'd use if I had to hand this off to a new team tomorrow.

## Architecture Foundations

Think of the framework as layers: presentation, application, domain, infrastructure. Each layer talks to the next through interfaces. When requirements change, you update one layer. Tests stay green.

### Why Interfaces First

Your tests shouldn't care if you're using Cosmos or SQL. Your Selenium layer shouldn't know what database lives behind it. Interfaces enforce this separation. Define `IUserRepository`, then write implementations — SQL one, Cosmos one, Mock one for tests. Swap them at runtime.

### Technology Stack

- **xUnit** — Faster, cleaner assertions than NUnit. Parallel by default.
- **SpecFlow** — Gherkin syntax bridges QA and dev. Tests read like requirements.
- **Dependency Injection** — Microsoft.Extensions DI is lightweight and battle-tested.
- **Database support** — Dapper (SQL), Azure Cosmos SDK, MongoDB.Driver.
- **API support** — RestSharp (REST), GraphQL.Client.
- **Reporting** — Allure gives you traces, not just pass/fail.

### Folder Structure

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

## Building It — Step by Step

### Setup

```bash
dotnet new xunit -n SeleniumFramework
cd SeleniumFramework
dotnet add package Selenium.WebDriver
dotnet add package Selenium.Support
dotnet add package SpecFlow.xUnit
dotnet add package Microsoft.Extensions.DependencyInjection
dotnet add package Microsoft.Extensions.Configuration.Json
dotnet add package Newtonsoft.Json
dotnet add package Dapper
dotnet add package Microsoft.Azure.Cosmos
dotnet add package MongoDB.Driver
dotnet add package RestSharp
dotnet add package GraphQL.Client
dotnet add package GraphQL.Client.Serializer.Newtonsoft
dotnet add package Allure.XUnit
```

### The WebDriver Factory

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

### The Base Page (Shared Element Interactions)

Every page has locators and waits. `BasePage` is where they live.

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

### The Base Test (Setup and Teardown)

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

### A Real Page Object

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

## SpecFlow for Readability

Write scenarios in English. The step definitions bridge to your Page Objects.

### The Feature File

```gherkin
Feature: Login Functionality

Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter username "validuser" and password "validpass"
    And I click the login button
    Then I should be logged in successfully
```

### The Step Definitions

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

## Database Helpers — Abstraction for Multiple Stores

### SQL via Dapper

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

### Cosmos DB

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

### MongoDB

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

## API Helpers

### REST (RestSharp)

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

### GraphQL

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

## Wiring It All Up — Dependency Injection

This is where the magic happens. Register everything once, swap implementations at runtime.

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

## Reporting with Allure

Don't just report pass/fail. Report *why*.

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

## The Pattern in Practice — Use Cases

A Use Case combines business logic and UI. It's where your tests *do* something meaningful.

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

Notice: the Use Case doesn't know whether `IUserRepository` is SQL, Cosmos, or a mock. The `LoginPage` doesn't know what database backs it. This is the payoff of interfaces — swappable parts, testable code.

## Lessons Learned

Here's what actually matters:

1. **Interfaces first** — Define contracts before implementations. Test against interfaces, not concrete classes.
2. **Layers separate concerns** — Page Objects don't know about databases. Use Cases don't know about Selenium. Database helpers don't know about tests.
3. **Async by default** — Selenium and databases are I/O bound. Async gets you parallelism and responsive CI.
4. **BDD for communication** — Gherkin syncs QA and dev. When you write scenarios together, bugs drop by half.
5. **One folder, one responsibility** — Models in Models/, Pages in Pages/, Helpers in Helpers/. No guessing where code lives.

## Conclusion

This architecture isn't fancy. It's boring. That's the point. Boring code survives handoffs, team turnover, requirement changes. In six months when someone else owns this, they'll understand it in an afternoon.

Start here. Add complexity only when you need it. Don't abstract early. Let the code tell you where it needs abstraction, then refactor once. That's the difference between architecture and over-engineering.

## Sources & Further Reading

1. [Selenium with C# — official docs](https://www.selenium.dev/documentation/webdriver/getting_started/install_library/#c)
2. [SpecFlow documentation](https://specflow.org/docs/)
3. [xUnit.net — getting started](https://xunit.net/docs/getting-started/v2/getting-started)
4. [Page Object Model — Selenium design pattern](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)

*See also:* [Selenium in 2026: A Beginner's Guide (Jul 2026)]({{ site.baseurl }}{% link _posts/2026-07-01-selenium-2026-beginners-guide.md %}) — the 2026 refresh with MCP server integration as a new project dependency.

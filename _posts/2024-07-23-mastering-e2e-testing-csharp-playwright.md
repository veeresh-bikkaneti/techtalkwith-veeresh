---
layout: post
title: "Mastering E2E Testing with C# and Microsoft Playwright: Top Tips and Tricks"
date: 2024-07-23
categories: [automation, tools]
tags: [playwright, csharp, e2e-testing, api-testing, sql-server, tracing]
excerpt: "How to set up Playwright, drive cross-browser testing, make API calls, validate against a SQL Server database, and capture traces and videos on failure."
reading_time: 5
---

When testing an application, it's crucial to attack from all angles. Picture a testing pyramid where you not only scrutinize the API but also validate the database simultaneously to guarantee the API is delivering as promised.

Having delved into the world of Microsoft Playwright, I challenge you to take your testing game up a notch. Dive into API testing with the Microsoft Playwright client and watch your testing prowess soar!

## Step #1: Install Playwright

```bash
dotnet new console -n PlaywrightDemo
cd PlaywrightDemo
dotnet add package Microsoft.Playwright
```

The purpose of this call is to execute the Playwright installation process, which is necessary to set up the required browsers and dependencies for Playwright to function properly.

```csharp
// Call the Main method of the Program class with an array containing a single string "install"
// The result of this method call is stored in the variable exitCode.
int exitCode = Program.Main(new[] { "install" });

// Check if the exit code is not equal to 0
// Checking the exit code helps determine if the Playwright installation was successful or if there was an issue during the process.
if (exitCode != 0)
    // Throw a new Exception with a message that includes the exit code
    throw new Exception($"Playwright exited with code {exitCode}");

using Microsoft.Playwright;
using System.Threading.Tasks;

class Program
{
    public static async Task Main()
    {
        var playwright = await Playwright.CreateAsync();
        var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = false });
        var page = await browser.NewPageAsync();
        await page.GotoAsync("https://example.com");
        await page.ScreenshotAsync(new PageScreenshotOptions { Path = "screenshot.png" });
        await browser.CloseAsync();
    }
}
```

## Step #2: Set Up the Playwright Driver and Cross-Browser Setup

```csharp
// Create an instance of Playwright
IPlaywright? playwright = await Playwright.CreateAsync();

// Initialize the browser variable
IBrowser? browser = null;

// Test values for browser settings
bool headless = true;
int defaultTimeout = 30000; // 30 seconds
string browserType = "Chromium"; // Change this value to test different browsers
string traceName = "TestTrace";
int slowMo = 50; // Slow motion in milliseconds

// Switch statement to launch the browser based on the specified browser type
switch (browserType)
{
    case "Firefox":
        // Launch Firefox browser with specified options
        browser = await playwright.Firefox.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = headless,
            Timeout = defaultTimeout
        });
        break;
    case "Edge":
        // Launch Edge browser with specified options
        browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = headless,
            Timeout = defaultTimeout,
            Channel = "msedge",
        });
        break;
    case "Webkit":
        // Launch Webkit browser with specified options
        browser = await playwright.Webkit.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = headless,
            Timeout = defaultTimeout
        });
        break;
    case "Chromium":
        // Launch Chromium browser with specified options
        browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = headless,
            Timeout = defaultTimeout
        });
        break;
    case "Chrome":
        // Launch Chrome browser with specified options
        browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = headless,
            Timeout = defaultTimeout,
            Channel = "chrome",
            SlowMo = slowMo,
        });
        break;
    default:
        // Default to launching Chromium browser with specified options
        browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = headless,
            Timeout = defaultTimeout
        });
        break;
}

// Create directory for video recordings
string? recordVideoDirPath = Path.Combine(Environment.CurrentDirectory, $"./TestOutPut/VideoRecording/{DateTime.Now:yyyyMMddHHmmss}");
Directory.CreateDirectory(recordVideoDirPath);

// Create a new browser context with specified options
IBrowserContext? browserContext = await browser.NewContextAsync(new BrowserNewContextOptions()
{
    RecordVideoDir = recordVideoDirPath,
    RecordHarPath = Path.Combine(Environment.CurrentDirectory, "./TestOutPut/XHARFile.har"),
    RecordHarMode = HarMode.Full,
    IgnoreHTTPSErrors = true
});

// Clear cookies and permissions in the browser context
await browserContext.ClearCookiesAsync();
await browserContext.ClearPermissionsAsync();

// Start tracing in the browser context with specified options
await browserContext.Tracing.StartAsync(new()
{
    Sources = true,
    Name = traceName,
    Screenshots = true,
    Snapshots = true
});

// Create a new page in the browser context
IPage? newPageAsync = await browserContext.NewPageAsync();

// Add an event handler for the Response event
newPageAsync.Response += (_, response) =>
{
    // Log the response status and URL if the status is not 200
    if (response.Status != 200)
        System.Diagnostics.Debug.WriteLine(string.Format("[{0}] [{1}] {2}", DateTime.Now, "INFO", $"{response.Status} => {response.Url}"));
};
```

## Step #3: How to Make an API Call

```csharp
// Create a new API request context with specified options
IAPIRequestContext request = await playwright.APIRequest.NewContextAsync(new()
{
    // Set the base URL for the API requests
    BaseURL = "https://example.com/api",

    // Set extra HTTP headers for the API requests
    ExtraHTTPHeaders = new Dictionary<string, string>()
    {
        { "Content-Type", "application/xml" }
    },

    // Ignore HTTPS errors
    IgnoreHTTPSErrors = true
});

// Send a GET request to the specified path/resource with the given options
var response = await request.GetAsync("/path/resource",
    new APIRequestContextOptions()
    {
        // Set the data payload for the request (if any)
        Data = Payload,

        // Specify the HTTP method to use for the request
        Method = "POST/GET"
    });
```

## Step #4: Install SqlClient

```bash
Install-Package System.Data.SqlClient
```

## Step #5: Call a Select Query

```csharp
using System;
using System.Collections.Generic;
using System.Data.SqlClient;

namespace GenericDatabaseQuery
{
    public class DatabaseHelper
    {
        /// <summary>
        /// Open DB connection, execute a query, read the response, and return the result as a list of dictionaries.
        /// </summary>
        public static List<Dictionary<string, string>> ExecuteSelectQueryAddResultsAsKeyValue(string queryString, string connectionString)
        {
            // Create a list to store dictionaries
            List<Dictionary<string, string>> dataList = new List<Dictionary<string, string>>();
            try
            {
                // Create a SqlConnection object
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    // Open the connection
                    connection.Open();

                    // Create a SqlCommand object with the query string and connection
                    using (SqlCommand command = new SqlCommand(queryString, connection))
                    {
                        // Execute the query and get a SqlDataReader object
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            // Loop through the rows
                            while (reader.Read())
                            {
                                // Create a dictionary to store column names and values for each row
                                Dictionary<string, string> rowDict = new Dictionary<string, string>();

                                // Loop through columns
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    // Add column name and value to the dictionary
                                    rowDict.Add(reader.GetName(i), reader[i].ToString());
                                }

                                // Add the dictionary to the list
                                dataList.Add(rowDict);
                            }

                            // Output the data
                            foreach (var data in dataList)
                            {
                                foreach (var kvp in data)
                                {
                                    Console.WriteLine($"Column: {kvp.Key}, Value: {kvp.Value}");
                                }
                                Console.WriteLine();
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error: " + ex.Message);
            }
            return dataList;
        }
    }
}
```

## Step #6: Compare Results from API Response vs. Actual Data in DB

Call `ExecuteSelectQueryAddResultsAsKeyValue` to seed a baseline from the database, then assert against the API response payload. The pattern: shape both into `List<Dictionary<string, string>>`, then assert equivalence row-by-row so that an API regression shows up as a specific row mismatch.

## Step #7: Tear Down — Capture Trace and Recording on Failure

```csharp
#region Trace
string? tracingPath = Path.Combine(Environment.CurrentDirectory, $"./TestOutPut/trace/{_traceName}__{DateTime.Now:yyyyMMdd_HHmmss}");
await browserContext.Tracing.StopAsync(new()
{
    Path = string.Concat(tracingPath, ".zip")
});
#endregion Trace

// Close page
await page.CloseAsync();

#region VideoRecording
string savedHere = string.Empty;

// Check if video recording is available
if (page.Video != null)
{
    try
    {
        // Save the recording
        savedHere = await page.Video.PathAsync();
        System.Diagnostics.Debug.WriteLine(string.Format("[{0}] [{1}] {2}", DateTime.Now, "INFO", $"Recording saved to: {savedHere}"));
    }
    catch (Exception ex)
    {
        System.Diagnostics.Debug.WriteLine(string.Format("[{0}] [{1}] {2}", DateTime.Now, "ERROR", $"Failed to save recording: {ex.Message}"));
    }
}
else
{
    System.Diagnostics.Debug.WriteLine(string.Format("[{0}] [{1}] {2}", DateTime.Now, "INFO", "No video recording available."));
}

_specFlowOutputHelper.WriteLine(string.Format("[{0}] [{1}] {2}", DateTime.Now, "INFO", $"Screen recording is published in path: {savedHere}"));
System.Diagnostics.Debug.WriteLine(string.Format("[{0}] [{1}] {2}", DateTime.Now, "INFO", $"Screen recording is published in path: {savedHere}"));
#endregion VideoRecording

_specFlowOutputHelper.AddAttachment(savedHere);

// Make sure to close so videos are saved.
await browserContext.CloseAsync();

// Close browser
await browser.CloseAsync();
```

## Final Thought

The testing power of Microsoft Playwright in C# lets you orchestrate UI, API, and database calls inside a single test — and capture trace + video evidence only on failure, so the suite stays fast. Combine that with cross-browser matrix execution and you have a high-fidelity E2E layer that runs alongside your unit and API tiers.

*See also:* [Playwright MCP + Multi-Agent Testing in 2026 (Aug 2026)]({% link _posts/2026-08-01-playwright-mcp-multi-agent-testing.md %}) — the 2026 refresh with MCP server setup and multi-agent orchestration.

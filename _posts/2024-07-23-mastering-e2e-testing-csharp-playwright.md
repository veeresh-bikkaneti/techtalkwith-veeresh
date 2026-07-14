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

## Step #1: Install Playwright — Build Your Foundation

```bash
dotnet new console -n PlaywrightDemo
cd PlaywrightDemo
dotnet add package Microsoft.Playwright
```

Just like the pyramid's base must be solid, Playwright needs the browser binaries installed. This isn't optional — it's the bedrock.

```csharp
// Playwright's installer downloads and configures the browser binaries.
// I learned the hard way that skipping this step leaves you debugging "browser not found" at 2am.
int exitCode = Program.Main(new[] { "install" });

// Always check the exit code — it's your early warning system.
if (exitCode != 0)
    throw new Exception($"Playwright exited with code {exitCode}. Browser binaries failed to install.");

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

## Step #2: Multi-Browser Setup — The Pyramid's Middle Layers

The pyramid's strength comes from testing across multiple browsers. Here's how I orchestrate that — thinking of each browser launch as another "floor" of the pyramid.

```csharp
// Start with Playwright's factory — your entry point to all browser engines.
IPlaywright? playwright = await Playwright.CreateAsync();

// I learned this the hard way: test on Chromium, Firefox, AND WebKit.
// Bugs hiding in Safari? WebKit catches them. Chrome-only bias costs credibility.
IBrowser? browser = null;
string browserType = "Chromium"; // Change this to test Firefox, Edge, Webkit
int defaultTimeout = 30000;      // 30 seconds — enough for real-world waits
bool headless = true;            // Headless in CI, headed locally for debugging

// Switch on browser type — this is your "pick a leg of the pyramid" logic
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

## Step #3: API Calls — Attacking from Another Angle

Remember: the pyramid is strong because you test from every angle. UI alone isn't enough — you need the API layer too. Here's how Playwright lets you make raw API calls *within the same test session*, no separate tool required.

```csharp
// Create an API context using the same Playwright instance.
// This matters because the session is shared — cookies, auth headers, everything carries over.
IAPIRequestContext request = await playwright.APIRequest.NewContextAsync(new()
{
    BaseURL = "https://example.com/api",

    // Custom headers — this is where auth tokens live.
    ExtraHTTPHeaders = new Dictionary<string, string>()
    {
        { "Content-Type", "application/xml" }
    },

    IgnoreHTTPSErrors = true
});

// Make the API call. The power here? You can assert the response payload
// *and then* verify the UI reflects it in the same test. That's pyramid thinking.
var response = await request.GetAsync("/path/resource",
    new APIRequestContextOptions()
    {
        Data = Payload,
        Method = "POST/GET"
    });
```

## Step #4–5: Database Validation — Completing the Pyramid

The pyramid is incomplete without the database layer. You can hit the API, see it succeed, *and still have the data corruption hiding in the DB*. I learned this when a bug shipped because nobody looked at what the database actually stored.

Install SqlClient:
```bash
Install-Package System.Data.SqlClient
```

Now query the database from within the same test. This is the real power — one test, three angles: UI → API → Database.

```csharp
public class DatabaseHelper
{
    /// <summary>
    /// The pyramid's foundation: hit the DB directly to validate state.
    /// This is how you catch the bugs that only show up when you look at the actual data.
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

## Step #6: Close the Loop — Compare Pyramid Layers

This is where the pyramid's power becomes obvious. Here's the pattern I use:

1. Call the API and capture the response.
2. Query the database for the ground truth.
3. Assert they match.

If the UI says "Success" but the database says "Failed," you've caught a critical bug that most tests miss.

```csharp
// Pseudo-code pattern:
var apiResponse = await request.GetAsync("/user/123"); // API layer
var dbRecords = ExecuteSelectQueryAddResultsAsKeyValue("SELECT * FROM Users WHERE Id=123", connStr); // DB layer

// Both should be identical. If they're not, you've found a data corruption bug.
Assert.AreEqual(apiResponse.JsonBody, dbRecords);
```

This is the pyramid in action: UI confirms it looks right, API confirms it responded correctly, database confirms the state is actually saved.

## Step #7: Tear Down — Evidence Only on Failure

This is the secret weapon I learned from debugging failed tests on CI: capture traces and videos *only when the test fails*. Why? Because traces are huge. A passing test doesn't need 50MB of replay data — but a failing test needs every millisecond documented.

```csharp
// Stop tracing — this gives you a replay of the entire test execution.
// I use this to debug race conditions that never happen on my machine.
await browserContext.Tracing.StopAsync(new()
{
    Path = string.Concat(tracingPath, ".zip")
});

await page.CloseAsync();

// Video recording — the "oh you won't believe what happened" archive.
// This is how you show stakeholders exactly what went wrong, not just numbers.
if (page.Video != null)
{
    try
    {
        savedHere = await page.Video.PathAsync();
        System.Diagnostics.Debug.WriteLine($"Video proof saved: {savedHere}");
    }
    catch (Exception ex)
    {
        System.Diagnostics.Debug.WriteLine($"Failed to save video: {ex.Message}");
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

## Final Thought — The Pyramid Complete

This is the pattern I use every day: hit the pyramid from all three angles in one test. UI says success? Check the API response. API says success? Hit the database. All three aligned? You've shipped quality. 

That's the power of Playwright — no separate tools, no session fragmentation, one coherent test that catches the bugs others miss. Add cross-browser execution to that, and you've built a pyramid that actually holds.

## Sources & Further Reading

1. [Playwright .NET — intro](https://playwright.dev/dotnet/docs/intro)
2. [Playwright tracing — debug failed tests](https://playwright.dev/docs/trace-viewer)
3. [API testing with Playwright](https://playwright.dev/docs/api-testing)
4. [Cross-browser testing — Playwright](https://playwright.dev/docs/browsers)

*See also:* [Mastering Async Operations in C# Playwright (Aug 2024)]({{ site.baseurl }}{% link _posts/2024-08-30-mastering-async-operations-csharp-playwright.md %}) · [Playwright MCP + Multi-Agent Testing (Jul 2026)]({{ site.baseurl }}{% link _posts/2026-07-15-playwright-mcp-multi-agent-testing.md %})

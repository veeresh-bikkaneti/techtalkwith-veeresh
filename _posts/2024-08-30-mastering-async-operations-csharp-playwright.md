---
layout: post
title: "Mastering Asynchronous Operations in C# with Microsoft Playwright"
date: 2024-08-30
categories: [automation, tools]
tags: [playwright, csharp, async, wait-for-response, api-testing, testing]
excerpt: "When your test clicks a button, you can't just assume the API response landed. Here's how to actually wait for it—and get the data into your assertions."
reading_time: 4
---

## Waiting for Network Responses: The "You're Not Done Yet" Guide

> *"The network is fast... sometimes. And that's when your tests flake."*

You're building test automation for an API-driven app. A user clicks "Submit", which fires off an API call to `/api/order`. Your test needs the response data to validate what happens next—but if you click and immediately assert, you've beaten the network to the punch. The API hasn't answered yet. Your test fails. Locally it passes (fast network). On CI, it's flaky. You've probably been there.

**The fix:** Don't guess when the response arrives. Make your test *wait for it explicitly* using `WaitForResponseAsync`, then grab the data and verify it. This post walks you through doing that in C# with Playwright — step by step, with no secrets.

---

## How Async Waiting Actually Works

Think of it like waiting for a package delivery. You don't stand at the door and check every millisecond. You ask the delivery service, "Tell me when the package from FedEx arrives," then do other stuff. When it arrives, you're notified and can open it. `WaitForResponseAsync` works the same way: you tell Playwright, "I'm waiting for a response matching `/api/endpoint`," and Playwright watches the network. The moment that response lands, you can read its body, status, headers—whatever you need.

Here's what we're doing today:

1. **Listen for the API response** (before you click)
2. **Wait for the button to show up** (visibility check)
3. **Click the button and wait for navigation** (at the same time)
4. **Confirm the API response is complete**
5. **Assert the response status** (was it a 200?)
6. **Log the request/response details** (debugging)
7. **Deserialize and use the data** (turn JSON into objects)

Let's go.

---

## Step by Step: Making It Work

### 1. Start Listening for the Response

Before you click anything, tell Playwright you're waiting for a response. You do this by setting up a task that watches for a network request matching a regex pattern:



```csharp
// Start listening for a response from /api/endpoint
// This doesn't wait yet—it just sets up a listener
Task<IResponse>? apiResponseTask = _page.WaitForResponseAsync(new Regex("/api/endpoint"));
IResponse apiResponse = null;
MyDataObject dataObject = null;
```

The `WaitForResponseAsync` call with a regex pattern tells Playwright, "When you see a response from a URL matching `/api/endpoint`, grab it." The method returns a `Task` — a promise that gets fulfilled when the response actually arrives. You're not blocked yet; you're just watching.

### 2. Wait for the Button to Show Up

Before you click anything, make sure the button is actually clickable. `WaitForAsync` with `Visible` state means, "Don't move until I can see this button on the page."

```csharp
await _page.GetByRole(AriaRole.Button, new() { Name = "Submit" }).WaitForAsync(new()
{
    State = WaitForSelectorState.Visible,
    Timeout = 5000
});
```

### 3. Click the Button *and* Wait for Navigation (at the Same Time)

Here's a trick: you don't want to click first, then wait for navigation. You want both to happen together. That's what `Task.WhenAll` does — it waits for *all* the tasks to finish before moving on. So you:

- Tell Playwright to watch for navigation to `/next-page` (and wait until the page is loaded)
- Click the button
- Wait for both to complete

If the navigation doesn't happen within 5 seconds, the test fails. (That timeout is configurable; 5 seconds is reasonable for most apps.)

```csharp
await Task.WhenAll(
    _page.WaitForNavigationAsync(new PageWaitForNavigationOptions
    {
        UrlRegex = new Regex("/next-page"),
        WaitUntil = WaitUntilState.DOMContentLoaded,
        Timeout = 5000
    }),
    _page.GetByRole(AriaRole.Button, new() { Name = "Submit" }).ClickAsync()
);
```

This pattern prevents a race condition: if you click first, then wait for navigation, the page might navigate before you even finish clicking. `Task.WhenAll` ensures you're set up to listen *before* you trigger the action.

### 4. Make Sure the Response Finished Arriving

The response might have started arriving, but you want to be sure it's *complete* before you read it. `FinishedAsync()` waits for the response body to fully load. Wrap it in a try-catch because network stuff can fail, and you want to handle that gracefully:

```csharp
try
{
    // Wait for the API response to finish completely
    await (await apiResponseTask).FinishedAsync();
}
catch (Exception)
{
    // Handle exceptions if any
}
```

### 5. Grab the Response and Assert It's a 200

Now you can reach into the `apiResponseTask` and pull out the response:

```csharp
// Assign the response to the variable
apiResponse = await apiResponseTask;

// Assert that the response status is 200
apiResponse.Status.Should().Be(200, $"actual Status: {apiResponse.Status}; Expected 200");
```

If the status is not 200, your test fails right here with a clear message. No mystery, no silent failures later.

### 6. Log the Request and Response for Debugging

When something goes wrong, you want to know *exactly* what was sent and what came back. Log the URL, HTTP method, and status:

```csharp
// Log the API details
System.Diagnostics.Debug.WriteLine($"API call ==>\n{apiResponse.Url} \tMethods: {apiResponse.Request.Method}\tStatus: {apiResponse.Status}\n");
Console.WriteLine($"API call ==>\n{apiResponse.Url} \tMethods: {apiResponse.Request.Method}\tStatus: {apiResponse.Status}\n");
```

This helps you trace through the test later when you're investigating why something went sideways.

### 7. Deserialize the JSON and Use the Data

Now the fun part: turn the JSON response into a C# object and loop through the data:

```csharp
// Deserialize the response to MyDataObject
dataObject = JsonConvert.DeserializeObject<MyDataObject>((await apiResponse.JsonAsync()).Value.GetRawText());

// Log each data item's details
dataObject.Items.ForEach(item =>
{
    System.Diagnostics.Debug.WriteLine($"[{DateTime.Now}] [INFO] Id: {item.Id}");
    System.Diagnostics.Debug.WriteLine($"[{DateTime.Now}] [INFO] Name: {item.Name}");
});
```

Now you have strongly typed data you can trust in your assertions. No more string parsing, no guessing about what the API returned.

---

## The Full Picture

Here's the complete code all together. This is what you'd paste into your test and customize for your API endpoint and assertions:

```csharp
// Wait for the response from a specific API call
Task<IResponse>? apiResponseTask = _page.WaitForResponseAsync(new Regex("/api/endpoint"));
IResponse apiResponse = null;
MyDataObject dataObject = null;

// Wait for the button to be visible
await _page.GetByRole(AriaRole.Button, new() { Name = "Submit" }).WaitForAsync(new()
{
    State = WaitForSelectorState.Visible,
    Timeout = 5000
});

// Click the button and wait for navigation to complete
await Task.WhenAll(
    _page.WaitForNavigationAsync(new PageWaitForNavigationOptions
    {
        UrlRegex = new Regex("/next-page"),
        WaitUntil = WaitUntilState.DOMContentLoaded,
        Timeout = 5000
    }),
    _page.GetByRole(AriaRole.Button, new() { Name = "Submit" }).ClickAsync()
);

try
{
    // Wait for the API response to finish
    await (await apiResponseTask).FinishedAsync();
}
catch (Exception)
{
    // Handle exceptions if any
}

// Assign the response to the variable
apiResponse = await apiResponseTask;

// Assert that the response status is 200
apiResponse.Status.Should().Be(200, $"actual Status: {apiResponse.Status}; Expected 200");

// Log the API details
System.Diagnostics.Debug.WriteLine($"API call ==>\n{apiResponse.Url} \tMethods: {apiResponse.Request.Method}\tStatus: {apiResponse.Status}\n");
Console.WriteLine($"API call ==>\n{apiResponse.Url} \tMethods: {apiResponse.Request.Method}\tStatus: {apiResponse.Status}\n");

// Deserialize the response to MyDataObject
dataObject = JsonConvert.DeserializeObject<MyDataObject>((await apiResponse.JsonAsync()).Value.GetRawText());

// Log each data item's details
dataObject.Items.ForEach(item =>
{
    System.Diagnostics.Debug.WriteLine($"[{DateTime.Now}] [INFO] Id: {item.Id}");
    System.Diagnostics.Debug.WriteLine($"[{DateTime.Now}] [INFO] Name: {item.Name}");
});
```

---

## The Pattern You'll Use Over and Over

The steps above aren't magic—they're a repeatable pattern. Every time you need to:

1. **Trigger an action that fires an API call** (click a button)
2. **Wait for the response to arrive** (before asserting)
3. **Use the response data in your test** (verify the payload)

...you'll use this same scaffolding. Start listening with `WaitForResponseAsync`, ensure your UI is ready with `WaitForAsync`, coordinate the click and navigation with `Task.WhenAll`, then read and assert the response.

I learned this pattern the hard way—my early tests would click, then immediately assert, and flake on CI. Network latency is invisible when you're testing locally on fast WiFi, but it's brutal on CI with shared infrastructure. Waiting explicitly for responses transformed my test suite from flaky to rock solid.

One last thing: always prefer getting data via the API (like here with `WaitForResponseAsync`) over scraping it from the UI. APIs are deterministic; DOM queries can break if someone moves a div. Test the UI behavior, but grab the *data* from the source.

Happy testing, and may your assertions never chase ghosts.

## Sources & Further Reading

1. [Playwright .NET — network events](https://playwright.dev/dotnet/docs/network)
2. [WaitForResponseAsync — API reference](https://playwright.dev/dotnet/docs/api/class-page#page-wait-for-response)
3. [Web-first assertions — Playwright](https://playwright.dev/docs/test-assertions)
4. [Auto-waiting — why explicit sleeps die here](https://playwright.dev/docs/actionability)

*See also:* [Mastering E2E Testing with C# Playwright (Jul 2024)]({{ site.baseurl }}{% link _posts/2024-07-23-mastering-e2e-testing-csharp-playwright.md %}) · [Playwright MCP + Multi-Agent Testing (Jul 2026)]({{ site.baseurl }}{% link _posts/2026-07-15-playwright-mcp-multi-agent-testing.md %})

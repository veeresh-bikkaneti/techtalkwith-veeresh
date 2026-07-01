---
layout: post
title: "Mastering Asynchronous Operations in C# with Microsoft Playwright"
date: 2024-08-30
categories: [automation, tools]
tags: [playwright, csharp, async, wait-for-response, api-testing, testing]
excerpt: "A comprehensive guide to WaitForResponseAsync, ensuring tests handle network responses and navigation reliably before proceeding."
reading_time: 4
---

## A Comprehensive Guide to WaitForResponseAsync

### Problem Statement

In modern web applications, it's crucial to ensure certain network responses are received before proceeding with further actions. This is key to maintaining the integrity and reliability of automated tests and scripts. It's particularly important when dealing with asynchronous processes, where response times can vary. The goal is to create a robust method to wait for specific network replies, handle potential delays, and ensure that subsequent steps are only taken once the necessary data has been obtained.

### Strategy

To address this challenge, we will use Microsoft Playwright for C#, a powerful tool for browser automation. Our strategy involves:

- Waiting for a specific network response using the `WaitForResponseAsync` method.
- Ensuring the visibility of elements before interacting with them.
- Handling navigation and ensuring the page has fully loaded before proceeding.
- Validating the response to ensure it meets the expected criteria.
- Logging and deserializing the response for further processing and verification.

### Solution

We will create an example that demonstrates the usage of `WaitForResponseAsync` in Microsoft Playwright for C#. This example will be suitable for training purposes and won't reference any specific services.

### Detailed Explanation of the Code

#### 1. Initialization

Here, we initialize a task to wait for a response from an API call. The `WaitForResponseAsync` method takes a Regex pattern to match the URL of the response. This allows us to wait for a specific network request to complete.

```csharp
// Wait for the response from a specific API call
Task<IResponse>? apiResponseTask = _page.WaitForResponseAsync(new Regex("/api/endpoint"));
IResponse apiResponse = null;
MyDataObject dataObject = null;
```

#### 2. Wait for Element to be Visible

This step waits for a button to become visible on the page. The `WaitForAsync` method ensures that the script waits until the element is in the desired state (visible) before proceeding. This is crucial for ensuring that the element is interactable.

```csharp
await _page.GetByRole(AriaRole.Button, new() { Name = "Submit" }).WaitForAsync(new()
{
    State = WaitForSelectorState.Visible,
    Timeout = 5000
});
```

#### 3. Click and Wait for Navigation

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

This step clicks the button and waits for the navigation to complete. The `WaitForNavigationAsync` method ensures that the script waits until the page has loaded (DOMContentLoaded) and matches the specified URL pattern. This is important for ensuring that the navigation has completed before proceeding with further actions.

#### 4. Wait for Response to Finish

```csharp
try
{
    // Wait for the API response to finish
    await (await apiResponseTask).FinishedAsync();
}
catch (Exception)
{
    // Handle exceptions if any
}
```

Here, we wait for the API response to finish. The `FinishedAsync` method ensures that the script waits until the response is fully received. This is crucial for ensuring that we have the complete response before processing it.

#### 5. Assign and Assert Response

```csharp
// Assign the response to the variable
apiResponse = await apiResponseTask;

// Assert that the response status is 200
apiResponse.Status.Should().Be(200, $"actual Status: {apiResponse.Status}; Expected 200");
```

The response is assigned to a variable, and we assert that the status code is 200, indicating a successful response. This validation step ensures that the response meets our expectations.

#### 6. Log API Details

```csharp
// Log the API details
System.Diagnostics.Debug.WriteLine($"API call ==>\n{apiResponse.Url} \tMethods: {apiResponse.Request.Method}\tStatus: {apiResponse.Status}\n");
Console.WriteLine($"API call ==>\n{apiResponse.Url} \tMethods: {apiResponse.Request.Method}\tStatus: {apiResponse.Status}\n");
```

The API details are logged for debugging and verification purposes. This helps in understanding the request and response details during the execution of the script.

#### 7. Deserialize and Log Data

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

Finally, the response is deserialized into a `MyDataObject`, and each item's details are logged. This step is crucial for processing the response data and verifying its contents.

### Example Code

Here's the complete example code:

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

## Summary

This example demonstrates how to use `WaitForResponseAsync` effectively in a Playwright script to ensure that your automation waits for the necessary network responses before proceeding. This approach helps in creating reliable and robust automated tests and scripts.

*See also:* [Playwright MCP + Multi-Agent Testing in 2026 (Aug 2026)]({% link _posts/2026-08-01-playwright-mcp-multi-agent-testing.md %}) — the 2026 refresh with Web-First Assertions and multi-agent orchestration.

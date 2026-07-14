---
layout: post
title: "Handling HTML Encoded Strings in C# .NET 8.0 with Microsoft Playwright"
date: 2024-09-22
categories: [automation, frameworks]
tags: [playwright, dotnet, csharp, html-encoding, test-utilities]
excerpt: "Playwright found the text but Assert.AreEqual failed anyway? HTML encoding. Here's how I decode it in .NET 8 without losing my sanity."
reading_time: 3
---

### The Bug That Wasted My Day

You're debugging a test. Playwright finds the text you're looking for. You assert it matches a JSON baseline. The assertion fails. You look at the HTML in DevTools — the text is *right there*, character for character.

You're not losing your mind. It's HTML encoding.

The browser renders `&lt;p&gt;Hello&lt;/p&gt;` as `<p>Hello</p>` on screen. Playwright reads the DOM and hands you the literal string `&lt;p&gt;Hello&lt;/p&gt;`. Your JSON has `<p>Hello</p>`. They look the same to a human. To an `Assert.AreEqual()`, they're night and day.

This is the post I wish I'd found at 2am instead of learning it the hard way.

---

### The Real-World Scenarios (Why This Matters)

**1. E-commerce product comparison** — You're testing that product descriptions on the website match the database. The DB has `"High-quality widget &trade;"`. Playwright reads `"High-quality widget ™"` from the DOM. Without decoding, the test fails even though the user sees the exact same text.

**2. Content management systems** — A CMS editor stores `"<p>Hello</p>"` in the DB. The HTML rendered on screen looks perfect. Your test extracts the text and gets `"<p>Hello</p>"` literally. Without decoding and stripping tags, you're comparing metadata, not content.

**3. API vs. UI validation** — The API returns `{ description: "<p>Widget <strong>on sale</strong></p>" }`. The UI displays this as `"Widget on sale"`. If you naively compare the API payload with what Playwright reads from the DOM, they'll never match.

#### The Solution Pattern

1. Extract text from the page with Playwright
2. Decode HTML entities (`&lt;` → `<`, `&amp;` → `&`, etc.) using `HttpUtility.HtmlDecode`
3. Strip remaining HTML tags with regex
4. Compare clean text to your baseline

#### Code

```csharp
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Playwright;

public class HtmlStringProcessor
{
    private readonly IPage _page;
    private readonly List<ProductDescription> _productDescriptionsFromJson;

    public HtmlStringProcessor(IPage page, List<ProductDescription> productDescriptionsFromJson)
    {
        _page = page;
        _productDescriptionsFromJson = productDescriptionsFromJson;
    }

    /// <summary>
    /// Main method to process and compare product descriptions.
    /// </summary>
    public async Task ProcessProductDescriptionsAsync()
    {
        List<string> descriptionsFromPage = await ExtractDescriptionsFromPageAsync();
        string concatenatedDescriptions = string.Join("", descriptionsFromPage.Select(desc => desc.Trim()));
        string decodedDescriptions = DecodeHtmlString(concatenatedDescriptions);
        string cleanedDescriptions = RemoveHtmlTags(decodedDescriptions);

        foreach (var productDescription in _productDescriptionsFromJson)
        {
            Console.WriteLine($"HTML Encoded string is: {productDescription.Description}");
            string decodedDescription = DecodeHtmlString(productDescription.Description);
            string cleanedDescription = RemoveHtmlTags(decodedDescription);

            if (cleanedDescription.Contains(cleanedDescriptions, StringComparison.OrdinalIgnoreCase))
            {
                // Fake modal validation
                Console.WriteLine("Match found! Displaying fake modal for validation.");
            }
        }
    }

    /// <summary>
    /// Extracts product descriptions from the web page using Playwright.
    /// </summary>
    private async Task<List<string>> ExtractDescriptionsFromPageAsync()
    {
        var descriptionLocators = await _page.Locator("div.product-description").AllAsync();
        var descriptionTasks = descriptionLocators.Select(locator => locator.TextContentAsync());
        return (await Task.WhenAll(descriptionTasks)).ToList();
    }

    /// <summary>
    /// Decodes an HTML encoded string.
    /// </summary>
    private string DecodeHtmlString(string input)
    {
        using (var writer = new StringWriter())
        {
            HttpUtility.HtmlDecode(input, writer);
            return writer.ToString();
        }
    }

    /// <summary>
    /// Removes HTML tags from a string using a regular expression.
    /// </summary>
    private string RemoveHtmlTags(string input)
    {
        string pattern = @"<[^>]+>|&[^;]+;";
        return Regex.Replace(input, pattern, string.Empty).Trim();
    }
}

public class ProductDescription
{
    public string Description { get; set; }
}
```

#### What Each Part Does

**HtmlStringProcessor** — The wrapper class that orchestrates the whole flow. Think of it as a decoder that knows how to compare apples to apples (cleaned text, not raw HTML).

**ExtractDescriptionsFromPageAsync** — Grabs the text from the DOM using Playwright's locators. This is where you get the encoded strings.

**DecodeHtmlString** — Uses `HttpUtility.HtmlDecode` with a StringWriter. This converts `&lt;` back to `<`, `&amp;` back to `&`, etc. It's the bridge between what Playwright reads and what the JSON file contains.

**RemoveHtmlTags** — The regex pattern `@"<[^>]+>|&[^;]+;"` strips both actual tags (`<p>`, `</span>`) and leftover entities that didn't decode. Belt and suspenders.

**ProcessProductDescriptionsAsync** — The orchestrator. Extract → Decode → Clean → Compare. If the cleaned text from the page matches the cleaned text from the JSON, you've caught a data sync bug (or confirmed everything is fine).

This is the pattern that saved me from 404 failures that night.


### Using the Code in a Real-World Scenario

#### Scenario
Imagine you are developing a web application for an e-commerce platform. Your task is to ensure that product descriptions displayed on the website match those stored in your database. These descriptions might be HTML encoded and contain various HTML tags. You need to decode these strings, remove the HTML tags, and compare them to ensure consistency.

#### Steps to Use the Code

1. **Setup Microsoft Playwright**:
   - Install Microsoft Playwright in your project using NuGet.
   - Initialize Playwright and navigate to the webpage containing the product descriptions.

2. **Extract Product Descriptions**:
   - Use the `HtmlStringProcessor` class to extract product descriptions from the webpage.

3. **Decode and Clean Descriptions**:
   - The `HtmlStringProcessor` class will decode the HTML encoded strings and remove any HTML tags.

4. **Compare Descriptions**:
   - The cleaned descriptions from the webpage are compared with those from the JSON file to ensure they match.

#### Example Usage

```csharp
using Microsoft.Playwright;
using System.Collections.Generic;
using System.Threading.Tasks;

public class Program
{
    public static async Task Main(string[] args)
    {
        var playwright = await Playwright.CreateAsync();
        var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
        var page = await browser.NewPageAsync();
        await page.GotoAsync("https://example.com/products");

        var productDescriptionsFromJson = new List<ProductDescription>
        {
            new ProductDescription { Description = "Product 1 description" },
            new ProductDescription { Description = "Product 2 description" }
        };

        var processor = new HtmlStringProcessor(page, productDescriptionsFromJson);
        await processor.ProcessProductDescriptionsAsync();

        await browser.CloseAsync();
    }
}
```

### Common Pitfalls When Handling HTML Encoded Strings

1. **Incomplete Decoding**:
   - Ensure that all HTML encoded characters are properly decoded. Missing out on certain characters can lead to incorrect comparisons.

2. **Improper Regular Expressions**:
   - Using incorrect or overly broad regular expressions can result in removing necessary content or failing to remove all HTML tags.

3. **Case Sensitivity**:
   - Comparisons should be case-insensitive to avoid mismatches due to different casing.

4. **Whitespace Handling**:
   - Extra spaces or newline characters can cause mismatches. Ensure that strings are trimmed and unnecessary whitespace is removed.

5. **Performance Issues**:
   - Decoding and cleaning large amounts of text can be resource-intensive. Optimize your code to handle large datasets efficiently.

6. **Encoding Variations**:
   - Different sources might use different encoding schemes. Ensure consistency in encoding across all data sources.

By being aware of these pitfalls and following best practices, you can effectively handle HTML encoded strings in your applications.

## Sources & Further Reading

1. [Playwright .NET — intro](https://playwright.dev/dotnet/docs/intro)
2. [System.Net.WebUtility.HtmlDecode — Microsoft docs](https://learn.microsoft.com/en-us/dotnet/api/system.net.webutility.htmldecode)
3. [HtmlAgilityPack — HTML parsing for .NET](https://html-agility-pack.net/)
4. [Playwright locators — text matching](https://playwright.dev/docs/locators#locate-by-text)

*See also:* [Mastering Playwright .NET (Sep 2024)]({{ site.baseurl }}{% link _posts/2024-09-19-mastering-playwright-dotnet.md %}) — the full DI + Page Object setup this decoding logic plugs into.

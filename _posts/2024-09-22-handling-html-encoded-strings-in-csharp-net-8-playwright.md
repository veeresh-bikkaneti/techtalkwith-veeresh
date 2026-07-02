---
layout: post
title: "Handling HTML Encoded Strings in C# .NET 8.0 with Microsoft Playwright"
date: 2024-09-22
categories: [automation, frameworks]
tags: [playwright, dotnet, csharp, html-encoding, test-utilities]
excerpt: "Playwright found the text but Assert.AreEqual failed anyway? HTML encoding. Here's how I decode it in .NET 8 without losing my sanity."
reading_time: 3
---

### Handling HTML Encoded Strings in C# .NET 8.0 with Microsoft Playwright

#### Problem Statement
When working with web applications, it's common to encounter HTML encoded text in the UI that needs to be decoded and processed. For example, you might have a list of product descriptions displayed on a webpage and a corresponding list of descriptions in a JSON file. The task is to decode these strings, remove any HTML tags, and compare them to ensure they match.

#### [Learn more on HTML Encloded strings](https://www.geeksforgeeks.org/html-url-encoding/)

#### Use Cases
1. **Web Scraping**: Extracting and processing text from web pages.
2. **Data Cleaning**: Removing HTML tags and decoding strings from various data sources.
3. **Text Comparison**: Comparing user input or extracted text with stored data.

#### Step-by-Step Guidance

1. **Extract Text from Web Page**:
   - Use Microsoft Playwright to locate and extract text from specific elements on a webpage.

2. **Decode HTML Encoded Strings**:
   - Use `HttpUtility.HtmlDecode` to decode HTML encoded strings.

3. **Remove HTML Tags**:
   - Use regular expressions to remove HTML tags from the decoded strings.

4. **Compare Strings**:
   - Compare the cleaned strings to check for matches.

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

#### Explanation
- **HtmlStringProcessor Class**: Handles the extraction, decoding, cleaning, and comparison of HTML encoded strings.
- **ExtractDescriptionsFromPageAsync Method**: Extracts text from the webpage using Microsoft Playwright.
- **DecodeHtmlString Method**: Decodes HTML encoded strings.
- **RemoveHtmlTags Method**: Removes HTML tags using a regular expression.
- **ProcessProductDescriptionsAsync Method**: Main method that processes and compares the product descriptions, including a fake modal for validation.

This approach ensures that the code is clean, readable, and follows best practices for naming conventions and structure.


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

*See also:* [Mastering Playwright .NET (Sep 2024)]({% link _posts/2024-09-19-mastering-playwright-dotnet.md %}) — the full DI + Page Object setup this decoding logic plugs into.

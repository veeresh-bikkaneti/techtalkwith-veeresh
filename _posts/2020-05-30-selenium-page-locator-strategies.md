---
layout: post
title: "Selenium Page Locator Strategies and NoSuchElementException"
date: 2020-05-30
categories: [automation, tools]
tags: [selenium, locators, xpath, css-selectors, webdriver, no-such-element, java]
excerpt: "A beginner-friendly guide to Selenium locator strategies — ID, class, CSS, XPath — and how to avoid NoSuchElementException."
reading_time: 4
---

This article is to help beginners understand various available options and quick hacks to identify page elements.

## Background

Many automation testers deal with a pretty common issue: `NoSuchElementException`.

This could be due to the poor choices and decisions made early in the design phase — choices that will haunt test projects or apps throughout the life of the product.

Synchronization could be another common reason:

- Little or no wait time, or
- The type of Wait implemented.

And adding the frequent code changes, this results in revisiting all the page objects.

## Available Selenium Locator Strategies

### Selenium 3.0 Page Locator Strategy

CSS can be used in combination with attributes to identify a unique element. Order of precedence for searching / identifying a web element: **ID, Class Name, CSS Selectors, XPath.** While searching for an element using XPath will take longer compared to a CSS Selector, simple attributes are far cheaper for the browser to resolve.

### Selenium 4.0 Locator Strategies

Relative locators — previously called Friendly Locators. They allow you to locate elements based on their visual relationship to other elements (`above`, `below`, `toLeftOf`, `toRightOf`, `near`).

## WebDriver Interface and Key Methods

Consider a fully functional web browser where the application under test (the web URL) is loaded successfully.

For automating this context, the Selenium WebDriver interface is instantiated with one of its implementations. The web page is loaded and elements are displayed.

Before instantiating a WebDriver implementation we should show the path where the binary or the actual `.exe` file is located, as below:

### Step #1 — Pin the Browser Binary

**Using `System.setProperty`:**

```java
System.setProperty("webdriver.chrome.driver", "/path/to/driver.exe"); // Setup Webdriver binary
```

**Or use Bonigarcia's WebDriverManager so the binary resolution is automatic:**

```xml
<dependency>
    <groupId>io.github.bonigarcia</groupId>
    <artifactId>webdrivermanager</artifactId>
    <version>${LATEST.version}</version>
    <scope>test</scope>
</dependency>
```

### Step #2 — Swap WebDriver Interface With a Fully Featured Browser

```java
WebDriver webDriverInstance = new ChromeDriver();
```

## Handling Synchronization Issues

### Strategy #1: Implicit Waits

```java
// Instantiating the WebDriver
WebDriver webDriverInstance = new ChromeDriver();

// Navigate to the URL
webDriverInstance.navigate().to("https://www.google.com/");

/*
 * Sets the amount of time to wait for a page load to complete before throwing an error.
 */
webDriverInstance.manage().timeouts().pageLoadTimeout(Long.valueOf(20), TimeUnit.SECONDS);

/*
 * Specifies the amount of time the driver should wait when searching for an element
 * if it is not immediately present. Max amount of time that a WebDriver instance will
 * wait before throwing NoSuchElementException.
 */
webDriverInstance.manage().timeouts().implicitlyWait(Long.valueOf(20), TimeUnit.SECONDS);
```

### Strategy #2: Explicit Waits / `WebDriverWait`

### Strategy #3: `FluentWait`

Implementing Step #1 and Step #2 will instantiate the WebDriver, load the AUT URL or the web page, and wait for a maximum of 20 seconds before searching for any elements or throwing a `NoSuchElementException`.

**Using `ExpectedConditions`:**

The Selenium WebDriver provides the `WebDriverWait` and `ExpectedConditions` classes to implement an explicit wait. The `ExpectedConditions` class provides a set of predefined conditions to wait for before proceeding further in the code.

```java
/*
 * Wait will ignore instances of NotFoundException that are encountered (thrown) by default in
 * the 'until' condition, and immediately propagate all others. You can add more to the ignore
 * list by calling ignoring(exceptions to add).
 */
assertTrue(
    new WebDriverWait(webDriverInstance, Long.valueOf(20))
        .until(ExpectedConditions.titleIs("Google"))
        .booleanValue(),
    "*****Url not loaded*****");
```

## Locating the Search Box — Multiple Strategies

We shall now explore multiple strategies to uniquely identify the search box:

```java
By searchByName        = By.name("q");
By searchByCssSelector = By.cssSelector(".a4bIc > input[role='combobox']");
By searchByAbsoluteXpath = By.xpath("/html/body/div/div[4]/form/div[2]/div[1]/div[1]/div/div[2]/input");
By searchByRelativeXpath = By.xpath("//input[@title='Search']");
```

Employing any of the above strategies would still find the same element from the DOM. In the above scenario, `By.name` will return the element first, then `cssSelector`, then `xpath` last — that order reflects the cost the browser pays to traverse the DOM tree.

### XPath Advantage

- Can traverse in **both directions** — back to parent nodes and forward to child / subsequent nodes.

### XPath Disadvantage (CSS)

- Traverses **only one way forward**.

## Accessing the 2nd Row and 5th Column of a Table

For `http://the-internet.herokuapp.com/tables`:

```java
By.cssSelector("table#table1 tr:nth-of-type(2) > td:nth-of-type(5)");
By.xpath("(//tr[2])[1]//td[5]");
```

The CSS variant (`nth-of-type`) is generally faster and more readable; the XPath variant is more flexible for traversing backwards through the DOM. Pick the strategy that matches the maintainability tradeoff your project can afford.

## Final Word

Locator choice and synchronization strategy determine whether a Selenium suite is reliable or riddled with false negatives. Make these decisions once, encode them as page-object helpers, and revisit only when the underlying framework changes.

## Sources & Further Reading

1. [Selenium locators — official guide](https://www.selenium.dev/documentation/webdriver/elements/locators/)
2. [Relative locators — Selenium 4](https://www.selenium.dev/documentation/webdriver/elements/locators/#relative-locators)
3. [Waits and synchronization](https://www.selenium.dev/documentation/webdriver/waits/)
4. [NoSuchElementException — troubleshooting](https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#nosuchelementexception)

*See also:* [Selenium in 2026: A Beginner's Guide (Jul 2026)]({% link _posts/2026-07-01-selenium-2026-beginners-guide.md %}) · [Self-Healing Test Suites (Sep 2026)]({% link _posts/2026-09-15-self-healing-test-suites.md %}) — when every locator in this post fails at once. · [XPath for Test Automation (Sep 2026)]({% link _posts/2026-09-20-xpath-for-test-automation.md %}) — the story-mode article with §12 complex XPath & CSS for SDETs (SVG, computed indices, ARIA chains, iframe/shadow-DOM, modern CSS); the natural next read after this 2020 strategy-ladder introduction.

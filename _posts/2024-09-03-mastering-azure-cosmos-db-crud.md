---
layout: post
title: "Azure Cosmos DB CRUD: A Practical Guide to Building Maintainable Data Services"
date: 2024-09-03
categories: [best-practices, frameworks]
tags: [azure, cosmos-db, csharp, crud, solid, clean-architecture]
excerpt: "How to implement CRUD operations in Cosmos DB without building yourself into a corner — architecture patterns that actually survive beyond the POC."
reading_time: 9
---

I've rebuilt Cosmos DB services more times than I'd like to admit. The common thread: start simple, skip the architecture, then realize at scale that the code is a tangled mess. This guide is the architecture I wish I'd known six months in.

We'll build a CRUD service that's *maintainable* — interfaces are separate from implementations, dependencies are injected, and when you need to swap SQL for Cosmos (or vice versa), you change one file, not forty. No over-engineering. Just the baseline design that lets your code grow.

## What Cosmos DB Queries Look Like

Cosmos DB speaks SQL. If you know SQL, the queries feel natural:

```sql
SELECT * FROM c
SELECT * FROM c WHERE CONTAINS(c.name, 'John')
SELECT * FROM c WHERE c.age = 30
SELECT * FROM c WHERE c.age > 25 AND c.city = 'New York'
```

You can run these in the Azure Portal's Data Explorer or from code via the SDK.

## Why Architecture Matters Here

Before you write a single `CreateItemAsync`, pause. How will you inject a database service? How will you swap Cosmos for SQL without rewriting your entire application layer? 

The answer: **interfaces and dependency injection**. It feels like ceremony at first. It saves your life when your CTO says "move this to PostgreSQL."

We'll build a `ICosmosDbService` interface, then an implementation. When the time comes to migrate, you write a new implementation — your business logic doesn't change.

## Getting Started

You'll need an Azure Cosmos DB account (create one in the portal) and the SDK:

```bash
dotnet add package Microsoft.Azure.Cosmos
```

Then we build the service layer.

## Building the CRUD Service

We'll create a `CosmosDbService` that handles Create, Read, Update, Delete. Each operation returns data cleanly — no tight coupling to Cosmos. If tomorrow your boss says "use SQL Server," you swap the implementation, not the interface.

### Initialize Cosmos Client

```csharp
using Microsoft.Azure.Cosmos;

public class CosmosDbService
{
    private readonly CosmosClient _cosmosClient;
    private readonly Database _database;
    private readonly Container _container;

    public CosmosDbService(string connectionString, string databaseName, string containerName)
    {
        _cosmosClient = new CosmosClient(connectionString);
        _database = _cosmosClient.GetDatabase(databaseName);
        _container = _database.GetContainer(containerName);
    }

    // CRUD operations will be added here
}
```

### Detailed Methods

#### CreateItemAsync

```csharp
public async Task CreateItemAsync<T>(T item, string partitionKey)
{
    var response = await _container.CreateItemAsync(item, new PartitionKey(partitionKey));
    if (response.StatusCode == System.Net.HttpStatusCode.Created)
    {
        Console.WriteLine("Item created successfully.");
    }
    else
    {
        Console.WriteLine("Failed to create item.");
    }
}
```

#### ReadItemAsync

```csharp
public async Task<T> ReadItemAsync<T>(string id, string partitionKey)
{
    try
    {
        var response = await _container.ReadItemAsync<T>(id, new PartitionKey(partitionKey));
        return response.Resource;
    }
    catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
    {
        Console.WriteLine("Item not found.");
        return default;
    }
}
```

#### UpdateItemAsync

```csharp
public async Task UpdateItemAsync<T>(string id, T item, string partitionKey)
{
    var response = await _container.UpsertItemAsync(item, new PartitionKey(partitionKey));
    if (response.StatusCode == System.Net.HttpStatusCode.OK)
    {
        Console.WriteLine("Item updated successfully.");
    }
    else
    {
        Console.WriteLine("Failed to update item.");
    }
}
```

#### DeleteItemAsync

```csharp
public async Task DeleteItemAsync(string id, string partitionKey)
{
    var response = await _container.DeleteItemAsync<dynamic>(id, new PartitionKey(partitionKey));
    if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
    {
        Console.WriteLine("Item deleted successfully.");
    }
    else
    {
        Console.WriteLine("Failed to delete item.");
    }
}
```

#### DeleteAllItems

```csharp
public async Task DeleteAllItemsAsync()
{
    var query = "SELECT * FROM c";
    var iterator = _container.GetItemQueryIterator<dynamic>(query);
    var items = new List<dynamic>();
    while (iterator.HasMoreResults)
    {
        var response = await iterator.ReadNextAsync();
        items.AddRange(response);
    }
    foreach (var item in items)
    {
        await _container.DeleteItemAsync<dynamic>(item.id.ToString(), new PartitionKey(item.partitionKey));
    }
}
```

#### ListDatabasesAndContainers

```csharp
public async Task ListDatabasesAndContainersAsync()
{
    var databases = _cosmosClient.GetDatabaseQueryIterator<DatabaseProperties>();
    while (databases.HasMoreResults)
    {
        var databaseResponse = await databases.ReadNextAsync();
        foreach (var db in databaseResponse)
        {
            Console.WriteLine($"Database: {db.Id}");
            var containers = _cosmosClient.GetDatabase(db.Id).GetContainerQueryIterator<ContainerProperties>();
            while (containers.HasMoreResults)
            {
                var containerResponse = await containers.ReadNextAsync();
                foreach (var container in containerResponse)
                {
                    Console.WriteLine($"  Container: {container.Id}");
                }
            }
        }
    }
}
```

#### DeleteContainerAsync

```csharp
public async Task DeleteContainerAsync(string containerName)
{
    var container = _database.GetContainer(containerName);
    var response = await container.DeleteContainerAsync();
    if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
    {
        Console.WriteLine("Container deleted successfully.");
    }
    else
    {
        Console.WriteLine("Failed to delete container.");
    }
}
```

#### DeleteDatabaseAsync

```csharp
public async Task DeleteDatabaseAsync(string databaseName)
{
    var database = _cosmosClient.GetDatabase(databaseName);
    var response = await database.DeleteAsync();
    if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
    {
        Console.WriteLine("Database deleted successfully.");
    }
    else
    {
        Console.WriteLine("Failed to delete database.");
    }
}
```

## The Contract (Interface)

Here's the contract your code will rely on. Any implementation must follow this shape.

```csharp
public interface ICosmosDbService
{
    Task CreateItemAsync<T>(T item, string partitionKey);
    Task<T> ReadItemAsync<T>(string id, string partitionKey);
    Task UpdateItemAsync<T>(string id, T item, string partitionKey);
    Task DeleteItemAsync(string id, string partitionKey);
    Task DeleteAllItemsAsync();
    Task ListDatabasesAndContainersAsync();
    Task DeleteContainerAsync(string containerName);
    Task DeleteDatabaseAsync(string databaseName);
}
```

## The Implementation

Now we realize the interface with actual Cosmos DB calls.

```csharp
using Microsoft.Azure.Cosmos;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public class CosmosDbService : ICosmosDbService
{
    private readonly CosmosClient _cosmosClient;
    private readonly Database _database;
    private readonly Container _container;

    public CosmosDbService(string connectionString, string databaseName, string containerName)
    {
        _cosmosClient = new CosmosClient(connectionString);
        _database = _cosmosClient.GetDatabase(databaseName);
        _container = _database.GetContainer(containerName);
    }

    public async Task CreateItemAsync<T>(T item, string partitionKey)
    {
        var response = await _container.CreateItemAsync(item, new PartitionKey(partitionKey));
        if (response.StatusCode == System.Net.HttpStatusCode.Created)
        {
            Console.WriteLine("Item created successfully.");
        }
        else
        {
            Console.WriteLine("Failed to create item.");
        }
    }

    public async Task<T> ReadItemAsync<T>(string id, string partitionKey)
    {
        try
        {
            var response = await _container.ReadItemAsync<T>(id, new PartitionKey(partitionKey));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            Console.WriteLine("Item not found.");
            return default;
        }
    }

    public async Task UpdateItemAsync<T>(string id, T item, string partitionKey)
    {
        var response = await _container.UpsertItemAsync(item, new PartitionKey(partitionKey));
        if (response.StatusCode == System.Net.HttpStatusCode.OK)
        {
            Console.WriteLine("Item updated successfully.");
        }
        else
        {
            Console.WriteLine("Failed to update item.");
        }
    }

    public async Task DeleteItemAsync(string id, string partitionKey)
    {
        var response = await _container.DeleteItemAsync<dynamic>(id, new PartitionKey(partitionKey));
        if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
        {
            Console.WriteLine("Item deleted successfully.");
        }
        else
        {
            Console.WriteLine("Failed to delete item.");
        }
    }

    public async Task DeleteAllItemsAsync()
    {
        var query = "SELECT * FROM c";
        var iterator = _container.GetItemQueryIterator<dynamic>(query);
        var items = new List<dynamic>();
        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            items.AddRange(response);
        }
        foreach (var item in items)
        {
            await _container.DeleteItemAsync<dynamic>(item.id.ToString(), new PartitionKey(item.partitionKey));
        }
    }

    public async Task ListDatabasesAndContainersAsync()
    {
        var databases = _cosmosClient.GetDatabaseQueryIterator<DatabaseProperties>();
        while (databases.HasMoreResults)
        {
            var databaseResponse = await databases.ReadNextAsync();
            foreach (var db in databaseResponse)
            {
                Console.WriteLine($"Database: {db.Id}");
                var containers = _cosmosClient.GetDatabase(db.Id).GetContainerQueryIterator<ContainerProperties>();
                while (containers.HasMoreResults)
                {
                    var containerResponse = await containers.ReadNextAsync();
                    foreach (var container in containerResponse)
                    {
                        Console.WriteLine($"  Container: {container.Id}");
                    }
                }
            }
        }
    }

    public async Task DeleteContainerAsync(string containerName)
    {
        var container = _database.GetContainer(containerName);
        var response = await container.DeleteContainerAsync();
        if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
        {
            Console.WriteLine("Container deleted successfully.");
        }
        else
        {
            Console.WriteLine("Failed to delete container.");
        }
    }

    public async Task DeleteDatabaseAsync(string databaseName)
    {
        var database = _cosmosClient.GetDatabase(databaseName);
        var response = await database.DeleteAsync();
        if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
        {
            Console.WriteLine("Database deleted successfully.");
        }
        else
        {
            Console.WriteLine("Failed to delete database.");
        }
    }
}
```

## Putting It to Use

Here's what a real test looks like. Notice: you depend on the *interface*, not the concrete Cosmos class. When you swap implementations, this code doesn't change.

```csharp
class Program
{
    static async Task Main(string[] args)
    {
        string connectionString = "your_connection_string";
        string databaseName = "your_database_name";
        string containerName = "your_container_name";
        ICosmosDbService cosmosDbService = new CosmosDbService(connectionString, databaseName, containerName);

        // Example usage
        await cosmosDbService.CreateItemAsync(new { id = "1", name = "John Doe" }, "partitionKey");
        var item = await cosmosDbService.ReadItemAsync<dynamic>("1", "partitionKey");
        await cosmosDbService.UpdateItemAsync("1", new { id = "1", name = "Jane Doe" }, "partitionKey");
        await cosmosDbService.DeleteItemAsync("1", "partitionKey");
        await cosmosDbService.DeleteAllItemsAsync();
        await cosmosDbService.ListDatabasesAndContainersAsync();
        await cosmosDbService.DeleteContainerAsync(containerName);
        await cosmosDbService.DeleteDatabaseAsync(databaseName);
    }
}
```

## Scaling It: Multi-Container Scenarios

As your app grows, you'll manage multiple databases and containers dynamically. The same interface pattern holds — just parameterize the database and container IDs.

```csharp
public interface ICosmosDbService
{
    Task CreateItemAsync<T>(string databaseId, string containerId, T item);
    Task<T> ReadItemAsync<T>(string databaseId, string containerId, string itemId, string partitionKey);
    Task<T> UpdateItemAsync<T>(string databaseId, string containerId, T item);
    Task DeleteItemAsync(string databaseId, string containerId, string itemId, string partitionKey);
    Task DeleteContainerAsync(string databaseId, string containerId);
    Task DeleteDatabaseAsync(string databaseId);
    Task<Dictionary<string, List<string>>> ListDatabasesAndContainers();
    Task DeleteAllItemsInContainers(Dictionary<string, Dictionary<string, string>> databasesAndContainers);
}

public class CosmosDbService : ICosmosDbService
{
    private readonly CosmosClient _cosmosClient;

    public CosmosDbService(CosmosClient cosmosClient)
    {
        _cosmosClient = cosmosClient;
    }

    /// <summary>
    /// Creates a new item in the specified container.
    /// </summary>
    public async Task CreateItemAsync<T>(string databaseId, string containerId, T item)
    {
        var container = _cosmosClient.GetContainer(databaseId, containerId);
        await container.CreateItemAsync(item);
        Console.WriteLine($"Item created successfully in container: {containerId}");
    }

    /// <summary>
    /// Reads an item from the specified container.
    /// </summary>
    public async Task<T> ReadItemAsync<T>(string databaseId, string containerId, string itemId, string partitionKey)
    {
        var container = _cosmosClient.GetContainer(databaseId, containerId);
        try
        {
            ItemResponse<T> response = await container.ReadItemAsync<T>(itemId, new PartitionKey(partitionKey));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            Console.WriteLine($"Item with id {itemId} not found.");
            return default;
        }
    }

    /// <summary>
    /// Updates an item in the specified container.
    /// </summary>
    public async Task UpdateItemAsync<T>(string databaseId, string containerId, T item)
    {
        var container = _cosmosClient.GetContainer(databaseId, containerId);
        await container.UpsertItemAsync(item);
        Console.WriteLine($"Item updated successfully in container: {containerId}");
    }

    /// <summary>
    /// Deletes a specific item by its ID and partition key.
    /// </summary>
    public async Task DeleteItemAsync(string databaseId, string containerId, string itemId, string partitionKey)
    {
        var container = _cosmosClient.GetContainer(databaseId, containerId);
        try
        {
            await container.DeleteItemAsync<dynamic>(itemId, new PartitionKey(partitionKey));
            Console.WriteLine($"Item with id {itemId} deleted successfully.");
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            Console.WriteLine($"Item with id {itemId} not found.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting item with id {itemId}: {ex.Message}");
        }
    }

    /// <summary>
    /// Deletes a specific container.
    /// </summary>
    public async Task DeleteContainerAsync(string databaseId, string containerId)
    {
        var database = _cosmosClient.GetDatabase(databaseId);
        var container = database.GetContainer(containerId);
        try
        {
            await container.DeleteContainerAsync();
            Console.WriteLine($"Container with id {containerId} deleted successfully.");
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            Console.WriteLine($"Container with id {containerId} not found.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting container with id {containerId}: {ex.Message}");
        }
    }

    /// <summary>
    /// Deletes a specific database.
    /// </summary>
    public async Task DeleteDatabaseAsync(string databaseId)
    {
        var database = _cosmosClient.GetDatabase(databaseId);
        try
        {
            await database.DeleteAsync();
            Console.WriteLine($"Database with id {databaseId} deleted successfully.");
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            Console.WriteLine($"Database with id {databaseId} not found.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting database with id {databaseId}: {ex.Message}");
        }
    }

    /// <summary>
    /// Lists all databases and their containers.
    /// </summary>
    public async Task<Dictionary<string, List<string>>> ListDatabasesAndContainers()
    {
        var result = new Dictionary<string, List<string>>();
        var databases = _cosmosClient.GetDatabaseQueryIterator<DatabaseProperties>();
        while (databases.HasMoreResults)
        {
            foreach (var database in await databases.ReadNextAsync())
            {
                var containerIds = new List<string>();
                var containers = _cosmosClient.GetDatabase(database.Id).GetContainerQueryIterator<ContainerProperties>();
                while (containers.HasMoreResults)
                {
                    foreach (var container in await containers.ReadNextAsync())
                    {
                        containerIds.Add(container.Id);
                    }
                }
                result.Add(database.Id, containerIds);
            }
        }
        return result;
    }

    /// <summary>
    /// Deletes all items in the specified containers.
    /// </summary>
    public async Task DeleteAllItemsInContainers(Dictionary<string, Dictionary<string, string>> databasesAndContainers)
    {
        foreach (var kvp in databasesAndContainers)
        {
            string databaseId = kvp.Key;
            foreach (var containerKvp in kvp.Value)
            {
                string containerId = containerKvp.Key;
                string key = containerKvp.Value;
                if (string.IsNullOrEmpty(containerId))
                {
                    Console.WriteLine($"Container ID is empty for database: {databaseId}. Skipping...");
                    continue;
                }
                // [Medium truncates here — the remainder of this method is behind the Medium paywall]
            }
        }
    }
}
```

## Why This Architecture Matters

This isn't abstract theory. Here's what you actually get:

- **Swap databases with one file change** — SQL, MongoDB, Firebase? Write a new implementation, swap it in. Your app doesn't know.
- **Unit test without a database** — Mock the interface, test your business logic in isolation.
- **Avoid the "Cosmos ghetto"** — The pattern works for *any* database. You're not painting yourself into a corner.
- **Split across teams** — One person owns the Cosmos layer; another owns business logic. Loose coupling wins.

That's SOLID in practice. The principles aren't buzzwords — they're tools that buy you flexibility.

## Conclusion

Here's what I've learned the hard way: **the database layer is not your application**. Treat it as one input among many. An interface + implementation keeps Cosmos from bleeding into your business logic.

Start with the interface. Write the implementation second. That order saves you hours down the road.

When your CTO calls and says "we're moving to PostgreSQL" (they always do), you'll have one file to rewrite instead of forty.

## Sources & Further Reading

1. [Azure Cosmos DB — .NET SDK quickstart](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/quickstart-dotnet)
2. [Cosmos DB CRUD with .NET](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/how-to-dotnet-get-started)
3. [SOLID principles — Microsoft architecture guidance](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles)
4. [Partition keys — Cosmos DB design](https://learn.microsoft.com/en-us/azure/cosmos-db/partitioning-overview)

*See also:* [Mastering E2E Testing with C# Playwright (Jul 2024)]({{ site.baseurl }}{% link _posts/2024-07-23-mastering-e2e-testing-csharp-playwright.md %}) — UI + API + database assertions in one test; this post covers the Cosmos side of that triangle.

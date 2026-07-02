---
layout: post
title: "Mastering Azure Cosmos DB CRUD Operations: A Step-by-Step Guide to SOLID Principles and Clear Architecture"
date: 2024-09-03
categories: [best-practices, frameworks]
tags: [azure, cosmos-db, csharp, crud, solid, clean-architecture]
excerpt: "A step-by-step guide to implementing CRUD operations in Azure Cosmos DB while adhering to SOLID principles and clear architecture."
reading_time: 9
---

In the ever-evolving landscape of cloud databases, mastering Azure Cosmos DB is essential for developers looking to leverage its capabilities for scalable and efficient data management. This blog post aims to provide you with a comprehensive guide on implementing CRUD (Create, Read, Update, Delete) operations in Azure Cosmos DB, while adhering to the SOLID principles and clear architectural design.

## Section 1: Overview of Queries

Azure Cosmos DB supports SQL-like queries to interact with the data. Here are some basic examples:

- **Select All Items**: `SELECT * FROM c`
- **Conditional Queries**:
- Contains: `SELECT * FROM c WHERE CONTAINS(c.name, 'John')`
- Equals: `SELECT * FROM c WHERE c.age = 30`
- Logical Permutations: `SELECT * FROM c WHERE c.age > 25 AND c.city = 'New York'`

These queries can be executed manually using the Azure Portal or programmatically via the SDK.

## Section 2: Manual Operations

Before diving into code, let's understand how to perform some basic operations manually:

1. **Creating a Database and Container**:
- Navigate to the Azure Portal.
- Create a new Cosmos DB account.
- Add a new database and container.

2. **Querying Data**:
- Use the Data Explorer in the Azure Portal.
- Execute SQL queries to retrieve data.

## Understanding CRUD Operations in Azure Cosmos DB

CRUD operations are fundamental to any application that interacts with a database. In the context of Azure Cosmos DB, these operations allow you to manipulate and manage data effectively. However, to create a robust and maintainable codebase, it is vital to design these operations following established software principles.

## The Importance of SOLID Principles and CLEAR Architecture

The SOLID principles are a set of design guidelines that help developers create more understandable, flexible, and maintainable software. When combined with a clear architectural design, these principles ensure that your codebase can scale and adapt to changing requirements.

## Setting Up Your Azure Cosmos DB Environment

Before diving into the code, ensure you have an Azure Cosmos DB account and the Azure Cosmos DB SDK for .NET installed. You can create a new Cosmos DB account via the Azure portal and install the SDK using NuGet:

```bash
dotnet add package Microsoft.Azure.Cosmos
```

## Implementing CRUD Operations

We'll extend the CosmosClient class to include methods for each CRUD operation, ensuring our code adheres to SOLID principles and clear architecture.

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

## Define Interfaces

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

## Implement the Service

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

## Using the Service

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

## Extended Implementation: Per-Container Item Methods

When your application needs to target multiple databases and containers dynamically, the service can take `databaseId` and `containerId` arguments directly:

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

## Following SOLID Principles

To ensure our code is maintainable and scalable, we follow SOLID principles:

- **Single Responsibility Principle:** Each method handles a single responsibility.
- **Open/Closed Principle:** Our methods are open for extension but closed for modification.
- **Liskov Substitution Principle:** Our methods can be used interchangeably without altering the correctness of the program.
- **Interface Segregation Principle:** We create specific methods for each operation, avoiding large, monolithic interfaces.
- **Dependency Inversion Principle:** We depend on abstractions (interfaces) rather than concrete implementations.

## Conclusion

By following this guide, you should now have a solid understanding of how to perform CRUD operations in Azure Cosmos DB using C#. We've extended the CosmosClient class with custom methods and ensured our code adheres to SOLID principles for better maintainability and scalability.

## Sources & Further Reading

1. [Azure Cosmos DB — .NET SDK quickstart](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/quickstart-dotnet)
2. [Cosmos DB CRUD with .NET](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/how-to-dotnet-get-started)
3. [SOLID principles — Microsoft architecture guidance](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles)
4. [Partition keys — Cosmos DB design](https://learn.microsoft.com/en-us/azure/cosmos-db/partitioning-overview)

*See also:* [Mastering E2E Testing with C# Playwright (Jul 2024)]({% link _posts/2024-07-23-mastering-e2e-testing-csharp-playwright.md %}) — UI + API + database assertions in one test; this post covers the Cosmos side of that triangle.

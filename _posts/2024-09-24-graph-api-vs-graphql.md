---
layout: post
title: "Graph API vs GraphQL: Choosing the Right API for Your Data"
date: 2024-09-24
categories: [best-practices]
tags: [api, graphql, rest, microsoft-graph]
excerpt: "To connect Graph API to REST or WCF using an ACL:"
reading_time: 5
---

# 1. Graph API vs GraphQL

**Graph API**:
- **Definition**: A RESTful API that allows developers to access and interact with data from various Microsoft services like Office 365, Azure AD, and more.
- **Usage**: Uses standard HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources.
- **Example**: Fetching user data from Azure AD using a GET request.

**GraphQL**:
- **Definition**: A query language for APIs and a runtime for executing those queries by using a type system you define for your data.
- **Usage**: Allows clients to request exactly the data they need, reducing over-fetching and under-fetching of data.
- **Example**: Fetching specific fields of user data in a single query.

### Connecting Graph API to REST or WCF on an Anti-Corruption Layer

**Anti-Corruption Layer (ACL)**:
- **Definition**: A design pattern used to isolate different subsystems by translating requests and responses between them, ensuring that the core system remains unaffected by external systems[^1^].
- **Usage**: Acts as a mediator to prevent the &quot;corruption&quot; of the core system by external systems with different semantics or data models[^1^].

To connect Graph API to REST or WCF using an ACL:
1. **Implement the ACL**: Create a façade or adapter that translates Graph API requests to REST or WCF calls.
2. **Translate Requests**: Ensure that the ACL translates the data models and protocols between Graph API and the target system.
3. **Maintain Isolation**: Keep the core system's design clean and unaffected by external dependencies[^1^].

### 2. Graph API - Remote Schema, Whitelist of Queries, and Graph

**Remote Schema**:
- **Definition**: A schema that defines how external content will be used in various Microsoft Graph experiences[^14^].
- **Usage**: Register the schema before adding items to the connection.

**Whitelist of Queries**:
- **Definition**: A list of pre-approved queries that can be executed against the API.
- **Usage**: Enhances security by restricting the queries that can be run.

**Graph**:
- **Definition**: Refers to the Microsoft Graph API, which provides a unified endpoint to access data from various Microsoft services.
- **Usage**: Allows developers to interact with a wide range of Microsoft services through a single API endpoint.

### Relationship and UML Diagram

These terms are related through their use in API design and data access. Here's a UML diagram in Mermaid to illustrate their relationships:

```mermaid
classDiagram
    class GraphAPI {
        +getUserData()
        +updateUserData()
    }
    class GraphQL {
        +queryData()
        +mutateData()
    }
    class AntiCorruptionLayer {
        +translateRequest()
        +translateResponse()
    }
    class RemoteSchema {
        +defineSchema()
    }
    class WhitelistOfQueries {
        +approveQuery()
    }
    class Graph {
        +accessData()
    }

    GraphAPI --> AntiCorruptionLayer : uses
    GraphQL --> AntiCorruptionLayer : uses
    AntiCorruptionLayer --> Graph : interacts
    Graph --> RemoteSchema : uses
    Graph --> WhitelistOfQueries : uses
```

### Comparison Table

| Term                  | Definition                                                                 | Usage                                                                                   |
|-----------------------|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| Graph API             | RESTful API for Microsoft services                                          | CRUD operations on resources using HTTP methods                                         |
| GraphQL               | Query language for APIs                                                     | Request specific data fields, reducing over-fetching and under-fetching                 |
| Anti-Corruption Layer | Design pattern to isolate subsystems                                        | Translates requests and responses between different systems                             |
| Remote Schema         | Schema defining external content usage                                      | Register schema before adding items to the connection                                   |
| Whitelist of Queries  | Pre-approved list of queries                                                | Enhances security by restricting executable queries                                     |
| Graph                 | Unified endpoint for accessing Microsoft services                           | Interact with various Microsoft services through a single API endpoint                  |


## Sources & Further Reading

1. [Microsoft Graph overview](https://learn.microsoft.com/en-us/graph/overview)
2. [Microsoft Graph best practices](https://learn.microsoft.com/en-us/graph/best-practices-concept)
3. [Anti-Corruption Layer — Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer)
4. [GraphQL vs REST — AWS comparison](https://aws.amazon.com/compare/the-difference-between-graphql-and-rest/)

*See also:* [Mastering GraphQL (Sep 2024)]({% link _posts/2024-09-25-mastering-graphql-key-concepts-best-practices.md %}) · [Hasura with Graph API and Hot Chocolate (Sep 2024)]({% link _posts/2024-09-24-hasura-with-graph-api-and-hot-chocolate.md %})

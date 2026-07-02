---
layout: post
title: "Why Choose Hasura Over Other GraphQL Tools?"
date: 2024-09-24
categories: [automation, best-practices]
tags: [graphql, hasura, dotnet, api, sql, real-time]
excerpt: "Combining Hasura, GraphQL, and Hot Chocolate can lead to powerful and efficient solutions for various applications. Here are some notable use cases:"
reading_time: 6
---

### **Why Choose Hasura Over Other Tools?**

**1. Instant GraphQL APIs**: Hasura can instantly generate a GraphQL API from your existing databases, which significantly reduces development time¹. This is particularly useful for quickly setting up a backend without writing boilerplate code.

**2. Real-time Capabilities**: Hasura supports real-time data with subscriptions, making it ideal for applications that require live updates¹. This feature is not as readily available or as easy to implement in many other tools.

**3. Unified API Layer**: Hasura can unify multiple data sources (e.g., databases, REST APIs) under a single GraphQL endpoint using Remote Schemas³. This simplifies the architecture and makes data management more efficient.

**4. Built-in Authorization and Permissions**: Hasura provides robust access control mechanisms out of the box, ensuring that your data is secure and compliant with various security standards⁴.

**5. Extensibility**: You can extend Hasura's capabilities with custom business logic using Actions and Event Triggers³. This allows you to integrate with other services and add custom functionality as needed.

### **When to Use Hasura, GraphQL, and Hot Chocolate Together**

**[1](https://www.codedaily.io/tutorials/Why-You-Should-Use-Hasura). Building a Unified API**: Use Hasura to quickly generate a GraphQL API from your database and unify it with other data sources. Then, use Hot Chocolate to build custom GraphQL APIs in .NET and integrate them with Hasura using Remote Schemas⁴.

**2. Leveraging Real-time Data**: If your application requires real-time updates, Hasura's subscription feature can handle this efficiently. Combine this with Hot Chocolate's flexibility to manage complex, custom logic¹.

**3. Simplifying Development**: Hasura can handle the heavy lifting of generating the GraphQL API, while Hot Chocolate can be used for more complex, custom logic. This combination allows you to focus on building features rather than boilerplate code⁴.

**4. Efficient Data Fetching**: GraphQL allows clients to request exactly the data they need, reducing over-fetching and under-fetching issues common with REST APIs⁵. This is particularly useful when you have multiple data sources and need to aggregate data efficiently.


### **Hasura vs. Apollo: A Summary**

#### **Hasura**

- **Instant GraphQL APIs**: Quickly generates GraphQL APIs from existing databases.
- **Real-time Capabilities**: Supports real-time data with subscriptions.
- **Unified API Layer**: Unifies multiple data sources under a single GraphQL endpoint.
- **Built-in Authorization and Permissions**: Robust access control mechanisms.
- **Extensibility**: Custom business logic with Actions and Event Triggers.

#### **Apollo**

- **Schema-First Approach**: Flexible schema definition and resolvers.
- **Comprehensive Tooling**: Includes Apollo Server, Apollo Client, and Apollo GraphOS.
- **Federation Support**: Composes multiple GraphQL services into a single graph.
- **Strong Community and Ecosystem**: Extensive documentation and third-party integrations.
- **Customization**: High degree of customization for resolvers and middleware.

### **When to Use Each**

**Use Hasura if:**
- You need a quick GraphQL API from an existing database.
- Your application requires real-time updates.
- You want built-in authentication, authorization, and API management.
- You need to unify multiple data sources.

**Use Apollo if:**
- You prefer a schema-first approach.
- You need comprehensive tooling for server and client-side development.
- You are building a large, federated GraphQL architecture.
- You require high customization and flexibility.

### **Use Cases of Hasura with Graph API and Hot Chocolate**

Combining Hasura, GraphQL, and Hot Chocolate can lead to powerful and efficient solutions for various applications. Here are some notable use cases:

#### **1. Real-time Dashboards**
- **Scenario**: Building interactive dashboards that reflect live data changes.
- **How**: Use Hasura's real-time subscriptions to automatically update the dashboard whenever the underlying data changes³. Hot Chocolate can be used to handle complex business logic and custom queries.

#### **2. Unified API Layer**
- **Scenario**: Integrating multiple data sources into a single API.
- **How**: Hasura can unify data from different databases and REST APIs under a single GraphQL endpoint using Remote Schemas¹. Hot Chocolate can extend this by adding custom GraphQL endpoints that integrate seamlessly with Hasura.

#### **3. Rapid Prototyping**
- **Scenario**: Quickly setting up a backend for a new application.
- **How**: Hasura can instantly generate a GraphQL API from your existing database, allowing you to focus on frontend development¹. Hot Chocolate can be used to add custom logic and extend the API as needed.

#### **4. Microservices Architecture**
- **Scenario**: Building a microservices architecture with GraphQL.
- **How**: Use Hasura to manage the data layer and unify various microservices under a single GraphQL endpoint². Hot Chocolate can be used to build individual microservices that communicate with Hasura.

#### **5. Custom Business Logic**
- **Scenario**: Implementing complex business logic in your GraphQL API.
- **How**: Hasura handles the basic CRUD operations and real-time data, while Hot Chocolate is used to implement custom business logic and advanced queries¹.

#### **6. Legacy System Integration**
- **Scenario**: Integrating with legacy systems that use REST APIs.
- **How**: Hasura can convert REST endpoints to GraphQL using REST Connectors². Hot Chocolate can be used to further customize and extend these endpoints.

### **Example Workflow**

[1](https://byuroscope.com/hasura/). **Set Up Hasura**: Connect Hasura to your database to automatically generate a GraphQL API.
2. **Create Custom Endpoints with Hot Chocolate**: Use Hot Chocolate to build custom GraphQL endpoints in .NET.
3. **Integrate with Hasura**: Use Hasura's Remote Schema feature to integrate Hot Chocolate endpoints into the unified API¹.
4. **Leverage Real-time Capabilities**: Use Hasura's subscriptions to enable real-time updates in your application³.


## Sources & Further Reading

* [Getting Started with Hot Chocolate .NET GraphQL Server — Hasura](https://hasura.io/blog/getting-started-with-hot-chocolate-dot-net-graphql-server-and-hasura-remote-schema)
* [GraphQL Server with .NET — Hasura Tutorial](https://hasura.io/learn/graphql/backend-stack/languages/dotnet/)
* [Hasura use cases overview](https://hasura.io/docs/latest/getting-started/use-case/overview/)
* [Hasura use cases overview](https://hasura.io/docs/latest/getting-started/use-case/overview/)
* [Hasura explained — Restack](https://www.restack.io/docs/hasura-knowledge-hasura-explained)
* [Hasura v3 Course Introduction](https://hasura.io/learn/graphql/hasura-v3/introduction/)
* [Building Scalable Real-Time Apps with Hasura — dev.to](https://dev.to/sebiweise/hasura-building-scalable-and-real-time-applications-an-extensive-guide-7b5)
* [Prisma vs Hasura — r/graphql](https://www.reddit.com/r/graphql/comments/nc7nh8/prisma_2_vs_hasura_vs_something_else/)
* [Guide to GraphQL — graphjin wiki](https://github.com/dosco/graphjin/wiki/Guide-to-GraphQL)

*See also:* [Hasura with Graph API and Hot Chocolate (Sep 2024)]({% link _posts/2024-09-24-hasura-with-graph-api-and-hot-chocolate.md %}) · [Modernizing Your Skills: Embracing GraphQL (Sep 2024)]({% link _posts/2024-09-24-modernizing-skills-embracing-graphql.md %})


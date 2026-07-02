---
layout: post
title: "Why and When to Use Hasura with Graph API and Hot Chocolate"
date: 2024-09-24
categories: [automation, frameworks]
tags: [graphql, hasura, dotnet, hot-chocolate, api]
excerpt: "Movie DB, SQL backend, REST actor API — one GraphQL layer on top. How I wired Hasura + Hot Chocolate without losing the plot."
reading_time: 3
---

**Hasura** is a powerful tool for generating GraphQL APIs from your existing databases. It automates much of the boilerplate code and provides real-time capabilities, making it an excellent choice for quickly building scalable and maintainable GraphQL backends.

**Hot Chocolate** is an open-source GraphQL server for the .NET platform. It simplifies the process of building GraphQL APIs by providing built-in features for queries, mutations, and subscriptions.

**Use Case Example:**

Imagine you are building a movie database application. You want to query data from multiple sources, such as a SQL database for movie details and a REST API for actor biographies. Here's how you can use Hasura and Hot Chocolate together:

1. **Set Up Hasura**: Connect Hasura to your SQL database to auto-generate a GraphQL API for your movie data.
2. **Create a GraphQL Server with Hot Chocolate**: Use Hot Chocolate to build a custom GraphQL server that fetches actor biographies from the REST API.
3. **Integrate with Hasura**: Use Hasura's Remote Schema feature to merge the Hot Chocolate GraphQL server with the Hasura-generated schema, providing a unified GraphQL API.

### Why Not Apollo or Another GraphQL Client?

**Apollo** is another popular GraphQL client and server solution. It offers a robust ecosystem for building and managing GraphQL APIs. However, there are some differences between Hasura and Apollo that might influence your choice:

| Feature                | Hasura                                      | Apollo                                      |
|------------------------|---------------------------------------------|---------------------------------------------|
| **Setup Time**         | Quick setup with auto-generated APIs        | Requires more manual setup and coding       |
| **Real-time Capabilities** | Built-in real-time subscriptions            | Requires additional setup for real-time     |
| **Data Source Integration** | Direct integration with databases and REST APIs | Primarily focuses on schema-first approach  |
| **Authorization**      | Declarative, built-in authorization         | Custom implementation needed                |
| **Performance**        | Optimized for high performance              | Performance depends on custom implementation|
| **Community Support**  | Growing community, strong support           | Large, established community                |

**Why Choose Hasura?**
- **Speed**: Quickly go from data source to production-ready GraphQL API without writing resolvers[^1^].
- **Real-time**: Built-in real-time capabilities without additional setup[^5^].
- **Unified API**: Easily merge multiple data sources into a single GraphQL endpoint[^1^].

**Why Choose Apollo?**
- **Flexibility**: Highly customizable and flexible for complex use cases[^7^].
- **Ecosystem**: Extensive tools and libraries for both client and server-side development[^7^].

Choosing between Hasura and Apollo depends on your specific needs and project requirements. If you need a quick, real-time, and database-integrated solution, Hasura is a great choice. If you require more customization and flexibility, Apollo might be more suitable.


## Sources & Further Reading

1. [Getting Started with Hot Chocolate + Hasura Remote Schema](https://hasura.io/blog/getting-started-with-hot-chocolate-dot-net-graphql-server-and-hasura-remote-schema)
2. [GraphQL Server with .NET — Hasura Tutorial](https://hasura.io/learn/graphql/backend-stack/languages/dotnet/)
3. [Hasura vs Apollo — platform comparison](https://hasura.io/blog/hasura-vs-apollo-comparing-graphql-platforms)
4. [Hot Chocolate — .NET GraphQL server](https://chillicream.com/docs/hotchocolate)

*See also:* [Why Choose Hasura Over Other Tools (Sep 2024)]({% link _posts/2024-09-24-why-choose-hasura-over-other-tools.md %}) · [Mastering GraphQL (Sep 2024)]({% link _posts/2024-09-25-mastering-graphql-key-concepts-best-practices.md %})
